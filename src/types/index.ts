export type ResourceType = 'PDF' | 'Slides' | 'Image' | 'Link' | 'Notes' | 'Video';

export interface Resource {
  id: string;
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
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
}

export type PageName = 'Dashboard' | 'Library' | 'Favorites' | 'Workspace';
export type SortMode = 'Recent' | 'Favorites' | 'A-Z' | 'Progress';
