import React from 'react';
import { SvgIconProps } from '@mui/material';
import {
  PictureAsPdf as PdfIcon,
  Slideshow as SlidesIcon,
  Image as ImageIcon,
  Link as LinkIcon,
  Description as NotesIcon,
  Videocam as VideoIcon,
  Folder as FolderIcon,
} from '@mui/icons-material';
import { ResourceType } from '../types';

export function getIconForType(type: ResourceType): React.ReactElement {
  const props: SvgIconProps = { fontSize: 'inherit' };
  const map: Record<ResourceType, React.ReactElement> = {
    PDF: <PdfIcon {...props} />,
    Slides: <SlidesIcon {...props} />,
    Image: <ImageIcon {...props} />,
    Link: <LinkIcon {...props} />,
    Notes: <NotesIcon {...props} />,
    Video: <VideoIcon {...props} />,
  };
  return map[type] || <FolderIcon {...props} />;
}

export function getEmojiForType(type: ResourceType): string {
  const map: Record<ResourceType, string> = {
    PDF: '📄',
    Slides: '📊',
    Image: '🖼️',
    Link: '🔗',
    Notes: '📝',
    Video: '🎬',
  };
  return map[type] || '📁';
}

export const toneColors: Record<string, string> = {
  blue: '#3b82f6',
  violet: '#8b5cf6',
  amber: '#f59e0b',
  emerald: '#10b981',
  rose: '#fb7185',
  cyan: '#06b6d4',
  slate: '#64748b',
  indigo: '#6366f1',
};
