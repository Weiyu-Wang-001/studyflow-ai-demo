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

  db.run(
    `CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      tokenHash TEXT UNIQUE NOT NULL,
      createdAt TEXT NOT NULL,
      expiresAt TEXT NOT NULL,
      revoked INTEGER DEFAULT 0
    )`
  );

  // Seed initial resources if table empty
  const countStmt = db.prepare('SELECT COUNT(1) as cnt FROM resources');
  try {
    let shouldSeed = true;
    if (countStmt.step()) {
      const row = countStmt.getAsObject();
      shouldSeed = !row.cnt;
    }
    countStmt.free();

    if (shouldSeed) {
      // Basic seed data moved from former src/data/resources.ts
      const seeds = [
        {
          id: '1',
          title: 'OpenFlow Lecture 4',
          type: 'PDF',
          course: 'CMPE 210',
          description: 'Key concepts of OpenFlow architecture, controllers, flow rules, and packet handling.',
          tags: ['SDN', 'OpenFlow', 'Networking'],
          updatedAt: '2 hours ago',
          favorite: 1,
          status: 'Reviewing',
          progress: 82,
          tone: 'blue',
          content:
            'OpenFlow separates the control plane from the data plane, allowing a centralized controller to manage switch behavior and install forwarding rules dynamically.',
        },
        {
          id: '2',
          title: 'Week 6 SDN Architecture Slides',
          type: 'Slides',
          course: 'CMPE 210',
          description: 'Visual overview of SDN layers, APIs, controller responsibilities, and switch interactions.',
          tags: ['Architecture', 'Controller'],
          updatedAt: 'Yesterday',
          favorite: 0,
          status: 'Ready',
          progress: 65,
          tone: 'violet',
          content:
            'The slide deck explains the application, control, and infrastructure layers and compares northbound and southbound interfaces in a modern SDN stack.',
        },
        {
          id: '3',
          title: 'Campus Marketplace Wireframe',
          type: 'Image',
          course: 'CMPE 272',
          description: 'Low-fidelity UI exploration for homepage navigation, category chips, and product discovery.',
          tags: ['UI', 'Prototype', 'Wireframe'],
          updatedAt: '3 days ago',
          favorite: 1,
          status: 'Pinned',
          progress: 41,
          tone: 'amber',
          content:
            'The wireframe focuses on visual hierarchy, scan-friendly cards, and filtering patterns that reduce interaction friction for first-time users.',
        },
        {
          id: '4',
          title: 'Project GitHub Repository',
          type: 'Link',
          course: 'Hackathon',
          description: 'Source code, setup notes, team task split, and deployment checklist for the final demo.',
          tags: ['GitHub', 'Code', 'Team'],
          updatedAt: '4 days ago',
          favorite: 0,
          status: 'Shared',
          progress: 90,
          tone: 'emerald',
          content:
            'The repo documents the React frontend structure, potential Express endpoints, deployment steps, and a lightweight workflow for collaborative development.',
        },
        {
          id: '5',
          title: 'Hash Functions Summary',
          type: 'PDF',
          course: 'CMPE 209',
          description: 'Compact review notes for hash properties, attacks, and exam preparation.',
          tags: ['Security', 'Hash', 'Exam'],
          updatedAt: '5 days ago',
          favorite: 0,
          status: 'Reviewing',
          progress: 58,
          tone: 'rose',
          content:
            'A secure hash should be preimage resistant, second-preimage resistant, and collision resistant. MD5 and SHA-1 are no longer suitable for many security-sensitive use cases.',
        },
        {
          id: '6',
          title: 'Final Demo Flow',
          type: 'Slides',
          course: 'Hackathon',
          description: 'Structured presentation notes for why, what, how, and UX considerations.',
          tags: ['Demo', 'Presentation', 'UX'],
          updatedAt: '1 week ago',
          favorite: 1,
          status: 'Ready',
          progress: 96,
          tone: 'cyan',
          content:
            'This material frames the product as a UI-first web application with unified search, a clean information architecture, and AI as a meaningful enhancement rather than the main focus.',
        },
        {
          id: '7',
          title: 'Study Plan Notes',
          type: 'Notes',
          course: 'Workspace',
          description: 'Personal study checklist with high-priority topics and quick review reminders.',
          tags: ['Notes', 'Planning', 'Checklist'],
          updatedAt: 'Today',
          favorite: 0,
          status: 'In Progress',
          progress: 27,
          tone: 'slate',
          content:
            'Focus on OpenFlow, hash functions, web UI examples, and final presentation timing. Review slides with active recall and short summary prompts.',
        },
        {
          id: '8',
          title: 'System Design Demo Video',
          type: 'Video',
          course: 'Hackathon',
          description: 'Recorded concept for walking through dashboard, search, drawer, and AI interactions.',
          tags: ['Video', 'Workflow', 'Demo'],
          updatedAt: '2 days ago',
          favorite: 0,
          status: 'Draft',
          progress: 34,
          tone: 'indigo',
          content:
            'The walkthrough demonstrates how users move from dashboard insights to resource discovery, then into detail review and AI-assisted summarization.',
        },
      ];

      // map some seed items to sample pdf files
      const sampleMap = {
        '1': 'sample-1.pdf',
        '2': 'sample-2.pdf',
        '5': 'sample-3.pdf',
      };

      seeds.forEach((s) => {
        const sampleName = sampleMap[s.id];
        const filePath = sampleName ? path.relative(process.cwd(), path.join(DATA_DIR, 'uploads', sampleName)) : null;
        insertResource({
          id: s.id,
          ownerId: null,
          title: s.title,
          type: s.type,
          course: s.course,
          description: s.description,
          tags: s.tags,
          updatedAt: s.updatedAt,
          favorite: !!s.favorite,
          status: s.status,
          progress: s.progress,
          tone: s.tone,
          content: s.content,
          filePath: filePath,
        });
      });
    }
  } catch (e) {
    try { countStmt.free(); } catch {}
    console.error('DB seed check error', e);
  }

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

