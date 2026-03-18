import React from 'react';
import {
  Box,
  Typography,
  Button,
  Chip,
  Paper,
  TextField,
  Select,
  MenuItem,
  InputAdornment,
} from '@mui/material';
import { Search as SearchIcon, FilterAltOff as ResetIcon } from '@mui/icons-material';
import { Resource, PageName, SortMode } from '../types';
import { typeOptions, categoryOptions } from '../data/resources';
import ResourceCard from './ResourceCard';
import EmptyState from './EmptyState';

interface ResourceLibraryProps {
  activePage: PageName;
  filteredResources: Resource[];
  search: string;
  onSearchChange: (value: string) => void;
  selectedType: string;
  onTypeChange: (type: string) => void;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  sortMode: SortMode;
  onSortChange: (mode: SortMode) => void;
  onToggleFavorite: (id: string) => void;
  onOpenDetail: (resource: Resource) => void;
  onResetFilters: () => void;
}

const ResourceLibrary: React.FC<ResourceLibraryProps> = ({
  activePage,
  filteredResources,
  search,
  onSearchChange,
  selectedType,
  onTypeChange,
  selectedCategory,
  onCategoryChange,
  sortMode,
  onSortChange,
  onToggleFavorite,
  onOpenDetail,
  onResetFilters,
}) => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
      {/* Toolbar */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: '22px',
          p: 2.5,
          background: 'rgba(255,255,255,0.84)',
          backdropFilter: 'blur(18px)',
          border: '1px solid rgba(255,255,255,0.7)',
          boxShadow: '0 12px 32px rgba(15,23,42,0.08)',
          display: 'flex',
          flexDirection: 'column',
          gap: 1.75,
        }}
      >
        <TextField
          fullWidth
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search resources, tags, or keywords..."
          size="small"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: '#94a3b8' }} />
              </InputAdornment>
            ),
            sx: {
              borderRadius: '16px',
              background: 'rgba(255,255,255,0.88)',
              '& fieldset': { borderColor: 'rgba(148,163,184,0.22)' },
              py: 0.5,
            },
          }}
        />

        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {typeOptions.map((type) => (
            <Chip
              key={type}
              label={type}
              clickable
              onClick={() => onTypeChange(type)}
              sx={{
                borderRadius: '16px',
                fontWeight: 500,
                fontSize: 13,
                px: 0.5,
                background: selectedType === type ? '#0f172a' : 'rgba(255,255,255,0.88)',
                color: selectedType === type ? '#fff' : '#334155',
                border: `1px solid ${selectedType === type ? '#0f172a' : 'rgba(148,163,184,0.22)'}`,
                '&:hover': { transform: 'translateY(-1px)' },
                transition: 'all 0.18s ease',
              }}
            />
          ))}
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 160px' }, gap: 1.2 }}>
          <Select
            value={selectedCategory}
            onChange={(e) => onCategoryChange(e.target.value)}
            size="small"
            sx={{
              borderRadius: '16px',
              background: 'rgba(255,255,255,0.88)',
              '& fieldset': { borderColor: 'rgba(148,163,184,0.22)' },
            }}
          >
            {categoryOptions.map((opt) => (
              <MenuItem key={opt} value={opt}>
                {opt}
              </MenuItem>
            ))}
          </Select>
          <Select
            value={sortMode}
            onChange={(e) => onSortChange(e.target.value as SortMode)}
            size="small"
            sx={{
              borderRadius: '16px',
              background: 'rgba(255,255,255,0.88)',
              '& fieldset': { borderColor: 'rgba(148,163,184,0.22)' },
            }}
          >
            {(['Recent', 'Favorites', 'A-Z', 'Progress'] as SortMode[]).map((opt) => (
              <MenuItem key={opt} value={opt}>
                {opt}
              </MenuItem>
            ))}
          </Select>
        </Box>
      </Paper>

      {/* Library Header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: { xs: 'stretch', sm: 'center' },
          flexDirection: { xs: 'column', sm: 'row' },
          gap: 1.5,
          borderRadius: '22px',
          p: 2.5,
          background: 'rgba(255,255,255,0.84)',
          backdropFilter: 'blur(18px)',
          border: '1px solid rgba(255,255,255,0.7)',
          boxShadow: '0 12px 32px rgba(15,23,42,0.08)',
        }}
      >
        <Box>
          <Typography
            variant="overline"
            sx={{ color: '#71839c', fontWeight: 800, letterSpacing: '0.08em', fontSize: 11 }}
          >
            {activePage}
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.3rem', mt: 0.3 }}>
            Resource Library
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b' }}>
            {filteredResources.length} resources found across multiple file types
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<ResetIcon />}
          onClick={onResetFilters}
          sx={{
            borderRadius: '16px',
            textTransform: 'none',
            fontWeight: 600,
            whiteSpace: 'nowrap',
            color: '#0f172a',
            borderColor: 'rgba(148,163,184,0.22)',
            background: 'rgba(255,255,255,0.88)',
            '&:hover': { transform: 'translateY(-1px)', background: '#f8fafc' },
            transition: 'all 0.18s ease',
          }}
        >
          Reset Filters
        </Button>
      </Box>

      {/* Resource Grid */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0,1fr))' },
          gap: 1.75,
        }}
      >
        {filteredResources.map((item) => (
          <ResourceCard
            key={item.id}
            resource={item}
            onToggleFavorite={onToggleFavorite}
            onOpenDetail={onOpenDetail}
          />
        ))}
      </Box>

      {filteredResources.length === 0 && <EmptyState />}
    </Box>
  );
};

export default ResourceLibrary;
