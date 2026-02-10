// src/types/index.ts

export type TopicId = 'code' | 'writing' | 'research' | 'design' | 'planning' | 'learning';

export interface Topic {
  id: TopicId;
  name: string;
  color: string;
  count: number;
}

export interface Conversation {
  id: string;
  topicId: TopicId;
  color: string;
  title: string;
  preview: string;
  timestamp: string;
  project?: string;
  pinned?: boolean;
  messages?: Message[];
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}