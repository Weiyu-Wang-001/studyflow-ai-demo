import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import multer from 'multer';
import pdfParse from 'pdf-parse';
import crypto from 'crypto';
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
      let text = '';
      if (type === 'PDF') {
        console.log('[upload] Reading file from:', p);
        const buffer = fs.readFileSync(p);

        console.log('[upload] Parsing PDF...');
        const parsed = await pdfParse(buffer);
        text = parsed.text || '';
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
        content: text,
        filePath: path.relative(process.cwd(), p),
      };

      console.log('[upload] Inserting resource into DB...');
      insertResource(resource);

      console.log('[upload] Upload successful, resource id:', resource.id);
      res.json({ success: true, resource });
    } catch (err) {
      console.error('[upload] ERROR:', err);
      const message = err.message || 'Failed to process file';
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
      res.status(400).json({ error: err.message || 'Failed to list resources' });
    }
  });
};
