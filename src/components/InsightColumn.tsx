import React from 'react';
import { Box, Typography, Paper, Button } from '@mui/material';
import { Resource } from '../types';
import { getIconForType } from '../utils/icons';
import DataCharts from './DataCharts';

interface InsightColumnProps {
  resources: Resource[];
  favoriteResources: Resource[];
  recentResources: Resource[];
  onOpenDetail: (resource: Resource) => void;
}

const InsightColumn: React.FC<InsightColumnProps> = ({
  resources,
  favoriteResources,
  recentResources,
  onOpenDetail,
}) => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
      {/* Data Visualization */}
      <DataCharts resources={resources} />

      {/* Workspace Snapshot */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: '22px',
          p: 2.5,
          background: 'rgba(255,255,255,0.84)',
          backdropFilter: 'blur(18px)',
          border: '1px solid rgba(255,255,255,0.7)',
          boxShadow: '0 12px 32px rgba(15,23,42,0.08)',
        }}
      >
        <Typography
          variant="overline"
          sx={{ color: '#71839c', fontWeight: 800, letterSpacing: '0.08em', fontSize: 11 }}
        >
          Workspace Snapshot
        </Typography>
        <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.2rem', mt: 0.5 }}>
          Why this UI feels product-like
        </Typography>
        <Box
          component="ul"
          sx={{
            pl: 2.5,
            mt: 1.5,
            mb: 0,
            color: '#64748b',
            display: 'grid',
            gap: 1,
            '& li': { fontSize: 13, lineHeight: 1.5 },
          }}
        >
          <li>Clear visual hierarchy for faster scanning</li>
          <li>Unified search that hides file-format complexity</li>
          <li>Detail drawer for context without navigation loss</li>
          <li>AI actions attached to meaningful resource states</li>
          <li>Responsive layout for laptop and tablet demos</li>
        </Box>
      </Paper>

      {/* Favorites */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: '22px',
          p: 2.5,
          background: 'rgba(255,255,255,0.84)',
          backdropFilter: 'blur(18px)',
          border: '1px solid rgba(255,255,255,0.7)',
          boxShadow: '0 12px 32px rgba(15,23,42,0.08)',
        }}
      >
        <Typography
          variant="overline"
          sx={{ color: '#71839c', fontWeight: 800, letterSpacing: '0.08em', fontSize: 11 }}
        >
          Favorites
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.2, mt: 1.2 }}>
          {favoriteResources.slice(0, 3).map((item) => (
            <Button
              key={item.id}
              fullWidth
              onClick={() => onOpenDetail(item)}
              sx={{
                justifyContent: 'space-between',
                textTransform: 'none',
                borderRadius: '16px',
                py: 1.3,
                px: 2,
                color: '#0f172a',
                background: 'rgba(255,255,255,0.88)',
                border: '1px solid rgba(148,163,184,0.22)',
                '&:hover': { transform: 'translateY(-1px)', background: '#f8fafc' },
                transition: 'all 0.18s ease',
              }}
            >
              <Box sx={{ textAlign: 'left' }}>
                <Typography variant="body2" sx={{ fontWeight: 700, fontSize: 13 }}>
                  {item.title}
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748b' }}>
                  {item.course}
                </Typography>
              </Box>
              <Box sx={{ fontSize: 20, color: '#94a3b8', display: 'flex', alignItems: 'center' }}>{getIconForType(item.type)}</Box>
            </Button>
          ))}
        </Box>
      </Paper>

      {/* Recently Filtered */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: '22px',
          p: 2.5,
          background: 'rgba(255,255,255,0.84)',
          backdropFilter: 'blur(18px)',
          border: '1px solid rgba(255,255,255,0.7)',
          boxShadow: '0 12px 32px rgba(15,23,42,0.08)',
        }}
      >
        <Typography
          variant="overline"
          sx={{ color: '#71839c', fontWeight: 800, letterSpacing: '0.08em', fontSize: 11 }}
        >
          Recently Filtered
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.2, mt: 1.2 }}>
          {recentResources.map((item) => (
            <Paper
              key={item.id}
              variant="outlined"
              sx={{
                borderRadius: '16px',
                p: 2,
                background: 'rgba(255,255,255,0.8)',
                borderColor: 'rgba(148,163,184,0.22)',
              }}
            >
              <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5 }}>
                {item.title}
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b', lineHeight: 1.5 }}>
                {item.content.slice(0, 110)}...
              </Typography>
            </Paper>
          ))}
        </Box>
      </Paper>
    </Box>
  );
};

export default InsightColumn;
