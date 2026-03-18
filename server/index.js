import express from 'express';
import cors from 'cors';
import { aiChat, aiSummarize } from './routes/ai.js';
import { register, login } from './routes/auth.js';

const app = express();
const PORT = 3008;

app.use(cors());
app.use(express.json());

// Auth routes
app.post('/api/auth/register', register);
app.post('/api/auth/login', login);

// AI routes
app.post('/api/ai/chat', aiChat);
app.post('/api/ai/summarize', aiSummarize);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
