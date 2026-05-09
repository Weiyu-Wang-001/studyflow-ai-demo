import React, { useMemo } from 'react';
import { Box, Typography, Paper, LinearProgress, Tooltip } from '@mui/material';
import {
  TrendingUp as TrendingIcon,
  AutoAwesome as StarIcon,
  CheckCircleOutline as CompleteIcon,
  Description as ResourceIcon,
} from '@mui/icons-material';
import { Resource } from '../types';

interface AnalyticsBarProps {
  resources: Resource[];
}

const AnalyticsBar: React.FC<AnalyticsBarProps> = ({ resources }) => {
  const stats = useMemo(() => {
    const total = resources.length;
    const favorites = resources.filter((r) => r.favorite).length;
    const avgProgress = Math.round(
      resources.reduce((sum, r) => sum + r.progress, 0) / Math.max(total, 1)
    );
    const completed = resources.filter((r) => r.progress >= 80).length;
    const completionRate = Math.round((completed / Math.max(total, 1)) * 100);

    return { total, favorites, avgProgress, completed, completionRate };
  }, [resources]);

  const statItems = [
    {
      label: 'Resources',
      value: stats.total,
      icon: <ResourceIcon sx={{ fontSize: 16 }} />,
      color: '#3b82f6',
      bgColor: 'rgba(59,130,246,0.08)',
    },
    {
      label: 'Avg Progress',
      value: `${stats.avgProgress}%`,
      icon: <TrendingIcon sx={{ fontSize: 16 }} />,
      color: '#10b981',
      bgColor: 'rgba(16,185,129,0.08)',
    },
    {
      label: 'Favorites',
      value: stats.favorites,
      icon: <StarIcon sx={{ fontSize: 16 }} />,
      color: '#f59e0b',
      bgColor: 'rgba(245,158,11,0.08)',
    },
    {
      label: 'Completed',
      value: stats.completed,
      icon: <CompleteIcon sx={{ fontSize: 16 }} />,
      color: '#6366f1',
      bgColor: 'rgba(99,102,241,0.08)',
    },
  ];

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: '20px',
        background: 'rgba(255,255,255,0.72)',
        border: '1px solid rgba(148,163,184,0.16)',
        p: 2.5,
      }}
    >
      <Typography
        variant="overline"
        sx={{
          color: '#71839c',
          fontWeight: 800,
          letterSpacing: '0.08em',
          fontSize: 10,
        }}
      >
        Analytics Overview
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 1.5 }}>
        {/* Stats Grid */}
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
          {statItems.map((item, idx) => (
            <Tooltip key={idx} title={item.label} arrow>
              <Box
                sx={{
                  borderRadius: '16px',
                  background: item.bgColor,
                  border: `1px solid ${item.color}20`,
                  p: 1.5,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 0.75,
                  transition: 'all 0.2s ease',
                  cursor: 'pointer',
                  '&:hover': {
                    background: `${item.bgColor}${item.bgColor.endsWith('08') ? '12' : ''}`,
                    transform: 'translateY(-2px)',
                  },
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  <Box sx={{ color: item.color }}>{item.icon}</Box>
                  <Typography
                    sx={{
                      fontSize: 10,
                      fontWeight: 600,
                      color: '#64748b',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    {item.label}
                  </Typography>
                </Box>
                <Typography
                  sx={{
                    fontSize: 18,
                    fontWeight: 700,
                    color: item.color,
                  }}
                >
                  {item.value}
                </Typography>
              </Box>
            </Tooltip>
          ))}
        </Box>

        {/* Progress Bar */}
        <Box>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 1,
            }}
          >
            <Typography
              sx={{
                fontSize: 12,
                fontWeight: 600,
                color: '#475569',
              }}
            >
              Overall Progress
            </Typography>
            <Typography
              sx={{
                fontSize: 12,
                fontWeight: 700,
                color: '#10b981',
              }}
            >
              {stats.avgProgress}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={stats.avgProgress}
            sx={{
              height: 6,
              borderRadius: 3,
              background: 'rgba(148,163,184,0.12)',
              '& .MuiLinearProgress-bar': {
                borderRadius: 3,
                background: 'linear-gradient(90deg, #10b981 0%, #3b82f6 100%)',
              },
            }}
          />
        </Box>

        {/* Completion Rate Bar */}
        <Box>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 1,
            }}
          >
            <Typography
              sx={{
                fontSize: 12,
                fontWeight: 600,
                color: '#475569',
              }}
            >
              Completion Rate
            </Typography>
            <Typography
              sx={{
                fontSize: 12,
                fontWeight: 700,
                color: '#6366f1',
              }}
            >
              {stats.completionRate}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={stats.completionRate}
            sx={{
              height: 6,
              borderRadius: 3,
              background: 'rgba(148,163,184,0.12)',
              '& .MuiLinearProgress-bar': {
                borderRadius: 3,
                background: 'linear-gradient(90deg, #6366f1 0%, #8b5cf6 100%)',
              },
            }}
          />
        </Box>

        {/* Quick Stats Text */}
        <Box
          sx={{
            borderRadius: '14px',
            background: 'rgba(99,102,241,0.04)',
            border: '1px solid rgba(99,102,241,0.12)',
            p: 1.5,
          }}
        >
          <Typography
            sx={{
              fontSize: 11,
              color: '#64748b',
              lineHeight: 1.6,
            }}
          >
            <strong style={{ color: '#475569' }}>
              {stats.completed} of {stats.total} resources
            </strong>{' '}
            are at 80%+ completion. Keep up the momentum! 🚀
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
};

export default AnalyticsBar;
