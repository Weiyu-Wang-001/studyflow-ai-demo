import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const USERS_FILE = path.join(__dirname, '..', 'data', 'users.json');

// Ensure data directory and file exist
function ensureUsersFile() {
  const dir = path.dirname(USERS_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(USERS_FILE)) fs.writeFileSync(USERS_FILE, '[]', 'utf-8');
}

function readUsers() {
  ensureUsersFile();
  return JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'));
}

function writeUsers(users) {
  ensureUsersFile();
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf-8');
}

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

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

    const users = readUsers();
    const existing = users.find((u) => u.username === username);
    if (existing) {
      return res.status(409).json({ error: 'Username already exists' });
    }

    const newUser = {
      id: crypto.randomUUID(),
      username,
      password: hashPassword(password),
      nickname: nickname || username,
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);
    writeUsers(users);

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

    const users = readUsers();
    const user = users.find((u) => u.username === username);

    if (!user) {
      return res.status(401).json({ error: 'Account does not exist, please register first' });
    }

    if (user.password !== hashPassword(password)) {
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
