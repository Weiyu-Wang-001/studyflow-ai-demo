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

