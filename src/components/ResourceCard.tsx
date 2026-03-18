import React from 'react';
import {
  Box,
  Typography,
  Button,
  Chip,
  Paper,
  IconButton,
  LinearProgress,
} from '@mui/material';
import { Star, StarBorder } from '@mui/icons-material';
import { Resource } from '../types';
import { getIconForType, toneColors } from '../utils/icons';

interface ResourceCardProps {
  resource: Resource;
  onToggleFavorite: (id: string) => void;
  onOpenDetail: (resource: Resource) => void;
}

const ResourceCard: React.FC<ResourceCardProps> = ({
  resource,
  onToggleFavorite,
  onOpenDetail,
}) => {
  const toneColor = toneColors[resource.tone] || '#64748b';

  return (
    <Paper
      elevation={0}
      sx={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: '22px',
        p: 2.5,
        background: 'rgba(255,255,255,0.88)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.75)',
        boxShadow: '0 8px 28px rgba(15,23,42,0.06)',
        transition: 'all 0.28s cubic-bezier(0.4,0,0.2,1)',
        cursor: 'pointer',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: `0 20px 48px rgba(15,23,42,0.12), 0 0 0 1px ${toneColor}22`,
          borderColor: `${toneColor}33`,
        },
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '3px',
          background: `linear-gradient(90deg, ${toneColor}, ${toneColor}66)`,
          borderRadius: '22px 22px 0 0',
          opacity: 0.8,
        },
        '&::after': {
          content: '""',
          position: 'absolute',
          right: '-10%',
          bottom: '-50%',
          width: 150,
          height: 150,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${toneColor}20, transparent 70%)`,
          opacity: 1,
        },
      }}
    >
      {/* Top row */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Chip
          icon={<Box sx={{ fontSize: 14, display: 'flex', alignItems: 'center' }}>{getIconForType(resource.type)}</Box>}
          label={resource.type}
          size="small"
          sx={{
            borderRadius: '999px',
            fontSize: 12,
            background: 'rgba(255,255,255,0.92)',
            border: '1px solid rgba(148,163,184,0.22)',
          }}
        />
        <IconButton
          size="small"
          onClick={() => onToggleFavorite(resource.id)}
          sx={{
            border: '1px solid rgba(148,163,184,0.22)',
            background: 'rgba(255,255,255,0.88)',
            '&:hover': { transform: 'translateY(-1px)' },
            transition: 'all 0.18s ease',
          }}
        >
          {resource.favorite ? (
            <Star sx={{ fontSize: 18, color: '#f59e0b' }} />
          ) : (
            <StarBorder sx={{ fontSize: 18, color: '#94a3b8' }} />
          )}
        </IconButton>
      </Box>

      {/* Course */}
      <Typography
        variant="overline"
        sx={{ display: 'block', mt: 1.5, color: '#71839c', fontWeight: 800, letterSpacing: '0.08em', fontSize: 11 }}
      >
        {resource.course}
      </Typography>

      {/* Title & Description */}
      <Typography variant="subtitle1" sx={{ fontWeight: 700, fontSize: '1.15rem', mt: 0.5, mb: 0.5 }}>
        {resource.title}
      </Typography>
      <Typography variant="body2" sx={{ color: '#64748b', lineHeight: 1.5 }}>
        {resource.description}
      </Typography>

      {/* Tags */}
      <Box sx={{ display: 'flex', gap: 0.8, flexWrap: 'wrap', mt: 1.5 }}>
        {resource.tags.map((tag) => (
          <Chip
            key={tag}
            label={tag}
            size="small"
            sx={{
              borderRadius: '999px',
              fontSize: 11,
              height: 24,
              background: 'rgba(255,255,255,0.92)',
              border: '1px solid rgba(148,163,184,0.22)',
            }}
          />
        ))}
      </Box>

      {/* Progress */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 2 }}>
        <LinearProgress
          variant="determinate"
          value={resource.progress}
          sx={{
            flex: 1,
            height: 7,
            borderRadius: 4,
            backgroundColor: '#e5edf8',
            '& .MuiLinearProgress-bar': {
              borderRadius: 4,
              background: `linear-gradient(90deg, ${toneColor}cc, ${toneColor})`,
            },
          }}
        />
        <Typography variant="caption" sx={{ fontWeight: 600, minWidth: 32 }}>
          {resource.progress}%
        </Typography>
      </Box>

      {/* Bottom */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
        <Typography variant="caption" sx={{ color: '#94a3b8' }}>
          {resource.updatedAt}
        </Typography>
        <Button
          size="small"
          onClick={() => onOpenDetail(resource)}
          sx={{
            textTransform: 'none',
            fontWeight: 700,
            color: '#295df4',
            p: 0,
            minWidth: 'auto',
            '&:hover': { background: 'transparent', textDecoration: 'underline' },
          }}
        >
          View Details →
        </Button>
      </Box>
    </Paper>
  );
};

export default ResourceCard;
