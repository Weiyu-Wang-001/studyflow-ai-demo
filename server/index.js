import express from 'express';
import path from 'path';
import fs from 'fs';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import { initDB } from './db.js';

dotenv.config();

const app = express();
const PORT = 3008;

await initDB();

const { aiChat, aiSummarize } = await import('./routes/ai.js');
const { register, login, me, authMiddleware } = await import('./routes/auth.js');
const uploadModule = await import('./routes/upload.js');
const resourcesModule = await import('./routes/resources.js');

app.use(cors());

// Serve uploaded files (PDFs and others) from server/data/uploads at /uploads/*
// Must be BEFORE express.json() to avoid parsing empty bodies from HEAD requests
const uploadsDir = path.join(process.cwd(), 'server', 'data', 'uploads');
app.use('/uploads', express.static(uploadsDir));
try {
  const items = fs.readdirSync(uploadsDir);
  console.log('Uploads static dir:', uploadsDir);
  console.log('Uploads files:', items);
} catch (e) {
  console.warn('Uploads dir read error', e.message);
}

app.use(express.json());

// simple request logger for debugging
app.use((req, res, next) => {
  if (req.path && (req.path.startsWith('/uploads') || req.path.startsWith('/uploads-test'))) {
    console.log('REQ', req.method, req.path);
  }
  next();
});

// Auth routes
app.post('/api/auth/register', register);
app.post('/api/auth/login', login);
app.get('/api/auth/me', authMiddleware, me);

// AI routes
app.post('/api/ai/chat', aiChat);
app.post('/api/ai/summarize', aiSummarize);

// Resource routes
uploadModule.router(app);
resourcesModule.router(app);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Temporary sendFile test route
app.get('/uploads-test/:name', (req, res) => {
  const file = path.join(uploadsDir, req.params.name);
  res.sendFile(file, (err) => {
    if (err) {
      console.error('sendFile error', err);
      res.status(err.status || 500).send(err.message);
    }
  });
});

// Global error handler (catch multer and other errors)
app.use((err, req, res, next) => {
  console.error('[ERROR]', err);
  if (err instanceof multer?.MulterError) {
    return res.status(400).json({ error: `Upload error: ${err.message}` });
  }
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
