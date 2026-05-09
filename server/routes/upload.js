import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import multer from 'multer';
import pdfParse from 'pdf-parse';
import libre from 'libreoffice-convert';
import crypto from 'crypto';
import tesseract from 'node-tesseract-ocr';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
import { exec } from 'child_process';
import { insertResource, listResourcesByOwner, listAllResources } from '../db.js';
import { validateUploadPayload, validateListResourcesQuery, MAX_FILE_SIZE } from '../validators.js';
import { requireAuth } from '../auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOAD_DIR = path.join(__dirname, '..', 'data', 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// Multer storage (local disk)
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const id = crypto.randomUUID();
    const safe = `${id}${path.extname(file.originalname)}`;
    cb(null, safe);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
});

// configure fluent-ffmpeg to use static binary when available
if (ffmpegStatic) {
  try { ffmpeg.setFfmpegPath(ffmpegStatic); } catch (e) { /* ignore */ }
}

function inferResourceType(file) {
  const ext = path.extname(file?.originalname || '').toLowerCase();
  const mime = String(file?.mimetype || '').toLowerCase();

  if (mime === 'application/pdf' || ext === '.pdf') return 'PDF';
  if (mime.startsWith('image/') || ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'].includes(ext)) return 'Image';
  if (mime.startsWith('video/') || ['.mp4', '.mov', '.webm', '.mkv'].includes(ext)) return 'Video';
  if (
    ['.ppt', '.pptx', '.key'].includes(ext) ||
    mime.includes('presentation') ||
    mime.includes('powerpoint')
  ) return 'Slides';
  if (mime.startsWith('text/') || ['.md', '.txt'].includes(ext)) return 'Notes';
  // Document/office files
  if (
    ['.doc', '.docx', '.xlsx', '.xls', '.pptx', '.odt', '.rtf'].includes(ext) ||
    mime.includes('word') ||
    mime.includes('document') ||
    mime.includes('excel') ||
    mime.includes('spreadsheet') ||
    mime.includes('officedocument')
  ) return 'File';

  return 'File';
}

export const router = (app) => {
  app.post('/api/files/upload', requireAuth, upload.single('file'), async (req, res) => {
    console.log('[upload] POST /api/files/upload started');
    console.log('[upload] req.user:', req.user?.id);
    console.log('[upload] req.file:', req.file?.filename);

    if (!req.file) {
      console.warn('[upload] No file uploaded');
      return res.status(400).json({ error: 'No file uploaded' });
    }

    try {
      console.log('[upload] Validating payload...');
      // Validate input payload
      const validated = validateUploadPayload(req.body, req.file.originalname);
      const p = req.file.path || path.join(UPLOAD_DIR, req.file.filename || req.file.originalname);

        const type = inferResourceType(req.file);
        let contentText = '';

        // determine extension and common groups
        const ext = path.extname(req.file.originalname || '').toLowerCase();
        const imageExts = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.bmp', '.tiff'];
        const videoExts = ['.mp4', '.mov', '.webm', '.mkv', '.avi', '.flv'];

        console.log('[upload] File extension:', ext);
        console.log('[upload] Is image?', imageExts.includes(ext));
        console.log('[upload] Is video?', videoExts.includes(ext));

        // If uploaded file is an image, run local OCR (Tesseract)
        if (imageExts.includes(ext)) {
          try {
            console.log('[upload] Running OCR on image:', p);
            console.log('[upload] File exists:', fs.existsSync(p));
            console.log('[upload] File size:', fs.statSync(p)?.size);
            
            const ocrConfig = { lang: 'eng', oem: 1, psm: 3 };
            console.log('[upload] OCR config:', ocrConfig);
            
            const ocrResult = await tesseract.recognize(p, ocrConfig);
            console.log('[upload] OCR raw result type:', typeof ocrResult);
            console.log('[upload] OCR raw result keys:', Object.keys(ocrResult || {}));
            console.log('[upload] OCR raw result:', JSON.stringify(ocrResult).substring(0, 500));
            
            // Try multiple extraction paths
            contentText = (ocrResult?.data?.text || ocrResult?.text || String(ocrResult || '')).trim();
            console.log('[upload] OCR text length:', contentText.length);
            if (contentText) console.log('[upload] OCR extracted text (first 200 chars):', contentText.substring(0, 200));
            else console.warn('[upload] OCR returned empty text');
          } catch (ocrErr) {
            console.error('[upload] OCR ERROR (not just warning):', {
              message: ocrErr?.message,
              stack: ocrErr?.stack,
              fullError: String(ocrErr)
            });
          }
        }

        // If uploaded file is a video, extract audio and attempt local transcription
        else if (videoExts.includes(ext)) {
          try {
            console.log('[upload] Extracting audio from video for transcription:', p);
            const audioName = `${path.basename(p, path.extname(p))}.wav`;
            const audioPath = path.join(UPLOAD_DIR, audioName);

            await new Promise((resolve, reject) => {
              ffmpeg(p)
                .noVideo()
                .audioCodec('pcm_s16le')
                .audioChannels(1)
                .audioFrequency(16000)
                .format('wav')
                .save(audioPath)
                .on('end', () => resolve(null))
                .on('error', (err) => reject(err));
            });

            console.log('[upload] Audio extracted to:', audioPath);

            const whisperCmd = process.env.WHISPER_CMD || 'whisper';
            const whisperArgs = process.env.WHISPER_ARGS || `--model tiny --output_format txt --output_dir ${UPLOAD_DIR}`;
            try {
              const cmd = `${whisperCmd} "${audioPath}" ${whisperArgs}`;
              console.log('[upload] Running transcription command:', cmd);
              const { stdout } = await new Promise((resolve, reject) => {
                exec(cmd, { maxBuffer: 10 * 1024 * 1024 }, (err, stdout, stderr) => {
                  if (err) return reject({ err, stdout, stderr });
                  resolve({ stdout, stderr });
                });
              });
              console.log('[upload] Transcription stdout len:', String(stdout || '').length);

              const txtPath = path.join(UPLOAD_DIR, `${path.basename(audioName, '.wav')}.txt`);
              if (fs.existsSync(txtPath)) {
                contentText = fs.readFileSync(txtPath, 'utf8');
              } else {
                contentText = String(stdout || '').trim();
              }
            } catch (tcErr) {
              console.warn('[upload] Transcription command failed:', tcErr?.err || tcErr);
            }
          } catch (videoErr) {
            console.warn('[upload] Video processing failed:', videoErr?.message || videoErr);
          }
        }

        // If uploaded file is a document (office formats), attempt to convert to PDF for preview
        const docExts = ['.doc', '.docx', '.odt', '.rtf', '.ppt', '.pptx', '.xls', '.xlsx'];

        if (docExts.includes(ext)) {
          try {
            console.log('[upload] Attempting document -> PDF conversion for:', p);
            const inputBuf = fs.readFileSync(p);
            const pdfBuf = await new Promise((resolve, reject) => {
              libre.convert(inputBuf, '.pdf', undefined, (err, done) => {
                if (err) return reject(err);
                resolve(done);
              });
            });

            const pdfName = `${path.basename(p, path.extname(p))}.pdf`;
            const pdfPath = path.join(UPLOAD_DIR, pdfName);
            fs.writeFileSync(pdfPath, pdfBuf);

            // switch working file to the generated PDF for parsing and preview
            console.log('[upload] Conversion successful, pdf saved to:', pdfPath);
            // Keep original file but use PDF for resource.filePath
            req.file._convertedPdfPath = pdfPath;
          } catch (convErr) {
            console.warn('[upload] Document conversion failed, will keep original file for preview:', convErr?.message || convErr);
          }
        }

        // If a converted PDF exists, treat it as the file to read/parse
        const effectivePath = req.file._convertedPdfPath || p;

        if (effectivePath && (effectivePath.toLowerCase().endsWith('.pdf') || (type === 'PDF'))) {
        console.log('[upload] Reading file from:', p);
          const buffer = fs.readFileSync(effectivePath);

          console.log('[upload] Parsing PDF...');
          const parsed = await pdfParse(buffer);
          contentText = parsed.text || '';
      } else if ((req.file.mimetype || '').startsWith('text/') || ['.txt', '.md'].includes(path.extname(req.file.originalname).toLowerCase())) {
        // read plain text files
        contentText = fs.readFileSync(p, 'utf8');
      }

      console.log('[upload] Creating resource object...');
      const resource = {
        id: crypto.randomUUID(),
        ownerId: req.user.id,
        title: validated.title || req.file.originalname,
        type,
        course: validated.course || 'Uploaded',
        description: validated.description || '',
        tags: validated.tags || [],
        updatedAt: new Date().toISOString(),
        favorite: false,
        status: 'Uploaded',
        progress: 0,
        tone: 'slate',
        content: contentText,
        filePath: path.relative(process.cwd(), effectivePath),
      };

      console.log('[upload] Inserting resource into DB...');
      insertResource(resource);

      console.log('[upload] Upload successful, resource id:', resource.id);
      res.json({ success: true, resource });
    } catch (err) {
      console.error('[upload] ERROR:', err);
      const message = err?.message || 'Failed to process file';
      res.status(400).json({ error: message });
    }
  });

  // List resources (optionally filter by ownerId)
  app.get('/api/files/resources', requireAuth, (req, res) => {
    try {
      // Validate query parameters
      const validated = validateListResourcesQuery(req.query);

      const ownerId = validated.ownerId || req.user.id;
      let resources;
      if (ownerId) {
        if (ownerId !== req.user.id) {
          return res.status(403).json({ error: 'Not authorized to list other user resources' });
        }
        resources = listResourcesByOwner(ownerId);
      } else {
        resources = listAllResources();
      }
      res.json({ success: true, resources });
    } catch (err) {
      console.error('List resources error:', err);
      res.status(400).json({ error: err?.message || 'Failed to list resources' });
    }
  });
};
