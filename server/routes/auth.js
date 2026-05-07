import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { findUserByUsername, insertUser, insertSession } from '../db.js';
import { hashToken, signAuthToken, requireAuth } from '../auth.js';

// Register
export function register(req, res) {
  try {
    const { username, password, nickname } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }
    const trimmedUsername = String(username).trim();
    const trimmedPassword = String(password).trim();

    if (trimmedUsername.length < 3) {
      return res.status(400).json({ error: 'Username must be at least 3 characters' });
    }
    if (trimmedUsername.length > 50) {
      return res.status(400).json({ error: 'Username must not exceed 50 characters' });
    }
    if (trimmedPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }
    if (trimmedPassword.length > 100) {
      return res.status(400).json({ error: 'Password must not exceed 100 characters' });
    }

    const existing = findUserByUsername(trimmedUsername);
    if (existing) {
      return res.status(409).json({ error: 'Username already exists' });
    }

    const hashed = bcrypt.hashSync(trimmedPassword, 8);
    const trimmedNickname = nickname ? String(nickname).trim().slice(0, 100) : trimmedUsername;
    const newUser = {
      id: crypto.randomUUID(),
      username: trimmedUsername,
      password: hashed,
      nickname: trimmedNickname,
      createdAt: new Date().toISOString(),
    };

    insertUser(newUser);

    const token = signAuthToken({ userId: newUser.id, username: newUser.username });
    const tokenHash = hashToken(token);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
    insertSession({
      id: crypto.randomUUID(),
      userId: newUser.id,
      tokenHash,
      createdAt: now.toISOString(),
      expiresAt,
    });

    res.json({
      success: true,
      user: { id: newUser.id, username: newUser.username, nickname: newUser.nickname },
      token,
    });
  } catch (error) {
    console.error('Register error:', error.message);
    res.status(500).json({ error: 'Registration failed' });
  }
}

// Login
export function login(req, res) {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const trimmedUsername = String(username).trim();
    const trimmedPassword = String(password).trim();

    const user = findUserByUsername(trimmedUsername);

    if (!user) {
      return res.status(401).json({ error: 'Account does not exist, please register first' });
    }

    if (!bcrypt.compareSync(trimmedPassword, user.password)) {
      return res.status(401).json({ error: 'Incorrect password' });
    }

    const token = signAuthToken({ userId: user.id, username: user.username });
    const tokenHash = hashToken(token);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
    insertSession({
      id: crypto.randomUUID(),
      userId: user.id,
      tokenHash,
      createdAt: now.toISOString(),
      expiresAt,
    });

    res.json({
      success: true,
      user: { id: user.id, username: user.username, nickname: user.nickname },
      token,
    });
  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({ error: 'Login failed' });
  }
}

export function me(req, res) {
  res.json({
    success: true,
    user: {
      id: req.user.id,
      username: req.user.username,
      nickname: req.user.nickname,
    },
  });
}

export const authMiddleware = requireAuth;
