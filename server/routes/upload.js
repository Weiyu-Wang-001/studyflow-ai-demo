import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import multer from 'multer';
import pdfParse from 'pdf-parse';
import crypto from 'crypto';
import { insertResource } from '../db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOAD_DIR = path.join(__dirname, '..', 'data', 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// Multer storage
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
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});

function mapToResourceType(file) {
  const ext = path.extname(file.originalname).toLowerCase();
  const mimetype = file.mimetype || '';

  if (mimetype === 'application/pdf' || ext === '.pdf') return 'PDF';
  if (mimetype.startsWith('image/')) return 'Image';
  if (mimetype.startsWith('video/')) return 'Video';
  if (ext === '.ppt' || ext === '.pptx' || ext === '.key' || mimetype.includes('presentation')) return 'Slides';
  if (mimetype.startsWith('text/') || ext === '.md' || ext === '.txt') return 'Notes';
  return 'Link';
}

export const router = (app) => {
  app.post('/api/files/upload', upload.single('file'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    try {
      const ext = path.extname(req.file.originalname).toLowerCase();
      const isPdf = req.file.mimetype === 'application/pdf' || ext === '.pdf';
      let text = '';

      if (isPdf) {
        const buffer = fs.readFileSync(req.file.path);
        const parsed = await pdfParse(buffer);
        text = parsed.text || '';
      } else if ((req.file.mimetype || '').startsWith('text/') || ext === '.txt' || ext === '.md') {
        text = fs.readFileSync(req.file.path, 'utf8');
      }

      const resource = {
        id: crypto.randomUUID(),
        ownerId: req.body.ownerId || null,
        title: req.body.title || req.file.originalname,
        type: mapToResourceType(req.file),
        course: req.body.course || 'Uploaded',
        description: req.body.description || '',
        tags: req.body.tags ? req.body.tags.split(',').map((t) => t.trim()) : [],
        updatedAt: new Date().toISOString(),
        favorite: false,
        status: 'Uploaded',
        progress: 0,
        tone: 'slate',
        content: text,
        filePath: path.relative(process.cwd(), req.file.path),
      };

      insertResource(resource);

      res.json({ success: true, resource });
    } catch (err) {
      console.error('Upload error:', err);
      res.status(500).json({ error: 'Failed to process PDF' });
    }
  });
};
