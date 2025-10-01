export interface MediaItem {
  id: string;
  title: string;
  description: string;
  summary: string;
  date: string;
  location: string;
  format: 'audio' | 'video';
  media_url: string;
  duration: number; // em segundos
  theme: string;
  event_type: string;
  series_title: string;
  track_title: string;
}

export interface Playlist {
  id: string;
  title: string;
  description: string;
  thumbnail_url: string;
  items: MediaItem[];
  featured?: boolean;
  metadata: {
    total_talks: number;
    year: string;
    location: string;
    format: string;
  };
}

export interface Transcript {
  id: string;
  media_item_id: string;
  content: string;
  timestamps: Timestamp[];
}

export interface Timestamp {
  time: number; // em segundos
  text: string;
}

export interface User {
  id: string;
  email: string;
  password_hash: string;
}

export interface SearchResult {
  type: 'playlist' | 'media_item' | 'transcript';
  id: string;
  title: string;
  description: string;
  relevance_score: number;
}
