import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  Fade,
  CircularProgress,
  InputAdornment,
  IconButton,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  PersonOutline,
  LockOutlined,
  BadgeOutlined,
  AutoAwesome,
} from '@mui/icons-material';
import axios from 'axios';

interface AuthPageProps {
  onLoginSuccess: (user: { id: string; username: string; nickname: string }) => void;
}

const AuthPage: React.FC<AuthPageProps> = ({ onLoginSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!username.trim() || !password.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        const res = await axios.post('/api/auth/login', { username: username.trim(), password });
        if (res.data.success) {
          localStorage.setItem('studyflow_user', JSON.stringify(res.data.user));
          onLoginSuccess(res.data.user);
        }
      } else {
        if (username.trim().length < 3) {
          setError('Username must be at least 3 characters');
          setLoading(false);
          return;
        }
        if (password.length < 6) {
          setError('Password must be at least 6 characters');
          setLoading(false);
          return;
        }
        const res = await axios.post('/api/auth/register', {
          username: username.trim(),
          password,
          nickname: nickname.trim() || username.trim(),
        });
        if (res.data.success) {
          setSuccess('Registration successful! Please log in.');
          setIsLogin(true);
          setPassword('');
        }
      }
    } catch (err: any) {
      const msg = err?.response?.data?.error || 'Something went wrong, please try again';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setIsLogin(!isLogin);
    setError('');
    setSuccess('');
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
        background: `
          radial-gradient(circle at 20% 20%, rgba(101,163,255,0.22), transparent 40%),
          radial-gradient(circle at 80% 80%, rgba(139,92,246,0.18), transparent 35%),
          radial-gradient(circle at 50% 50%, rgba(99,102,241,0.06), transparent 60%),
          linear-gradient(180deg, #f0f4ff, #eef3fb)
        `,
      }}
    >
      {/* Decorative floating circles */}
      <Box
        sx={{
          position: 'fixed',
          top: '10%',
          left: '5%',
          width: 280,
          height: 280,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(59,130,246,0.08), transparent 65%)',
          animation: 'pulse 6s ease-in-out infinite',
          pointerEvents: 'none',
        }}
      />
      <Box
        sx={{
          position: 'fixed',
          bottom: '15%',
          right: '8%',
          width: 220,
          height: 220,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(139,92,246,0.1), transparent 65%)',
          animation: 'pulse 5s ease-in-out infinite 1s',
          pointerEvents: 'none',
        }}
      />

      <Fade in timeout={600}>
        <Paper
          elevation={0}
          sx={{
            width: '100%',
            maxWidth: 440,
            borderRadius: '28px',
            p: { xs: 3.5, sm: 4.5 },
            background: 'rgba(255,255,255,0.92)',
            backdropFilter: 'blur(24px)',
            border: '1px solid rgba(255,255,255,0.8)',
            boxShadow: '0 24px 64px rgba(15,23,42,0.1), 0 0 0 1px rgba(255,255,255,0.6)',
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '4px',
              background: 'linear-gradient(90deg, #3b82f6, #8b5cf6, #6366f1)',
              borderRadius: '28px 28px 0 0',
            },
          }}
        >
          {/* Logo */}
          <Box sx={{ textAlign: 'center', mb: 3.5 }}>
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: '18px',
                background: 'linear-gradient(135deg, #295df4, #6366f1)',
                display: 'inline-grid',
                placeItems: 'center',
                mb: 2,
                boxShadow: '0 8px 24px rgba(41,93,244,0.3)',
              }}
            >
              <AutoAwesome sx={{ color: '#fff', fontSize: 28 }} />
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a' }}>
              StudyFlow AI
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5 }}>
              {isLogin ? 'Welcome back! Sign in to continue.' : 'Create your account to get started.'}
            </Typography>
          </Box>

          {/* Form */}
          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {error && (
              <Alert
                severity="error"
                sx={{
                  borderRadius: '14px',
                  fontSize: 13,
                  '& .MuiAlert-icon': { fontSize: 20 },
                }}
              >
                {error}
              </Alert>
            )}
            {success && (
              <Alert
                severity="success"
                sx={{
                  borderRadius: '14px',
                  fontSize: 13,
                  '& .MuiAlert-icon': { fontSize: 20 },
                }}
              >
                {success}
              </Alert>
            )}

            <TextField
              label="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              fullWidth
              required
              autoComplete="username"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonOutline sx={{ color: '#94a3b8', fontSize: 20 }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '16px',
                  background: 'rgba(248,250,252,0.8)',
                  '& fieldset': { borderColor: 'rgba(148,163,184,0.25)' },
                  '&:hover fieldset': { borderColor: '#295df4' },
                  '&.Mui-focused fieldset': { borderColor: '#295df4', borderWidth: 2 },
                },
                '& .MuiInputLabel-root.Mui-focused': { color: '#295df4' },
              }}
            />

            {!isLogin && (
              <TextField
                label="Nickname (optional)"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                fullWidth
                autoComplete="name"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <BadgeOutlined sx={{ color: '#94a3b8', fontSize: 20 }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '16px',
                    background: 'rgba(248,250,252,0.8)',
                    '& fieldset': { borderColor: 'rgba(148,163,184,0.25)' },
                    '&:hover fieldset': { borderColor: '#295df4' },
                    '&.Mui-focused fieldset': { borderColor: '#295df4', borderWidth: 2 },
                  },
                  '& .MuiInputLabel-root.Mui-focused': { color: '#295df4' },
                }}
              />
            )}

            <TextField
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              fullWidth
              required
              autoComplete={isLogin ? 'current-password' : 'new-password'}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockOutlined sx={{ color: '#94a3b8', fontSize: 20 }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      sx={{ color: '#94a3b8' }}
                    >
                      {showPassword ? <VisibilityOff sx={{ fontSize: 20 }} /> : <Visibility sx={{ fontSize: 20 }} />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '16px',
                  background: 'rgba(248,250,252,0.8)',
                  '& fieldset': { borderColor: 'rgba(148,163,184,0.25)' },
                  '&:hover fieldset': { borderColor: '#295df4' },
                  '&.Mui-focused fieldset': { borderColor: '#295df4', borderWidth: 2 },
                },
                '& .MuiInputLabel-root.Mui-focused': { color: '#295df4' },
              }}
            />

            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={loading}
              sx={{
                borderRadius: '16px',
                textTransform: 'none',
                fontWeight: 700,
                fontSize: 15,
                py: 1.5,
                mt: 0.5,
                background: 'linear-gradient(135deg, #295df4, #6366f1)',
                boxShadow: '0 12px 28px rgba(41,93,244,0.3)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #3b6df5, #7c7cf7)',
                  boxShadow: '0 16px 36px rgba(41,93,244,0.35)',
                  transform: 'translateY(-1px)',
                },
                transition: 'all 0.25s ease',
                '&.Mui-disabled': {
                  background: '#cbd5e1',
                  boxShadow: 'none',
                },
              }}
            >
              {loading ? (
                <CircularProgress size={22} sx={{ color: '#fff' }} />
              ) : isLogin ? (
                'Sign In'
              ) : (
                'Create Account'
              )}
            </Button>
          </Box>

          {/* Switch */}
          <Box sx={{ textAlign: 'center', mt: 3 }}>
            <Typography variant="body2" sx={{ color: '#64748b' }}>
              {isLogin ? "Don't have an account?" : 'Already have an account?'}
              <Button
                onClick={switchMode}
                sx={{
                  textTransform: 'none',
                  fontWeight: 700,
                  color: '#295df4',
                  ml: 0.5,
                  p: 0,
                  minWidth: 'auto',
                  '&:hover': { background: 'transparent', textDecoration: 'underline' },
                }}
              >
                {isLogin ? 'Sign Up' : 'Sign In'}
              </Button>
            </Typography>
          </Box>

          {/* Footer */}
          <Typography
            variant="caption"
            sx={{
              display: 'block',
              textAlign: 'center',
              mt: 3,
              color: '#94a3b8',
              fontSize: 11,
            }}
          >
            StudyFlow AI — Smart Learning Resource Management
          </Typography>
        </Paper>
      </Fade>
    </Box>
  );
};

export default AuthPage;
