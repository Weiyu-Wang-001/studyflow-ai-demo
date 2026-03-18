import React from 'react';
import {
  Box,
  Typography,
  Button,
  Chip,
  Paper,
  Stack,
  Divider,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  LibraryBooks as LibraryIcon,
  Favorite as FavoriteIcon,
  WorkspacesOutlined as WorkspaceIcon,
  Circle as CircleIcon,
  AutoAwesome as AiIcon,
  LogoutRounded as LogoutIcon,
  AccountCircleRounded as AccountIcon,
} from '@mui/icons-material';
import { PageName } from '../types';

interface SidebarProps {
  activePage: PageName;
  onPageChange: (page: PageName) => void;
  history: string[];
  quickPrompts: string[];
  onPrompt: (prompt: string) => void;
  userNickname?: string;
  onLogout?: () => void;
}

const navItems: { label: PageName; icon: React.ReactElement }[] = [
  { label: 'Dashboard', icon: <DashboardIcon fontSize="small" /> },
  { label: 'Library', icon: <LibraryIcon fontSize="small" /> },
  { label: 'Favorites', icon: <FavoriteIcon fontSize="small" /> },
  { label: 'Workspace', icon: <WorkspaceIcon fontSize="small" /> },
];

const Sidebar: React.FC<SidebarProps> = ({
  activePage,
  onPageChange,
  history,
  quickPrompts,
  onPrompt,
  userNickname,
  onLogout,
}) => {
  return (
    <Paper
      elevation={0}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        borderRadius: '24px',
        p: 2.5,
        position: 'sticky',
        top: 22,
        height: 'calc(100vh - 44px)',
        overflow: 'auto',
        background: 'rgba(255,255,255,0.85)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.7)',
        boxShadow: '0 12px 32px rgba(15,23,42,0.08)',
        '&::-webkit-scrollbar': { width: 4 },
        '&::-webkit-scrollbar-thumb': { background: '#cbd5e1', borderRadius: 4 },
      }}
    >
      {/* User Info */}
      {userNickname && (
        <Box
          sx={{
            borderRadius: '20px',
            background: 'linear-gradient(135deg, rgba(41,93,244,0.06), rgba(99,102,241,0.04))',
            border: '1px solid rgba(148,163,184,0.16)',
            p: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #295df4, #6366f1)',
                display: 'grid',
                placeItems: 'center',
              }}
            >
              <AccountIcon sx={{ color: '#fff', fontSize: 20 }} />
            </Box>
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 700, fontSize: 13, lineHeight: 1.2 }}>
                {userNickname}
              </Typography>
              <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: 11 }}>
                Online
              </Typography>
            </Box>
          </Box>
          {onLogout && (
            <Button
              size="small"
              onClick={onLogout}
              sx={{
                minWidth: 'auto',
                p: 0.8,
                borderRadius: '10px',
                color: '#94a3b8',
                '&:hover': { color: '#ef4444', background: 'rgba(239,68,68,0.08)' },
              }}
            >
              <LogoutIcon sx={{ fontSize: 18 }} />
            </Button>
          )}
        </Box>
      )}

      {/* Brand */}
      <Box
        sx={{
          borderRadius: '20px',
          background: 'rgba(255,255,255,0.72)',
          border: '1px solid rgba(148,163,184,0.16)',
          p: 2.5,
        }}
      >
        <Chip
          label="Hackathon · UI-First Demo"
          size="small"
          sx={{
            background: 'linear-gradient(135deg,#e9f1ff,#eef2ff)',
            color: '#295df4',
            fontWeight: 700,
            fontSize: 11,
          }}
        />
        <Typography variant="h4" sx={{ mt: 1.5, fontWeight: 800, lineHeight: 1 }}>
          StudyFlow AI
        </Typography>
        <Typography variant="body2" sx={{ mt: 1, color: '#64748b', lineHeight: 1.5 }}>
          A polished resource dashboard combining modern web UI with contextual AI assistance.
        </Typography>
      </Box>

      {/* Navigation */}
      <Box
        sx={{
          borderRadius: '20px',
          background: 'rgba(255,255,255,0.72)',
          border: '1px solid rgba(148,163,184,0.16)',
          p: 2,
        }}
      >
        <Typography
          variant="overline"
          sx={{ color: '#71839c', fontWeight: 800, letterSpacing: '0.08em', fontSize: 11 }}
        >
          Navigation
        </Typography>
        <Stack spacing={1} sx={{ mt: 1 }}>
          {navItems.map(({ label, icon }) => (
            <Button
              key={label}
              fullWidth
              startIcon={icon}
              onClick={() => onPageChange(label)}
              sx={{
                justifyContent: 'flex-start',
                textTransform: 'none',
                borderRadius: '16px',
                py: 1.3,
                px: 2,
                fontWeight: 600,
                fontSize: 14,
                color: activePage === label ? '#fff' : '#0f172a',
                background:
                  activePage === label
                    ? 'linear-gradient(135deg,#15284a,#0f172a)'
                    : 'rgba(255,255,255,0.88)',
                border: `1px solid ${activePage === label ? '#15284a' : 'rgba(148,163,184,0.22)'}`,
                boxShadow:
                  activePage === label ? '0 12px 28px rgba(15,23,42,0.16)' : 'none',
                '&:hover': {
                  transform: 'translateY(-1px)',
                  background:
                    activePage === label
                      ? 'linear-gradient(135deg,#15284a,#0f172a)'
                      : 'rgba(241,245,249,0.9)',
                },
                transition: 'all 0.18s ease',
              }}
            >
              {label}
            </Button>
          ))}
        </Stack>
      </Box>

      {/* Recent Views */}
      <Box
        sx={{
          borderRadius: '20px',
          background: 'rgba(255,255,255,0.72)',
          border: '1px solid rgba(148,163,184,0.16)',
          p: 2,
        }}
      >
        <Typography
          variant="overline"
          sx={{ color: '#71839c', fontWeight: 800, letterSpacing: '0.08em', fontSize: 11 }}
        >
          Recent Views
        </Typography>
        <Stack spacing={1} sx={{ mt: 1 }}>
          {history.map((item) => (
            <Box
              key={item}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.2,
                py: 1,
                px: 1.5,
                borderRadius: '14px',
                border: '1px solid rgba(148,163,184,0.22)',
                background: 'rgba(255,255,255,0.88)',
                fontSize: 13,
              }}
            >
              <CircleIcon sx={{ fontSize: 8, color: '#295df4' }} />
              <Typography variant="body2" noWrap>
                {item}
              </Typography>
            </Box>
          ))}
        </Stack>
      </Box>

      {/* Quick Demo Prompts */}
      <Box
        sx={{
          borderRadius: '20px',
          background: 'rgba(255,255,255,0.72)',
          border: '1px solid rgba(148,163,184,0.16)',
          p: 2,
        }}
      >
        <Typography
          variant="overline"
          sx={{ color: '#71839c', fontWeight: 800, letterSpacing: '0.08em', fontSize: 11 }}
        >
          Quick Demo Prompts
        </Typography>
        <Stack spacing={1} sx={{ mt: 1 }}>
          {quickPrompts.map((prompt) => (
            <Button
              key={prompt}
              fullWidth
              size="small"
              startIcon={<AiIcon sx={{ fontSize: 14 }} />}
              onClick={() => onPrompt(prompt)}
              sx={{
                justifyContent: 'flex-start',
                textTransform: 'none',
                borderRadius: '14px',
                py: 1,
                px: 1.5,
                fontSize: 12,
                color: '#334155',
                background: 'rgba(255,255,255,0.88)',
                border: '1px solid rgba(148,163,184,0.22)',
                '&:hover': {
                  transform: 'translateY(-1px)',
                  background: '#f1f5f9',
                },
                transition: 'all 0.18s ease',
              }}
            >
              {prompt}
            </Button>
          ))}
        </Stack>
      </Box>
    </Paper>
  );
};

export default Sidebar;
