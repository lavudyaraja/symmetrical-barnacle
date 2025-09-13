// Enhanced Story Feature Components
// Modern, AI-powered story system with advanced interactions

// Core Components
export { StoryCreator } from './StoryCreator';
export { StoryViewerEnhanced } from './StoryViewerEnhanced';
export { StoryFeedEnhanced } from './StoryFeedEnhanced';
export { StoryAnalytics } from './StoryAnalytics';

// Types
export interface Story {
  id: string;
  user_id: string;
  username: string;
  avatar_url?: string;
  content?: string;
  media_url?: string;
  media_type: 'image' | 'video' | 'text';
  text_overlays?: string;
  stickers?: string;
  filters?: string;
  music?: string;
  poll?: string;
  created_at: string;
  expires_at: string;
  views_count?: number;
  is_viewed?: boolean;
}

export interface StoryUser {
  id: string;
  username: string;
  avatar_url?: string;
  stories: Story[];
  hasUnwatched: boolean;
  lastStoryTime: string;
  isHighlight?: boolean;
  highlightTitle?: string;
}

export interface TextOverlay {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  color: string;
  fontFamily: string;
  rotation: number;
}

export interface StickerElement {
  id: string;
  type: 'emoji' | 'gif' | 'location' | 'mention' | 'hashtag';
  content: string;
  x: number;
  y: number;
  scale: number;
  rotation: number;
}

export interface FilterConfig {
  name: string;
  intensity: number;
  effects: string[];
}

export interface MusicTrack {
  id: string;
  name: string;
  artist: string;
  url: string;
  startTime: number;
  duration: number;
}

export interface PollData {
  question: string;
  options: string[];
  allowMultiple: boolean;
}

export interface Reaction {
  id: string;
  user_id: string;
  emoji: string;
  created_at: string;
}

export interface Reply {
  id: string;
  user_id: string;
  username: string;
  content: string;
  created_at: string;
}