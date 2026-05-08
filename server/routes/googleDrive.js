import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import pdfParse from 'pdf-parse';
import { google } from 'googleapis';
import { insertResource } from '../db.js';
import { requireAuth } from '../auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOAD_DIR = path.join(__dirname, '..', 'data', 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

function sanitizeFileName(name) {
  return String(name || 'google-drive-file')
    .replace(/[\\/]+/g, '_')
    .replace(/[^a-zA-Z0-9._-]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '') || 'google-drive-file';
}

function extractFolderId(input) {
  const value = String(input || '').trim();
  if (!value) return '';

  const folderMatch = value.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  if (folderMatch?.[1]) return folderMatch[1];

  const queryMatch = value.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (queryMatch?.[1]) return queryMatch[1];

  if (/^[a-zA-Z0-9_-]+$/.test(value)) return value;
  return '';
}

function inferResourceType(fileName, mimeType) {
  const ext = path.extname(fileName || '').toLowerCase();
  const mime = String(mimeType || '').toLowerCase();

  if (mime === 'application/pdf' || ext === '.pdf') return 'PDF';
  if (mime.startsWith('image/') || ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'].includes(ext)) return 'Image';
  if (mime.startsWith('video/') || ['.mp4', '.mov', '.webm', '.mkv'].includes(ext)) return 'Video';
  if (
    mime === 'application/vnd.google-apps.presentation' ||
    ['.ppt', '.pptx', '.key'].includes(ext) ||
    mime.includes('presentation') ||
    mime.includes('powerpoint')
  ) return 'Slides';
  if (
    mime === 'application/vnd.google-apps.document' ||
    mime === 'application/vnd.google-apps.spreadsheet' ||
    mime.startsWith('text/') ||
    ['.md', '.txt', '.csv'].includes(ext)
  ) return 'Notes';

  return 'File';
}

async function downloadDriveBytes(drive, file) {
  const mime = String(file.mimeType || '').toLowerCase();

  if (mime === 'application/vnd.google-apps.document') {
    const response = await drive.files.export(
      { fileId: file.id, mimeType: 'text/plain' },
      { responseType: 'arraybuffer' }
    );
    return Buffer.from(response.data);
  }

  if (mime === 'application/vnd.google-apps.spreadsheet') {
    const response = await drive.files.export(
      { fileId: file.id, mimeType: 'text/csv' },
      { responseType: 'arraybuffer' }
    );
    return Buffer.from(response.data);
  }

  if (mime === 'application/vnd.google-apps.presentation') {
    const response = await drive.files.export(
      { fileId: file.id, mimeType: 'application/pdf' },
      { responseType: 'arraybuffer' }
    );
    return Buffer.from(response.data);
  }

  const response = await drive.files.get({ fileId: file.id, alt: 'media' }, { responseType: 'arraybuffer' });
  return Buffer.from(response.data);
}

async function extractContent(fileName, mimeType, buffer) {
  const type = inferResourceType(fileName, mimeType);

  if (type === 'PDF') {
    const parsed = await pdfParse(buffer);
    return parsed.text || '';
  }

  if (type === 'Notes') {
    return buffer.toString('utf8');
  }

  if (String(mimeType || '').toLowerCase() === 'text/csv' || path.extname(fileName || '').toLowerCase() === '.csv') {
    return buffer.toString('utf8');
  }

  return '';
}

export const router = (app) => {
  app.post('/api/google-drive/import', requireAuth, async (req, res) => {
    try {
      const folderId = extractFolderId(req.body?.folderId || req.body?.folderUrl);
      const accessToken = String(req.body?.accessToken || '').trim();

      if (!folderId) {
        return res.status(400).json({ error: 'A valid Google Drive folder ID or URL is required' });
      }

      if (!accessToken) {
        return res.status(400).json({ error: 'Google access token is required' });
      }

      const auth = new google.auth.OAuth2();
      auth.setCredentials({ access_token: accessToken });
      const drive = google.drive({ version: 'v3', auth });

      const listResponse = await drive.files.list({
        q: `'${folderId}' in parents and trashed = false`,
        fields: 'files(id, name, mimeType, modifiedTime, webViewLink)',
        pageSize: 100,
        supportsAllDrives: true,
        includeItemsFromAllDrives: true,
      });

      const files = Array.isArray(listResponse.data.files) ? listResponse.data.files : [];
      const imported = [];

      for (const file of files) {
        if (!file?.id || !file?.name) continue;
        if (file.mimeType === 'application/vnd.google-apps.folder') continue;

        const safeName = sanitizeFileName(file.name);
        const type = inferResourceType(file.name, file.mimeType);
        const extension =
          file.mimeType === 'application/vnd.google-apps.document' ? '.txt' :
          file.mimeType === 'application/vnd.google-apps.spreadsheet' ? '.csv' :
          file.mimeType === 'application/vnd.google-apps.presentation' ? '.pdf' :
          path.extname(safeName);
        const localName = `${crypto.randomUUID()}-${safeName}${extension && !safeName.endsWith(extension) ? extension : ''}`;
        const localPath = path.join(UPLOAD_DIR, localName);

        const buffer = await downloadDriveBytes(drive, file);
        fs.writeFileSync(localPath, buffer);

        const content = await extractContent(file.name, file.mimeType, buffer);
        const resource = {
          id: crypto.randomUUID(),
          ownerId: req.user.id,
          title: file.name,
          type,
          course: req.body?.course || 'Google Drive',
          description: req.body?.description || `Imported from Google Drive${file.webViewLink ? `: ${file.webViewLink}` : ''}`,
          tags: Array.isArray(req.body?.tags)
            ? req.body.tags
            : String(req.body?.tags || '')
                .split(',')
                .map((tag) => tag.trim())
                .filter(Boolean),
          updatedAt: file.modifiedTime || new Date().toISOString(),
          favorite: false,
          status: 'Imported',
          progress: 0,
          tone: 'slate',
          content,
          filePath: path.relative(process.cwd(), localPath),
        };

        insertResource(resource);
        imported.push(resource);
      }

      res.json({ success: true, resources: imported });
    } catch (error) {
      console.error('Google Drive import error:', error);
      res.status(400).json({ error: error?.message || 'Failed to import Google Drive files' });
    }
  });
};