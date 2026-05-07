import React, { useState } from 'react';
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
} from '@mui/material';
import { uploadFile } from '../utils/api';
import { Resource } from '../types';

interface UploadDialogProps {
  open: boolean;
  onClose: () => void;
  onUploaded: (resource: Resource) => void;
  ownerId?: string;
}

const UploadDialog: React.FC<UploadDialogProps> = ({ open, onClose, onUploaded, ownerId }) => {
  const MAX_UPLOAD_MB = 200;
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [course, setCourse] = useState('Uploaded');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isClosing, setIsClosing] = useState(false);

  const reset = () => {
    setFile(null);
    setTitle('');
    setCourse('Uploaded');
    setDescription('');
    setTags('');
    setError(null);
  };

  const handleClose = () => {
    if (loading) return;
    // Trigger close animation locally first, then notify parent after animation completes
    setIsClosing(true);
    setTimeout(() => {
      reset();
      setIsClosing(false);
      onClose();
    }, 300);
  };

  const handleSubmit = async () => {
    setError(null);
    if (!file) return setError('Please select a file to upload.');
    if (file.size > MAX_UPLOAD_MB * 1024 * 1024) return setError(`File too large (max ${MAX_UPLOAD_MB} MB)`);

    setLoading(true);
    try {
      const resource = await uploadFile(file, {
        title: title || file.name,
        course,
        description,
        tags,
        ownerId,
      });

      onUploaded(resource);
      reset();
      // Trigger close animation, then notify parent after animation completes
      setIsClosing(true);
      setTimeout(() => {
        setIsClosing(false);
        onClose();
      }, 300);
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.error || 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  // Keep component mounted during closing animation (don't unmount until animation completes)
  const dialogOpen = open && !isClosing;

  React.useEffect(() => {
    // If parent closes dialog (open=false), trigger local closing animation
    if (!open && !isClosing) {
      setIsClosing(true);
      setTimeout(() => {
        reset();
        setIsClosing(false);
      }, 300);
    }
  }, [open]);

  return (
    <Dialog open={dialogOpen} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Upload File</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <input
            id="upload-file"
            type="file"
            accept="application/pdf,.pdf"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
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
          {loading ? <CircularProgress size={18} color="inherit" /> : 'Upload'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UploadDialog;
