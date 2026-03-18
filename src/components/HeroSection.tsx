import React from 'react';
import { Box, Typography, Button, Chip, Paper, LinearProgress } from '@mui/material';
import { AutoAwesome as AiIcon, OpenInNew as OpenIcon } from '@mui/icons-material';
import { Resource } from '../types';
import { getIconForType } from '../utils/icons';

interface HeroSectionProps {
  selectedResource: Resource;
  onOpenAssistant: () => void;
  onOpenDetail: () => void;
}

const HeroSection: React.FC<HeroSectionProps> = ({
  selectedResource,
  onOpenAssistant,
  onOpenDetail,
}) => {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', lg: 'minmax(0,1.25fr) 340px' },
        gap: 2,
      }}
    >
      {/* Hero Panel */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: '28px',
          p: 3.5,
          position: 'relative',
          overflow: 'hidden',
          background: `
            radial-gradient(circle at 85% 15%, rgba(99,102,241,0.2), transparent 35%),
            radial-gradient(circle at 10% 80%, rgba(59,130,246,0.12), transparent 30%),
            radial-gradient(circle at 50% 50%, rgba(139,92,246,0.06), transparent 50%),
            rgba(255,255,255,0.88)
          `,
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.75)',
          boxShadow: '0 8px 32px rgba(15,23,42,0.07)',
          animation: 'fadeInUp 0.6s ease both',
          '&::after': {
            content: '""',
            position: 'absolute',
            top: -60,
            right: -60,
            width: 200,
            height: 200,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(99,102,241,0.08), transparent 65%)',
          },
        }}
      >
        <Typography
          variant="overline"
          sx={{ color: '#71839c', fontWeight: 800, letterSpacing: '0.08em', fontSize: 11 }}
        >
          Responsive Web Application
        </Typography>
        <Typography
          variant="h3"
          sx={{
            mt: 1,
            fontWeight: 800,
            lineHeight: 1.06,
            fontSize: { xs: '2rem', md: 'clamp(2rem,3.5vw,3rem)' },
            maxWidth: 760,
          }}
        >
          Unified Search Across Multiple File Types
        </Typography>
        <Typography variant="body1" sx={{ mt: 1.5, color: '#64748b', maxWidth: 650, lineHeight: 1.65, fontSize: '0.95rem' }}>
          Search PDFs, slides, images, links, notes, and videos from one interface. Then move into a
          structured detail drawer and AI-assisted understanding flow without full-page navigation.
        </Typography>
        <Box sx={{ display: 'flex', gap: 1.5, mt: 3, flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            startIcon={<AiIcon />}
            onClick={onOpenAssistant}
            sx={{
              borderRadius: '16px',
              textTransform: 'none',
              fontWeight: 600,
              px: 3,
              py: 1.3,
              background: 'linear-gradient(135deg,#295df4,#183db7)',
              boxShadow: '0 12px 24px rgba(41,93,244,0.28)',
              '&:hover': { background: 'linear-gradient(135deg,#3b6df5,#1e4bc8)' },
            }}
          >
            Open AI Assistant
          </Button>
          <Button
            variant="outlined"
            startIcon={<OpenIcon />}
            onClick={onOpenDetail}
            sx={{
              borderRadius: '16px',
              textTransform: 'none',
              fontWeight: 600,
              px: 3,
              py: 1.3,
              color: '#0f172a',
              borderColor: 'rgba(148,163,184,0.22)',
              background: 'rgba(255,255,255,0.88)',
              '&:hover': { transform: 'translateY(-1px)', background: '#f8fafc' },
              transition: 'all 0.18s ease',
            }}
          >
            View Selected Resource
          </Button>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, mt: 2.5, flexWrap: 'wrap' }}>
          {['UI First', 'Search + Filter', 'Detail Drawer', 'AI Assistance'].map((label, i) => (
            <Chip
              key={label}
              label={label}
              size="small"
              sx={{
                borderRadius: '999px',
                fontSize: 12,
                fontWeight: i === 0 ? 700 : 500,
                background: i === 0 ? '#ebf1ff' : 'rgba(255,255,255,0.8)',
                color: i === 0 ? '#295df4' : '#475569',
                border: '1px solid rgba(148,163,184,0.22)',
              }}
            />
          ))}
        </Box>
      </Paper>

      {/* Spotlight Card */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: '28px',
          p: 3,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: 1.5,
          position: 'relative',
          overflow: 'hidden',
          background: `
            linear-gradient(145deg, rgba(255,255,255,0.92), rgba(248,250,252,0.88))
          `,
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.75)',
          boxShadow: '0 8px 28px rgba(15,23,42,0.06)',
          animation: 'fadeInUp 0.6s ease 0.1s both',
          transition: 'all 0.25s ease',
          '&:hover': {
            boxShadow: '0 16px 40px rgba(15,23,42,0.1)',
            transform: 'translateY(-2px)',
          },
        }}
      >
        <Typography
          variant="overline"
          sx={{ color: '#71839c', fontWeight: 800, letterSpacing: '0.08em', fontSize: 11 }}
        >
          Selected Resource
        </Typography>
        <Chip
          icon={<Box sx={{ fontSize: 16, display: 'flex', alignItems: 'center' }}>{getIconForType(selectedResource.type)}</Box>}
          label={selectedResource.type}
          size="small"
          sx={{
            width: 'fit-content',
            borderRadius: '999px',
            fontSize: 13,
            background: '#f8fafc',
            border: '1px solid rgba(148,163,184,0.22)',
          }}
        />
        <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.3rem' }}>
          {selectedResource.title}
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748b' }}>
          {selectedResource.description}
        </Typography>
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography variant="caption" sx={{ color: '#64748b' }}>
              {selectedResource.status}
            </Typography>
            <Typography variant="caption" sx={{ fontWeight: 700 }}>
              {selectedResource.progress}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={selectedResource.progress}
            sx={{
              height: 8,
              borderRadius: 4,
              backgroundColor: '#e5edf8',
              '& .MuiLinearProgress-bar': {
                borderRadius: 4,
                background: 'linear-gradient(90deg,#818cf8,#6366f1)',
              },
            }}
          />
        </Box>
        <Button
          fullWidth
          variant="outlined"
          onClick={onOpenDetail}
          sx={{
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
          Open Detail Drawer
        </Button>
      </Paper>
    </Box>
  );
};

export default HeroSection;