export function findUserById(id) {
  const stmt = db.prepare('SELECT * FROM users WHERE id = :id');
  try {
    stmt.bind({ ':id': id });
    if (stmt.step()) {
      return stmt.getAsObject();
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

export function listAllResources() {
  const stmt = db.prepare('SELECT * FROM resources ORDER BY updatedAt DESC');
  try {
    const results = [];
    while (stmt.step()) results.push(stmt.getAsObject());
    return results;
  } finally {
    stmt.free();
  }
}

export function updateResourceFavorite(id, favorite) {
  const stmt = db.prepare('UPDATE resources SET favorite = :favorite WHERE id = :id');
  try {
    stmt.run({ ':favorite': favorite ? 1 : 0, ':id': id });
    saveDB();
  } finally {
    stmt.free();
  }
}

export function updateResourceProgress(id, progress) {
  const stmt = db.prepare('UPDATE resources SET progress = :progress, updatedAt = :updatedAt WHERE id = :id');
  try {
    stmt.run({ ':progress': Number(progress) || 0, ':updatedAt': new Date().toISOString(), ':id': id });
    saveDB();
  } finally {
    stmt.free();
  }
}

export function listFavoritesByOwner(ownerId) {
  const stmt = db.prepare('SELECT * FROM resources WHERE ownerId = :ownerId AND favorite = 1 ORDER BY updatedAt DESC');
  try {
    stmt.bind({ ':ownerId': ownerId });
    const results = [];
    while (stmt.step()) results.push(stmt.getAsObject());
    return results;
  } finally {
    stmt.free();
  }
}

export function insertSession({ id, userId, tokenHash, createdAt, expiresAt }) {
  const stmt = db.prepare(
    'INSERT INTO sessions (id, userId, tokenHash, createdAt, expiresAt, revoked) VALUES (:id, :userId, :tokenHash, :createdAt, :expiresAt, 0)'
  );
  try {
    stmt.run({
      ':id': id,
      ':userId': userId,
      ':tokenHash': tokenHash,
      ':createdAt': createdAt,
      ':expiresAt': expiresAt,
    });
    saveDB();
  } finally {
    stmt.free();
  }
}

export function findSessionByTokenHash(tokenHash) {
  const stmt = db.prepare('SELECT * FROM sessions WHERE tokenHash = :tokenHash LIMIT 1');
  try {
    stmt.bind({ ':tokenHash': tokenHash });
    if (stmt.step()) return stmt.getAsObject();
    return null;
  } finally {
    stmt.free();
  }
}

export function revokeSessionByTokenHash(tokenHash) {
  const stmt = db.prepare('UPDATE sessions SET revoked = 1 WHERE tokenHash = :tokenHash');
  try {
    stmt.run({ ':tokenHash': tokenHash });
    saveDB();
  } finally {
    stmt.free();
  }
}

