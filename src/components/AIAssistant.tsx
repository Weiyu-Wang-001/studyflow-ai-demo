import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Chip,
  Paper,
  IconButton,
  Drawer,
  TextField,
  CircularProgress,
} from '@mui/material';
import {
  Close as CloseIcon,
  Send as SendIcon,
  AutoAwesome as AiIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { ChatMessage } from '../types';

// Remove markdown formatting (**, *, _, `, etc.)
const sanitizeMarkdown = (text: string): string => {
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1') // **bold** -> bold
    .replace(/\*(.+?)\*/g, '$1') // *italic* -> italic
    .replace(/__(.+?)__/g, '$1') // __bold__ -> bold
    .replace(/_(.+?)_/g, '$1') // _italic_ -> italic
    .replace(/`(.+?)`/g, '$1') // `code` -> code
    .replace(/#+\s/g, ''); // # heading -> heading
};

interface AIAssistantProps {
  open: boolean;
  onClose: () => void;
  messages: ChatMessage[];
  onSendPrompt: (prompt: string) => void;
  loading: boolean;
}

const AIAssistant: React.FC<AIAssistantProps> = ({
  open,
  onClose,
  messages,
  onSendPrompt,
  loading,
}) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;
    onSendPrompt(text);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: '100%', sm: 440 },
          borderRadius: { xs: 0, sm: '28px 0 0 28px' },
          p: 3,
          display: 'flex',
          flexDirection: 'column',
          background: 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 20px 50px rgba(15,23,42,0.14)',
        },
      }}
    >
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
        <Box>
          <Typography
            variant="overline"
            sx={{ color: '#71839c', fontWeight: 800, letterSpacing: '0.08em', fontSize: 11 }}
          >
            AI Assistant
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.2rem', mt: 0.5 }}>
            Ask About Your Resources
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

      {/* Messages */}
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 1.2,
          minHeight: 200,
          pr: 0.5,
          '&::-webkit-scrollbar': { width: 4 },
          '&::-webkit-scrollbar-thumb': { background: '#cbd5e1', borderRadius: 4 },
        }}
      >
        {messages.map((msg, idx) => (
          <Paper
            key={idx}
            variant="outlined"
            sx={{
              borderRadius: '18px',
              p: 2,
              borderColor: 'rgba(148,163,184,0.22)',
              background: msg.role === 'user' ? '#eef4ff' : 'rgba(255,255,255,0.86)',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mb: 0.8 }}>
              {msg.role === 'assistant' ? (
                <AiIcon sx={{ fontSize: 14, color: '#295df4' }} />
              ) : (
                <PersonIcon sx={{ fontSize: 14, color: '#64748b' }} />
              )}
              <Typography
                variant="overline"
                sx={{ color: '#71839c', fontWeight: 800, letterSpacing: '0.08em', fontSize: 10 }}
              >
                {msg.role === 'assistant' ? 'AI' : 'You'}
              </Typography>
            </Box>
            
            {/* Summary section */}
            {msg.summary && (
              <Box sx={{ mb: msg.suggestions?.length ? 1.5 : 0 }}>
                <Typography
                  component="div"
                  variant="body2"
                  sx={{
                    color: '#475569',
                    lineHeight: 1.8,
                    wordBreak: 'break-word',
                    fontWeight: 500,
                  }}
                >
                  {sanitizeMarkdown(msg.summary || '')}
                </Typography>
              </Box>
            )}
            
            {/* Suggestions section */}
            {msg.suggestions && msg.suggestions.length > 0 && (
              <Box sx={{ mt: msg.summary ? 1.5 : 0, pt: msg.summary ? 1.5 : 0, borderTop: msg.summary ? '1px solid rgba(148,163,184,0.15)' : 'none' }}>
                <Typography
                  variant="caption"
                  sx={{
                    display: 'block',
                    color: '#64748b',
                    fontWeight: 700,
                    fontSize: 10,
                    mb: 0.8,
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                  }}
                >
                  💡 Suggestions
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.6 }}>
                  {msg.suggestions.map((suggestion, sidx) => (
                    <Box
                      key={sidx}
                      sx={{
                        display: 'flex',
                        gap: 0.8,
                        p: 0.8,
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, rgba(41,93,244,0.08) 0%, rgba(41,93,244,0.04) 100%)',
                        border: '1px solid rgba(41,93,244,0.12)',
                      }}
                    >
                      <Typography
                        sx={{
                          minWidth: 18,
                          fontWeight: 600,
                          color: '#295df4',
                          fontSize: 12,
                        }}
                      >
                        {sidx + 1}.
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          color: '#475569',
                          lineHeight: 1.6,
                          fontSize: '0.85rem',
                        }}
                      >
                        {sanitizeMarkdown(suggestion)}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            )}
            
            {/* Fallback for plain text messages */}
            {!msg.summary && (
              <Typography
                component="div"
                variant="body2"
                sx={{
                  color: '#475569',
                  lineHeight: 1.8,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
              >
                {sanitizeMarkdown(msg.text)}
              </Typography>
            )}
          </Paper>
        ))}
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
            <CircularProgress size={24} sx={{ color: '#295df4' }} />
          </Box>
        )}
        <div ref={messagesEndRef} />
      </Box>

      {/* Input */}
      <Box sx={{ display: 'flex', gap: 1.2, alignItems: 'flex-end' }}>
        <TextField
          multiline
          minRows={2}
          maxRows={4}
          fullWidth
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask a question about the selected resource..."
          disabled={loading}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: '16px',
              background: 'rgba(255,255,255,0.88)',
              '& fieldset': { borderColor: 'rgba(148,163,184,0.22)' },
            },
          }}
        />
        <Button
          variant="contained"
          onClick={handleSend}
          disabled={loading || !input.trim()}
          sx={{
            borderRadius: '16px',
            minWidth: 48,
            height: 48,
            p: 0,
            background: 'linear-gradient(135deg,#295df4,#183db7)',
            boxShadow: '0 12px 24px rgba(41,93,244,0.28)',
            '&:hover': { background: 'linear-gradient(135deg,#3b6df5,#1e4bc8)' },
          }}
        >
          <SendIcon fontSize="small" />
        </Button>
      </Box>
    </Drawer>
  );
};

export default AIAssistant;
