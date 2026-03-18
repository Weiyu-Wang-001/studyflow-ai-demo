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
} from '@mui/material';
import { Close as CloseIcon, AutoAwesome as AiIcon, Chat as ChatIcon } from '@mui/icons-material';
import { Resource } from '../types';
import { getIconForType } from '../utils/icons';

interface DetailDrawerProps {
  open: boolean;
  resource: Resource | null;
  onClose: () => void;
  onSummarize: () => void;
  onOpenAssistant: () => void;
}

const DetailDrawer: React.FC<DetailDrawerProps> = ({
  open,
  resource,
  onClose,
  onSummarize,
  onOpenAssistant,
}) => {
  if (!resource) return null;

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
          <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5, lineHeight: 1.65 }}>
            {resource.content}
          </Typography>
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
              value={resource.progress}
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
              {resource.progress}%
            </Typography>
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
      <Box sx={{ display: 'flex', gap: 1.2, mt: 3 }}>
        <Button
          variant="contained"
          startIcon={<AiIcon />}
          onClick={onSummarize}
          sx={{
            flex: 1,
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
