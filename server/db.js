import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import initSqlJs from 'sql.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const DB_FILE = path.join(DATA_DIR, 'studyflow.db');

let SQL;
let db;

function saveDB() {
  const data = db.export();
  fs.writeFileSync(DB_FILE, Buffer.from(data));
}

export async function initDB() {
  SQL = await initSqlJs({
    locateFile: (file) => path.join(process.cwd(), 'node_modules', 'sql.js', 'dist', file),
  });

  if (fs.existsSync(DB_FILE)) {
    const filebuffer = fs.readFileSync(DB_FILE);
    db = new SQL.Database(new Uint8Array(filebuffer));
  } else {
    db = new SQL.Database();
  }

  db.run(
    `CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      nickname TEXT,
      createdAt TEXT NOT NULL
    )`
  );

  db.run(
    `CREATE TABLE IF NOT EXISTS resources (
      id TEXT PRIMARY KEY,
      ownerId TEXT,
      title TEXT,
      type TEXT,
      course TEXT,
      description TEXT,
      tags TEXT,
      updatedAt TEXT,
      favorite INTEGER DEFAULT 0,
      status TEXT,
      progress INTEGER DEFAULT 0,
      tone TEXT,
      content TEXT,
      filePath TEXT
    )`
  );

  saveDB();
}

export function findUserByUsername(username) {
  const stmt = db.prepare('SELECT * FROM users WHERE username = :username');
  try {
    stmt.bind({ ':username': username });
    if (stmt.step()) {
      const row = stmt.getAsObject();
      return row;
    }
    return null;
  } finally {
    stmt.free();
  }
}

export function insertUser({ id, username, password, nickname, createdAt }) {
  const stmt = db.prepare(
    'INSERT INTO users (id, username, password, nickname, createdAt) VALUES (:id, :username, :password, :nickname, :createdAt)'
  );
  try {
    stmt.run({ ':id': id, ':username': username, ':password': password, ':nickname': nickname, ':createdAt': createdAt });
    saveDB();
  } finally {
    stmt.free();
  }
}

export function insertResource(resource) {
  const stmt = db.prepare(
    `INSERT INTO resources (id, ownerId, title, type, course, description, tags, updatedAt, favorite, status, progress, tone, content, filePath)
     VALUES (:id, :ownerId, :title, :type, :course, :description, :tags, :updatedAt, :favorite, :status, :progress, :tone, :content, :filePath)`
  );
  try {
    stmt.run({
      ':id': resource.id,
      ':ownerId': resource.ownerId || null,
      ':title': resource.title,
      ':type': resource.type,
      ':course': resource.course || null,
      ':description': resource.description || null,
      ':tags': (resource.tags || []).join(', '),
      ':updatedAt': resource.updatedAt || new Date().toISOString(),
      ':favorite': resource.favorite ? 1 : 0,
      ':status': resource.status || 'Uploaded',
      ':progress': resource.progress || 0,
      ':tone': resource.tone || null,
      ':content': resource.content || null,
      ':filePath': resource.filePath || null,
    });
    saveDB();
  } finally {
    stmt.free();
  }
}

export function findResourceById(id) {
  const stmt = db.prepare('SELECT * FROM resources WHERE id = :id');
  try {
    stmt.bind({ ':id': id });
    if (stmt.step()) return stmt.getAsObject();
    return null;
  } finally {
    stmt.free();
  }
}

export function listResourcesByOwner(ownerId) {
  const stmt = db.prepare('SELECT * FROM resources WHERE ownerId = :ownerId ORDER BY updatedAt DESC');
  try {
    stmt.bind({ ':ownerId': ownerId });
    const results = [];
    while (stmt.step()) results.push(stmt.getAsObject());
    return results;
  } finally {
    stmt.free();
  }
}

