import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { findUserByUsername, insertUser } from '../db.js';

// Register
export function register(req, res) {
  try {
    const { username, password, nickname } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }
    if (username.length < 3) {
      return res.status(400).json({ error: 'Username must be at least 3 characters' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const existing = findUserByUsername(username);
    if (existing) {
      return res.status(409).json({ error: 'Username already exists' });
    }

    const hashed = bcrypt.hashSync(password, 8);
    const newUser = {
      id: crypto.randomUUID(),
      username,
      password: hashed,
      nickname: nickname || username,
      createdAt: new Date().toISOString(),
    };

    insertUser(newUser);

    res.json({
      success: true,
      user: { id: newUser.id, username: newUser.username, nickname: newUser.nickname },
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

    const user = findUserByUsername(username);

    if (!user) {
      return res.status(401).json({ error: 'Account does not exist, please register first' });
    }

    if (!bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: 'Incorrect password' });
    }

    res.json({
      success: true,
      user: { id: user.id, username: user.username, nickname: user.nickname },
    });
  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({ error: 'Login failed' });
  }
}
