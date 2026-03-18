import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { SearchOff as SearchOffIcon } from '@mui/icons-material';

const EmptyState: React.FC = () => {
  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: '22px',
        p: 5,
        textAlign: 'center',
        background: 'rgba(255,255,255,0.84)',
        backdropFilter: 'blur(18px)',
        border: '1px solid rgba(255,255,255,0.7)',
        boxShadow: '0 12px 32px rgba(15,23,42,0.08)',
      }}
    >
      <SearchOffIcon sx={{ fontSize: 48, color: '#94a3b8', mb: 1.5 }} />
      <Typography variant="h6" sx={{ fontWeight: 700 }}>
        No results found
      </Typography>
      <Typography variant="body2" sx={{ color: '#64748b', mt: 1 }}>
        Try a different keyword, reset filters, or switch to another file type.
      </Typography>
    </Paper>
  );
};

export default EmptyState;
