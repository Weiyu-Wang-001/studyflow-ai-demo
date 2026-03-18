import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import {
  Inventory2Outlined as TotalIcon,
  StarOutlineRounded as FavIcon,
  VisibilityOutlined as VisibleIcon,
  TrendingUpRounded as ProgressIcon,
} from '@mui/icons-material';

interface StatsGridProps {
  total: number;
  favorites: number;
  visible: number;
  avgProgress: number;
}

const statItems = [
  { key: 'total', label: 'Total Resources', sub: 'Centralized in one dashboard', icon: TotalIcon, accent: '#3b82f6', bg: 'linear-gradient(135deg,rgba(59,130,246,0.08),rgba(99,102,241,0.04))' },
  { key: 'favorites', label: 'Favorites', sub: 'Quick access for high-value items', icon: FavIcon, accent: '#f59e0b', bg: 'linear-gradient(135deg,rgba(245,158,11,0.08),rgba(251,146,60,0.04))' },
  { key: 'visible', label: 'Visible Results', sub: 'Updated instantly by search and filter', icon: VisibleIcon, accent: '#10b981', bg: 'linear-gradient(135deg,rgba(16,185,129,0.08),rgba(52,211,153,0.04))' },
  { key: 'avgProgress', label: 'Avg. Progress', sub: 'At-a-glance productivity signal', suffix: '%', icon: ProgressIcon, accent: '#8b5cf6', bg: 'linear-gradient(135deg,rgba(139,92,246,0.08),rgba(168,85,247,0.04))' },
];

const StatsGrid: React.FC<StatsGridProps> = ({ total, favorites, visible, avgProgress }) => {
  const values: Record<string, number> = { total, favorites, visible, avgProgress };

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, minmax(0,1fr))' },
        gap: 1.75,
      }}
    >
      {statItems.map((item, idx) => {
        const IconComp = item.icon;
        return (
          <Paper
            key={item.key}
            elevation={0}
            sx={{
              borderRadius: '20px',
              p: 2.5,
              position: 'relative',
              overflow: 'hidden',
              background: 'rgba(255,255,255,0.88)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.75)',
              boxShadow: '0 8px 28px rgba(15,23,42,0.06)',
              transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
              animation: `fadeInUp 0.5s ease ${idx * 0.08}s both`,
              '&:hover': {
                transform: 'translateY(-3px)',
                boxShadow: '0 16px 40px rgba(15,23,42,0.12)',
              },
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '3px',
                background: `linear-gradient(90deg, ${item.accent}, ${item.accent}88)`,
                borderRadius: '20px 20px 0 0',
              },
              '&::after': {
                content: '""',
                position: 'absolute',
                right: -20,
                bottom: -20,
                width: 80,
                height: 80,
                borderRadius: '50%',
                background: item.bg,
                opacity: 0.7,
              },
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography
                variant="overline"
                sx={{ color: '#71839c', fontWeight: 800, letterSpacing: '0.08em', fontSize: 11 }}
              >
                {item.label}
              </Typography>
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: '10px',
                  display: 'grid',
                  placeItems: 'center',
                  background: `${item.accent}14`,
                }}
              >
                <IconComp sx={{ fontSize: 17, color: item.accent }} />
              </Box>
            </Box>
            <Typography
              sx={{
                mt: 1,
                fontWeight: 800,
                fontSize: '2rem',
                lineHeight: 1.1,
                background: `linear-gradient(135deg, #0f172a, ${item.accent})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              {values[item.key]}
              {item.suffix || ''}
            </Typography>
            <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: 11 }}>
              {item.sub}
            </Typography>
          </Paper>
        );
      })}
    </Box>
  );
};

export default StatsGrid;
