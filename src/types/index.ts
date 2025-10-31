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
    hasTranscription?: boolean;
    hasAudio?: boolean;
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

export interface TranscriptResponse {
  success: boolean;
  videoId: string;
  transcriptUrl?: string;
  content?: string;
  formattedContent?: string; // Texto formatado com timestamps [HH:MM:SS]
  transcriptArray?: any[]; // Array original de objetos da transcrição
  srtContent?: string; // Conteúdo em formato SRT completo
  lang?: string;
  error?: string;
  message?: string;
  cached?: boolean;
  details?: any;
}
