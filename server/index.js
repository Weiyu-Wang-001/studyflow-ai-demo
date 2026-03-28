import express from 'express';
import cors from 'cors';
import { initDB } from './db.js';

const app = express();
const PORT = 3008;

await initDB();

const { aiChat, aiSummarize } = await import('./routes/ai.js');
const { register, login } = await import('./routes/auth.js');
const { uploadResource, getResources } = await import('./routes/upload.js');

app.use(cors());
app.use(express.json());

// Auth routes
app.post('/api/auth/register', register);
app.post('/api/auth/login', login);

// AI routes
app.post('/api/ai/chat', aiChat);
app.post('/api/ai/summarize', aiSummarize);

// Resource routes
app.post('/api/upload', uploadResource);
app.get('/api/resources', getResources);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
