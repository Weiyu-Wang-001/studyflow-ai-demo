import React from 'react';
import {
  Box,
  Typography,
  Button,
  Chip,
  Paper,
  IconButton,
  Drawer,
  LinearProgress,
  Slider,
} from '@mui/material';
import { Close as CloseIcon, AutoAwesome as AiIcon, Chat as ChatIcon } from '@mui/icons-material';
import { Resource } from '../types';
import { getIconForType } from '../utils/icons';

function getViewUrl(resource: Resource): string | null {
  // PDFs/images uploaded via backend are stored on disk and served at /uploads/<filename>
  if (resource.filePath) {
    const parts = String(resource.filePath).split(/[\\/]/).filter(Boolean);
    const filename = parts[parts.length - 1];
    if (filename) return `/uploads/${encodeURIComponent(filename)}`;
  }

  // Link resources: treat content as URL when it looks like one
  if (resource.type === 'Link') {
    const v = String(resource.content || '').trim();
    if (/^https?:\/\//i.test(v)) return v;
  }

  return null;
}

function getPreviewKind(resource: Resource, viewUrl: string | null): 'pdf' | 'image' | 'video' | 'link' | 'document' | 'none' {
  if (!viewUrl) return 'none';
  if (resource.type === 'PDF') return 'pdf';
  if (resource.type === 'Image') return 'image';
  if (resource.type === 'Video') return 'video';
  if (resource.type === 'Link') return 'link';
  if (resource.type === 'File') {
    // Check if it's a document/office file based on filePath
    const filePath = String(resource.filePath || '').toLowerCase();
    if (/\.(docx?|xlsx?|pptx?|odt|rtf)$/.test(filePath)) return 'document';
  }
  return 'none';
}

const PROGRESS_STEP = 5;
const AUTO_PROGRESS_INCREMENT = 5;

interface DetailDrawerProps {
  open: boolean;
  resource: Resource | null;
  onClose: () => void;
  onSummarize: () => void;
  onOpenAssistant: () => void;
  onUpdateProgress: (id: string, progress: number) => void;
}

const DetailDrawer: React.FC<DetailDrawerProps> = ({
  open,
  resource,
  onClose,
  onSummarize,
  onOpenAssistant,
  onUpdateProgress,
}) => {
  if (!resource) return null;

  const viewUrl = getViewUrl(resource);
  const previewKind = getPreviewKind(resource, viewUrl);
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const saveTimerRef = React.useRef<number | null>(null);
  const lastSavedRef = React.useRef<number>(Number(resource.progress) || 0);
  const [localProgress, setLocalProgress] = React.useState<number>(Number(resource.progress) || 0);

  React.useEffect(() => {
    setLocalProgress(Number(resource.progress) || 0);
    lastSavedRef.current = Number(resource.progress) || 0;
  }, [resource.id, resource.progress]);

  const scheduleSave = React.useCallback((next: number) => {
    if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    saveTimerRef.current = window.setTimeout(() => {
      if (Math.abs(next - lastSavedRef.current) < 1) return;
      lastSavedRef.current = next;
      onUpdateProgress(resource.id, next);
    }, 450);
  }, [onUpdateProgress, resource.id]);

  const setProgress = React.useCallback((next: number, opts?: { persist?: boolean }) => {
    const clamped = Math.max(0, Math.min(100, Math.round(next)));
    setLocalProgress(clamped);
    if (opts?.persist) scheduleSave(clamped);
  }, [scheduleSave]);

  const bumpProgress = React.useCallback((delta: number) => {
    const next = Math.max(0, Math.min(100, Math.round(localProgress + delta)));
    setProgress(next, { persist: true });
    return next;
  }, [localProgress, setProgress]);

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: '100%', sm: 420 },
          borderRadius: { xs: 0, sm: '28px 0 0 28px' },
          p: 3,
          background: 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 20px 50px rgba(15,23,42,0.14)',
        },
      }}
    >
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2.5 }}>
        <Box>
          <Typography
            variant="overline"
            sx={{ color: '#71839c', fontWeight: 800, letterSpacing: '0.08em', fontSize: 11 }}
          >
            Resource Details
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.2rem', mt: 0.5 }}>
            {resource.title}
          </Typography>
        </Box>
        <IconButton
          onClick={onClose}
          sx={{
            border: '1px solid rgba(148,163,184,0.22)',
            background: 'rgba(255,255,255,0.88)',
            '&:hover': { transform: 'translateY(-1px)' },
            transition: 'all 0.18s ease',
          }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* Detail Grid */}
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
        <Paper
          variant="outlined"
          sx={{
            borderRadius: '18px',
            p: 2,
            background: 'rgba(255,255,255,0.82)',
            borderColor: 'rgba(148,163,184,0.22)',
          }}
        >
          <Typography
            variant="overline"
            sx={{ color: '#71839c', fontWeight: 800, letterSpacing: '0.08em', fontSize: 10 }}
          >
            Type
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mt: 0.5 }}>
            <Box sx={{ fontSize: 18, color: '#64748b', display: 'flex', alignItems: 'center' }}>{getIconForType(resource.type)}</Box>
            <Typography variant="body2" sx={{ color: '#64748b' }}>
              {resource.type}
            </Typography>
          </Box>
        </Paper>
        <Paper
          variant="outlined"
          sx={{
            borderRadius: '18px',
            p: 2,
            background: 'rgba(255,255,255,0.82)',
            borderColor: 'rgba(148,163,184,0.22)',
          }}
        >
          <Typography
            variant="overline"
            sx={{ color: '#71839c', fontWeight: 800, letterSpacing: '0.08em', fontSize: 10 }}
          >
            Status
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5 }}>
            {resource.status}
          </Typography>
        </Paper>

        {/* Description - full width */}
        <Paper
          variant="outlined"
          sx={{
            gridColumn: '1 / -1',
            borderRadius: '18px',
            p: 2,
            background: 'rgba(255,255,255,0.82)',
            borderColor: 'rgba(148,163,184,0.22)',
          }}
        >
          <Typography
            variant="overline"
            sx={{ color: '#71839c', fontWeight: 800, letterSpacing: '0.08em', fontSize: 10 }}
          >
            Description
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5, lineHeight: 1.55 }}>
            {resource.description}
          </Typography>
        </Paper>

        {/* Preview Content - full width */}
        <Paper
          variant="outlined"
          sx={{
            gridColumn: '1 / -1',
            borderRadius: '18px',
            p: 2,
            background: 'linear-gradient(180deg,rgba(239,246,255,0.85),rgba(255,255,255,0.88))',
            borderColor: 'rgba(148,163,184,0.22)',
          }}
        >
          <Typography
            variant="overline"
            sx={{ color: '#71839c', fontWeight: 800, letterSpacing: '0.08em', fontSize: 10 }}
          >
            Preview Content
          </Typography>
          {previewKind === 'pdf' && (
            <Box
              sx={{
                mt: 1,
                borderRadius: '14px',
                overflow: 'hidden',
                border: '1px solid rgba(148,163,184,0.25)',
                background: '#fff',
                height: 380,
              }}
            >
              <Box
                component="iframe"
                title={resource.title}
                src={viewUrl!}
                sx={{ width: '100%', height: '100%', border: 0 }}
              />
            </Box>
          )}

          {previewKind === 'image' && (
            <Box
              sx={{
                mt: 1,
                borderRadius: '14px',
                overflow: 'hidden',
                border: '1px solid rgba(148,163,184,0.25)',
                background: '#fff',
              }}
            >
              <Box
                component="img"
                alt={resource.title}
                src={viewUrl!}
                sx={{ display: 'block', width: '100%', maxHeight: 420, objectFit: 'contain', background: '#0b1220' }}
              />
            </Box>
          )}

          {previewKind === 'video' && (
            <Box
              sx={{
                mt: 1,
                borderRadius: '14px',
                overflow: 'hidden',
                border: '1px solid rgba(148,163,184,0.25)',
                background: '#0b1220',
              }}
            >
              <Box
                component="video"
                src={viewUrl!}
                controls
                preload="metadata"
                ref={videoRef}
                onLoadedMetadata={(e) => {
                  const el = e.currentTarget;
                  if (Number.isFinite(el.duration) && el.duration > 0) {
                    const t = (localProgress / 100) * el.duration;
                    if (Number.isFinite(t)) el.currentTime = t;
                  }
                }}
                onTimeUpdate={(e) => {
                  const el = e.currentTarget;
                  if (!Number.isFinite(el.duration) || el.duration <= 0) return;
                  const next = (el.currentTime / el.duration) * 100;
                  setProgress(next);
                  scheduleSave(Math.max(0, Math.min(100, Math.round(next))));
                }}
                sx={{ display: 'block', width: '100%', maxHeight: 420, background: '#0b1220' }}
              />
            </Box>
          )}

          {previewKind === 'document' && (
            <Box
              sx={{
                mt: 1,
                borderRadius: '14px',
                overflow: 'hidden',
                border: '1px solid rgba(148,163,184,0.25)',
                background: '#fff',
                height: 380,
              }}
            >
              <Box
                component="iframe"
                title={`Document: ${resource.title}`}
                src={`https://docs.google.com/gvjs?id=${encodeURIComponent(viewUrl!)}&embedded=true`}
                sx={{
                  width: '100%',
                  height: '100%',
                  border: 0,
                  borderRadius: '14px',
                }}
              />
            </Box>
          )}

          {previewKind === 'none' && (
            <Box sx={{ mt: 1 }}>
              {resource.content ? (
                <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5, lineHeight: 1.65, whiteSpace: 'pre-wrap' }}>
                  {resource.content}
                </Typography>
              ) : viewUrl ? (
                <Paper
                  variant="outlined"
                  sx={{
                    mt: 1,
                    borderRadius: '14px',
                    p: 1.5,
                    borderColor: 'rgba(148,163,184,0.22)',
                    background: 'rgba(255,255,255,0.9)',
                  }}
                >
                  <Typography variant="body2" sx={{ color: '#64748b', lineHeight: 1.5 }}>
                    No inline preview available for this file type.
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                    Use “View Resource” to open/download.
                  </Typography>
                </Paper>
              ) : (
                <Typography variant="body2" sx={{ color: '#94a3b8', mt: 0.5 }}>
                  No preview available.
                </Typography>
              )}
            </Box>
          )}
        </Paper>

        {/* Progress - full width */}
        <Paper
          variant="outlined"
          sx={{
            gridColumn: '1 / -1',
            borderRadius: '18px',
            p: 2,
            background: 'rgba(255,255,255,0.82)',
            borderColor: 'rgba(148,163,184,0.22)',
          }}
        >
          <Typography
            variant="overline"
            sx={{ color: '#71839c', fontWeight: 800, letterSpacing: '0.08em', fontSize: 10 }}
          >
            Progress
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 1 }}>
            <LinearProgress
              variant="determinate"
              value={localProgress}
              sx={{
                flex: 1,
                height: 8,
                borderRadius: 4,
                backgroundColor: '#e5edf8',
                '& .MuiLinearProgress-bar': {
                  borderRadius: 4,
                  background: 'linear-gradient(90deg,#60a5fa,#2563eb)',
                },
              }}
            />
            <Typography variant="body2" sx={{ fontWeight: 700, minWidth: 36 }}>
              {localProgress}%
            </Typography>
          </Box>
          <Box sx={{ mt: 1.2 }}>
            <Slider
              value={localProgress}
              onChange={(_, v) => setProgress(Number(v))}
              onChangeCommitted={(_, v) => {
                const next = Number(v);
                setProgress(next, { persist: true });
                if (resource.type === 'Video' && videoRef.current && Number.isFinite(videoRef.current.duration) && videoRef.current.duration > 0) {
                  videoRef.current.currentTime = (Math.max(0, Math.min(100, Math.round(next))) / 100) * videoRef.current.duration;
                }
              }}
              min={0}
              max={100}
              step={PROGRESS_STEP}
              size="small"
              sx={{ color: '#295df4' }}
            />
          </Box>
        </Paper>

        {/* Tags - full width */}
        <Box sx={{ gridColumn: '1 / -1', display: 'flex', gap: 0.8, flexWrap: 'wrap' }}>
          {resource.tags.map((tag) => (
            <Chip
              key={tag}
              label={tag}
              size="small"
              sx={{
                borderRadius: '999px',
                fontSize: 12,
                background: 'rgba(255,255,255,0.92)',
                border: '1px solid rgba(148,163,184,0.22)',
              }}
            />
          ))}
        </Box>
      </Box>

      {/* Actions */}
      <Box sx={{ display: 'flex', gap: 1.2, mt: 3, flexWrap: 'wrap' }}>
        {viewUrl && (
          <Button
            variant="outlined"
            onClick={() => {
              // Treat viewing/downloading as "making progress" too.
              bumpProgress(AUTO_PROGRESS_INCREMENT);
              window.open(viewUrl, '_blank', 'noopener,noreferrer');
            }}
            sx={{
              flex: 1,
              minWidth: 150,
              borderRadius: '16px',
              textTransform: 'none',
              fontWeight: 700,
              py: 1.2,
              color: '#0f172a',
              borderColor: 'rgba(148,163,184,0.22)',
              background: 'rgba(255,255,255,0.88)',
              '&:hover': { transform: 'translateY(-1px)', background: '#f8fafc' },
              transition: 'all 0.18s ease',
            }}
          >
            View Resource
          </Button>
        )}
        <Button
          variant="contained"
          startIcon={<AiIcon />}
          onClick={onSummarize}
          sx={{
            flex: 1,
            minWidth: 150,
            borderRadius: '16px',
            textTransform: 'none',
            fontWeight: 600,
            py: 1.2,
            background: 'linear-gradient(135deg,#295df4,#183db7)',
            boxShadow: '0 12px 24px rgba(41,93,244,0.28)',
            '&:hover': { background: 'linear-gradient(135deg,#3b6df5,#1e4bc8)' },
          }}
        >
          Summarize with AI
        </Button>
        <Button
          variant="outlined"
          startIcon={<ChatIcon />}
          onClick={onOpenAssistant}
          sx={{
            flex: 1,
            minWidth: 150,
            borderRadius: '16px',
            textTransform: 'none',
            fontWeight: 600,
            py: 1.2,
            color: '#0f172a',
            borderColor: 'rgba(148,163,184,0.22)',
            background: 'rgba(255,255,255,0.88)',
            '&:hover': { transform: 'translateY(-1px)', background: '#f8fafc' },
            transition: 'all 0.18s ease',
          }}
        >
          Open Assistant
        </Button>
      </Box>
    </Drawer>
  );
};

export default DetailDrawer;
