export type Language = 'en' | 'zh' | 'es' | 'ja';

export interface User {
  id: string;
  name: string;
  email: string;
  isLoggedIn: boolean;
}

export interface Attachment {
  mimeType: string;
  data: string; // base64
}

export interface Message {
  id: string;
  role: 'user' | 'model' | 'system';
  content: string;
  attachment?: Attachment;
  timestamp: number;
}

export interface MindMapNode {
  id: string;
  x: number;
  y: number;
  label: string;
  type: 'root' | 'child' | 'idea';
}

export interface MindMapEdge {
  id: string;
  source: string;
  target: string;
}

export interface MindMapData {
  nodes: MindMapNode[];
  edges: MindMapEdge[];
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  mindMap: MindMapData;
  memo: string;
  lastUpdated: number;
}

export interface InspirationNote {
  id: string;
  createdAt: number;
  project: {
    summary: string;
    targetAudience: string;
    scenarios: string;
    tags: string[];
    details: string;
  };
  business: {
    valueProps: string[];
    difficulties: string[];
    mvpFeatures: string[];
    strategy: string;
  };
  legal: {
    risks: string[];
    disclaimer: string;
  };
  visualStructure?: {
    centralNode: string;
    branches: { main: string; subs: string[] }[];
  };
}

export interface SavedInspiration {
  id: string;
  sessionId: string;
  title: string;
  date: string;
  note: InspirationNote;
  mindMapSnapshot: MindMapData;
  memoSnapshot: string;
}

export type AppView = 'home' | 'chat' | 'note_review' | 'my_inspirations';