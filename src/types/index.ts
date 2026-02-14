// src/types/index.ts

export interface Conversation {
  id: string;
  title: string;
  preview: string;
  timestamp: string;
  project?: string;
  pinned?: boolean;
  starred?: boolean;
  messages?: Message[];
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  solutions?: string[];
}

export type BookmarkVariant = 'single-text' | 'single-code' | 'multi-bookmark' | 'draft';

export interface BookmarkOption {
  id: string;
  label: string;
  title: string;
  content: string;
  isSaved: boolean;
}

export interface Bookmark {
  id: string;
  variant: BookmarkVariant;
  conversationId: string;
  conversationTitle: string;
  messageId: string;
  userQuery: string;
  responsePreview: string;
  fullResponse: string;
  codeBlock?: string;
  codeLanguage?: string;
  selectedOptions?: string[];
  unselectedOptions?: string[];
  options?: BookmarkOption[];
  draftContent?: string;
  strategicNote?: string;
  project?: string;
  note?: string;
  createdAt: string;
}