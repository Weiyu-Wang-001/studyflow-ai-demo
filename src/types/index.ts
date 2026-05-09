export type ResourceType = 'PDF' | 'Slides' | 'Image' | 'Link' | 'Notes' | 'Video' | 'File';

export interface Resource {
  id: string;
  ownerId?: string;
  title: string;
  type: ResourceType;
  course: string;
  description: string;
  tags: string[];
  updatedAt: string;
  favorite: boolean;
  status: string;
  progress: number;
  tone: string;
  content: string;
  filePath?: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
  summary?: string;
  suggestions?: string[];
}

export type PageName = 'Dashboard' | 'Library' | 'Favorites' | 'Workspace' | 'Analytics';
export type SortMode = 'Recent' | 'Favorites' | 'A-Z' | 'Progress';
