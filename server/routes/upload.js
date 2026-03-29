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
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== 'application/pdf' && path.extname(file.originalname).toLowerCase() !== '.pdf') {
      return cb(new Error('Only PDF files are allowed'));
    }
    cb(null, true);
  },
});

export const router = (app) => {
  app.post('/api/files/upload', upload.single('file'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    try {
      const buffer = fs.readFileSync(req.file.path);
      const parsed = await pdfParse(buffer);
      const text = parsed.text || '';

      const resource = {
        id: crypto.randomUUID(),
        ownerId: req.body.ownerId || null,
        title: req.body.title || req.file.originalname,
        type: 'PDF',
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
