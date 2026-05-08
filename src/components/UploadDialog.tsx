import React, { useMemo, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  CircularProgress,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import { importGoogleDriveFolder, uploadFile } from '../utils/api';
import { Resource } from '../types';

type UploadMode = 'local' | 'drive';

declare global {
  interface Window {
    google?: any;
  }
}

interface UploadDialogProps {
  open: boolean;
  onClose: () => void;
  onUploaded: (resource: Resource) => void;
  ownerId?: string;
}

const UploadDialog: React.FC<UploadDialogProps> = ({ open, onClose, onUploaded, ownerId }) => {
  const MAX_UPLOAD_MB = 200;
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [course, setCourse] = useState('Uploaded');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [mode, setMode] = useState<UploadMode>('local');
  const [folderInput, setFolderInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const driveReady = useMemo(() => Boolean(googleClientId), [googleClientId]);

  const loadGoogleScript = async () => {
    if (window.google?.accounts?.oauth2) return;

    await new Promise<void>((resolve, reject) => {
      const existing = document.querySelector<HTMLScriptElement>('script[data-google-gsi="true"]');
      if (existing) {
        existing.addEventListener('load', () => resolve(), { once: true });
        existing.addEventListener('error', () => reject(new Error('Failed to load Google sign-in script')), { once: true });
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.dataset.googleGsi = 'true';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Google sign-in script'));
      document.head.appendChild(script);
    });
  };

  const requestGoogleAccessToken = async (): Promise<string> => {
    if (!googleClientId) {
      throw new Error('Missing VITE_GOOGLE_CLIENT_ID environment variable');
    }

    await loadGoogleScript();

    return new Promise<string>((resolve, reject) => {
      const tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: googleClientId,
        scope: 'https://www.googleapis.com/auth/drive.readonly',
        callback: (response: any) => {
          if (response?.access_token) {
            resolve(response.access_token);
            return;
          }
          reject(new Error('Google authorization did not return an access token'));
        },
        error_callback: () => reject(new Error('Google authorization failed')),
      });

      tokenClient.requestAccessToken({ prompt: 'consent' });
    });
  };

  const parseFolderId = (input: string) => {
    const value = input.trim();
    const folderMatch = value.match(/\/folders\/([a-zA-Z0-9_-]+)/);
    if (folderMatch?.[1]) return folderMatch[1];
    const queryMatch = value.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (queryMatch?.[1]) return queryMatch[1];
    return value;
  };

  const reset = () => {
    setFile(null);
    setTitle('');
    setCourse('Uploaded');
    setDescription('');
    setTags('');
    setMode('local');
    setFolderInput('');
    setError(null);
  };

  const handleClose = () => {
    if (loading) return;
    onClose();
  };

  const handleSubmit = async () => {
    setError(null);
    setLoading(true);
    try {
      if (mode === 'local') {
        if (!file) return setError('Please select a file to upload.');
        if (file.size > MAX_UPLOAD_MB * 1024 * 1024) return setError(`File too large (max ${MAX_UPLOAD_MB} MB)`);

        const resource = await uploadFile(file, {
          title: title || file.name,
          course,
          description,
          tags,
          ownerId,
        });

        onUploaded(resource);
      } else {
        if (!folderInput.trim()) return setError('Please paste a Google Drive folder URL or ID.');
        const accessToken = await requestGoogleAccessToken();
        const resources = await importGoogleDriveFolder({
          folderId: parseFolderId(folderInput),
          accessToken,
          ownerId,
          course: course || 'Google Drive',
          description,
          tags,
        });

        resources.forEach(onUploaded);
      }

      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.error || 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      TransitionProps={{
        onExited: () => {
          // Reset AFTER the dialog finishes closing to avoid React/MUI portal
          // unmount timing issues (can surface as removeChild NotFoundError).
          reset();
        },
      }}
    >
      <DialogTitle>Upload File</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <ToggleButtonGroup
            exclusive
            value={mode}
            onChange={(_, nextMode) => nextMode && setMode(nextMode)}
            size="small"
            sx={{ alignSelf: 'flex-start' }}
          >
            <ToggleButton value="local">Local File</ToggleButton>
            <ToggleButton value="drive">Google Drive</ToggleButton>
          </ToggleButtonGroup>

          {mode === 'local' ? (
            <>
          <input
            id="upload-file"
            type="file"
            accept="*/*"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
          <Typography variant="caption" color="text.secondary">
            Images, videos, PDFs, documents, and other file types are supported.
          </Typography>
            </>
          ) : (
            <>
              <TextField
                label="Google Drive folder URL or ID"
                value={folderInput}
                onChange={(e) => setFolderInput(e.target.value)}
                size="small"
                placeholder="https://drive.google.com/drive/folders/..."
              />
              <Typography variant="caption" color="text.secondary">
                Connects with Google OAuth and imports files from the selected folder into your library.
              </Typography>
              {!driveReady && (
                <Typography color="warning.main" variant="body2">
                  Set VITE_GOOGLE_CLIENT_ID to enable Google Drive import.
                </Typography>
              )}
            </>
          )}

          <TextField label="Title" value={title} onChange={(e) => setTitle(e.target.value)} size="small" />
          <TextField label="Course" value={course} onChange={(e) => setCourse(e.target.value)} size="small" />
          <TextField
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            size="small"
            multiline
            rows={2}
          />
          <TextField label="Tags (comma separated)" value={tags} onChange={(e) => setTags(e.target.value)} size="small" />
          {error && (
            <Typography color="error" variant="body2">
              {error}
            </Typography>
          )}
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} disabled={loading}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={loading}>
          {loading ? <CircularProgress size={18} color="inherit" /> : mode === 'local' ? 'Upload' : 'Import from Drive'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UploadDialog;
