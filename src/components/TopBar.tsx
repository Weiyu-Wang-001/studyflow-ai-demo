import React from 'react';
import {
  Box,
  Typography,
  Button,
  Chip,
  Paper,
  IconButton,
  Avatar,
} from '@mui/material';
import {
  AutoAwesome as AiIcon,
  LogoutRounded as LogoutIcon,
} from '@mui/icons-material';

interface TopBarProps {
  onOpenAssistant: () => void;
  userNickname: string;
  onLogout: () => void;
}

const TopBar: React.FC<TopBarProps> = ({
  onOpenAssistant,
  userNickname,
  onLogout,
}) => {
  return (
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

      {/* Right: AI + User */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, flexShrink: 0 }}>
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
  );
};

export default TopBar;
