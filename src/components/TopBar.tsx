import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  IconButton,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  AutoAwesome as AiIcon,
  LogoutRounded as LogoutIcon,
  UploadFileRounded as UploadIcon,
} from '@mui/icons-material';

interface TopBarProps {
  onOpenAssistant: () => void;
  userNickname: string;
  onLogout: () => void;
  onUploadFile: (file: File) => Promise<void>;
}

const TopBar: React.FC<TopBarProps> = ({
  onOpenAssistant,
  userNickname,
  onLogout,
  onUploadFile,
}) => {
  const [uploadOpen, setUploadOpen] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const fileLabel = useMemo(() => {
    if (!selectedFile) return 'No file selected';
    const kb = Math.round(selectedFile.size / 1024);
    return `${selectedFile.name} (${kb} KB)`;
  }, [selectedFile]);

  const validateAndSetFile = useCallback((file?: File) => {
    if (!file) return;
    setError('');
    setSelectedFile(file);
  }, []);

  const handleInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      validateAndSetFile(event.target.files?.[0]);
    },
    [validateAndSetFile]
  );

  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();
      setIsDragOver(false);
      validateAndSetFile(event.dataTransfer.files?.[0]);
    },
    [validateAndSetFile]
  );

  const resetUploadState = useCallback(() => {
    setSelectedFile(null);
    setError('');
    setIsDragOver(false);
    if (inputRef.current) inputRef.current.value = '';
  }, []);

  const closeUpload = useCallback(() => {
    if (uploading) return;
    setUploadOpen(false);
    resetUploadState();
  }, [resetUploadState, uploading]);

  const submitUpload = useCallback(async () => {
    if (!selectedFile || uploading) return;
    setUploading(true);
    setError('');
    try {
      await onUploadFile(selectedFile);
      setUploadOpen(false);
      resetUploadState();
    } catch {
      setError('Upload failed. Please make sure the backend is running and try again.');
    } finally {
      setUploading(false);
    }
  }, [onUploadFile, resetUploadState, selectedFile, uploading]);

  return (
    <>
      <Paper
        elevation={0}
        sx={{
          borderRadius: '22px',
          px: 2.5,
          py: 1.2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2,
          background: 'rgba(255,255,255,0.88)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.75)',
          boxShadow: '0 4px 20px rgba(15,23,42,0.06)',
          animation: 'fadeInUp 0.4s ease both',
        }}
      >
        {/* Brand */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, flexShrink: 0 }}>
          <Box
            sx={{
              width: 34,
              height: 34,
              borderRadius: '11px',
              background: 'linear-gradient(135deg, #295df4, #6366f1)',
              display: 'grid',
              placeItems: 'center',
            }}
          >
            <AiIcon sx={{ color: '#fff', fontSize: 18 }} />
          </Box>
          <Typography sx={{ fontWeight: 800, fontSize: '1.1rem', color: '#0f172a', whiteSpace: 'nowrap', display: { xs: 'none', sm: 'block' } }}>
            StudyFlow AI
          </Typography>
        </Box>

        {/* Spacer */}
        <Box sx={{ flex: 1 }} />

        {/* Right: Actions + User */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, flexShrink: 0 }}>
          <Button
            size="small"
            startIcon={<UploadIcon sx={{ fontSize: 16 }} />}
            onClick={() => setUploadOpen(true)}
            sx={{
              textTransform: 'none',
              borderRadius: '12px',
              px: 1.8,
              py: 0.8,
              fontWeight: 600,
              fontSize: 13,
              color: '#0f766e',
              background: 'rgba(15,118,110,0.08)',
              border: '1px solid rgba(15,118,110,0.14)',
              '&:hover': {
                background: 'rgba(15,118,110,0.14)',
              },
            }}
          >
            Upload
          </Button>

          <Button
            size="small"
            startIcon={<AiIcon sx={{ fontSize: 16 }} />}
            onClick={onOpenAssistant}
            sx={{
              textTransform: 'none',
              borderRadius: '12px',
              px: 1.8,
              py: 0.8,
              fontWeight: 600,
              fontSize: 13,
              color: '#295df4',
              background: 'rgba(41,93,244,0.06)',
              border: '1px solid rgba(41,93,244,0.12)',
              '&:hover': {
                background: 'rgba(41,93,244,0.12)',
              },
              transition: 'all 0.2s ease',
            }}
          >
            AI
          </Button>

          {/* User */}
          <Avatar
            sx={{
              width: 32,
              height: 32,
              fontSize: 14,
              fontWeight: 700,
              background: 'linear-gradient(135deg, #295df4, #6366f1)',
              cursor: 'default',
            }}
          >
            {userNickname.charAt(0).toUpperCase()}
          </Avatar>
          <Typography sx={{ fontWeight: 600, fontSize: 13, color: '#334155', whiteSpace: 'nowrap', display: { xs: 'none', md: 'block' } }}>
            {userNickname}
          </Typography>
          <IconButton
            size="small"
            onClick={onLogout}
            sx={{
              color: '#94a3b8',
              '&:hover': { color: '#ef4444', background: 'rgba(239,68,68,0.08)' },
            }}
          >
            <LogoutIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Box>
      </Paper>

      <Dialog open={uploadOpen} onClose={closeUpload} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 700 }}>Upload File</DialogTitle>
        <DialogContent>
          <Box
            onDragOver={(event) => {
              event.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={(event) => {
              event.preventDefault();
              setIsDragOver(false);
            }}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            sx={{
              mt: 1,
              borderRadius: '16px',
              border: isDragOver ? '2px dashed #0f766e' : '2px dashed #94a3b8',
              background: isDragOver ? 'rgba(15,118,110,0.08)' : 'rgba(15,23,42,0.02)',
              p: 4,
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            <UploadIcon sx={{ fontSize: 34, color: isDragOver ? '#0f766e' : '#64748b', mb: 1 }} />
            <Typography sx={{ fontWeight: 700, color: '#0f172a' }}>Drag and drop your file here</Typography>
            <Typography sx={{ mt: 0.6, color: '#475569', fontSize: 13 }}>or click this area to select a file</Typography>
            <Typography sx={{ mt: 1.6, color: '#64748b', fontSize: 12 }}>Maximum file size: 10 MB</Typography>
            <input
              ref={inputRef}
              hidden
              type="file"
              onChange={handleInputChange}
            />
          </Box>

          <Typography sx={{ mt: 1.8, fontSize: 13, color: '#334155' }}>{fileLabel}</Typography>

          {error ? (
            <Alert severity="error" sx={{ mt: 1.5 }}>
              {error}
            </Alert>
          ) : null}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={closeUpload} disabled={uploading} sx={{ textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={submitUpload}
            disabled={!selectedFile || uploading}
            startIcon={uploading ? <CircularProgress size={14} color="inherit" /> : <UploadIcon />}
            sx={{ textTransform: 'none', borderRadius: '10px' }}
          >
            {uploading ? 'Uploading...' : 'Upload File'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default TopBar;
