
export type NodeType = 'concept' | 'photo' | 'pdf' | 'website' | 'youtube' | 'chat' | 'group';

export interface Node {
  id: string;
  title: string;
  content: string;
  type: NodeType;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  icon?: string;
  parentId?: string;
  metadata?: {
    url?: string;
    fileId?: string;
    thumbnail?: string;
    fileData?: string; // Base64 encoded file data
    videoId?: string;
    fileName?: string;
    messages?: ChatMessage[];
    history?: ChatMessage[][];
  };
}

export interface Connection {
  id: string;
  fromId: string;
  toId: string;
  label: string;
}

export interface Point {
  x: number;
  y: number;
}

export enum ConnectionType {
  INSPIRED_BY = 'inspired_by',
  CONTRADICTS = 'contradicts',
  SUPPORTS = 'supports',
  RELATED_TO = 'related_to',
  ANALYZES = 'analyzes',
  CONTAINS = 'contains'
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
}
