import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { findSessionByTokenHash, findUserById } from './db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-insecure-secret-change-me';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

if (!process.env.JWT_SECRET) {
  console.warn('Warning: JWT_SECRET not set. Using insecure development default secret.');
}

export function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function signAuthToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyAuthToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

export function requireAuth(req, res, next) {
  try {
    const auth = req.headers.authorization || '';
    console.log('[requireAuth] Authorization header:', auth ? auth.substring(0, 30) + '...' : 'empty');
    if (!auth.startsWith('Bearer ')) {
      console.warn('[requireAuth] Missing Bearer prefix');
      return res.status(401).json({ error: 'Missing Bearer token' });
    }

    const token = auth.slice('Bearer '.length).trim();
    if (!token) {
      console.warn('[requireAuth] Token is empty after slice');
      return res.status(401).json({ error: 'Missing token' });
    }

    const decoded = verifyAuthToken(token);
    console.log('[requireAuth] Token verified, userId:', decoded.userId);
    const tokenHash = hashToken(token);
    const session = findSessionByTokenHash(tokenHash);

    if (!session || Number(session.revoked) === 1) {
      console.warn('[requireAuth] Session invalid or revoked');
      return res.status(401).json({ error: 'Session invalid or revoked' });
    }

    if (new Date(session.expiresAt).getTime() <= Date.now()) {
      console.warn('[requireAuth] Session expired');
      return res.status(401).json({ error: 'Session expired' });
    }

    const user = findUserById(decoded.userId);
    if (!user) {
      console.warn('[requireAuth] User not found');
      return res.status(401).json({ error: 'User not found' });
    }

    req.user = {
      id: user.id,
      username: user.username,
      nickname: user.nickname,
      token,
      tokenHash,
      sessionId: session.id,
    };

    next();
  } catch (error) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
}
