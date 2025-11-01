import { MediaItem } from '@/types';

// Não usar secret.json - o serviço já tem fallback para mock data
// Se precisar de API key do YouTube, usar variável de ambiente
const getApiKey = (): string => {
  // Retornar vazio para usar mock data
  // Para usar API do YouTube, configure YOUTUBE_API_KEY como variável de ambiente
  return process.env.YOUTUBE_API_KEY || '';
};

interface YouTubeVideoItem {
  id: string;
  snippet: {
    publishedAt: string;
    channelId: string;
    title: string;
    description: string;
    thumbnails: {
      default: { url: string; width: number; height: number; };
      medium: { url: string; width: number; height: number; };
      high: { url: string; width: number; height: number; };
      standard: { url: string; width: number; height: number; };
      maxres: { url: string; width: number; height: number; };
    };
    resourceId: {
      kind: string;
      videoId: string;
    };
  };
}

interface YouTubePlaylistResponse {
  items: YouTubeVideoItem[];
  nextPageToken?: string;
}

interface VideoDetails {
  id: string;
  contentDetails: {
    duration: string;
  };
}

interface VideoDetailsResponse {
  items: VideoDetails[];
}

class YouTubePlaylistService {
  private apiKey: string;

  constructor() {
    this.apiKey = getApiKey();
  }

  // Converter duração ISO 8601 para segundos
  private parseDuration(duration: string): number {
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return 0;
    
    const hours = parseInt(match[1] || '0', 10);
    const minutes = parseInt(match[2] || '0', 10);
    const seconds = parseInt(match[3] || '0', 10);
    
    return hours * 3600 + minutes * 60 + seconds;
  }

  // Buscar todos os vídeos de uma playlist
  async getPlaylistVideos(playlistId: string): Promise<MediaItem[]> {
    // Se estiver no cliente (browser), usar API route para manter API key segura
    if (typeof window !== 'undefined') {
      try {
        console.log('[YouTubePlaylistService] 🌐 Client-side: usando API route para buscar vídeos');
        const response = await fetch(`/api/youtube/playlist/${playlistId}/videos`);
        
        if (!response.ok) {
          console.error(`[YouTubePlaylistService] API route error: ${response.status}`);
          return this.getMockVideos(playlistId);
        }

        const data = await response.json();
        if (data.videos && data.videos.length > 0) {
          console.log(`[YouTubePlaylistService] ✅ Recebeu ${data.videos.length} vídeos da API route`);
          return data.videos;
        }
        
        // Se não retornou vídeos, usar mock
        return this.getMockVideos(playlistId);
      } catch (error) {
        console.error('[YouTubePlaylistService] Error fetching from API route:', error);
        return this.getMockVideos(playlistId);
      }
    }

    // Server-side: usar API key diretamente se disponível
    if (!this.apiKey) {
      console.warn('[YouTubePlaylistService] Server-side: YouTube API key not found, using mock data');
      return this.getMockVideos(playlistId);
    }

    try {
      console.log('[YouTubePlaylistService] 🖥️ Server-side: buscando vídeos diretamente da API do YouTube');
      const videos = [];
      let nextPageToken = '';

      do {
        const response = await fetch(
          `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${playlistId}&maxResults=50&key=${this.apiKey}${nextPageToken ? `&pageToken=${nextPageToken}` : ''}`
        );

        if (!response.ok) {
          console.error(`[YouTubePlaylistService] YouTube API error: ${response.status}`);
          return this.getMockVideos(playlistId);
        }

        const data: YouTubePlaylistResponse = await response.json();
        
        for (const item of data.items) {
          videos.push({
            id: item.snippet.resourceId.videoId,
            title: item.snippet.title,
            description: item.snippet.description,
            summary: item.snippet.description.substring(0, 200) + '...',
            date: item.snippet.publishedAt.split('T')[0],
            location: 'CEBB',
            format: 'video' as const,
            media_url: `https://www.youtube.com/watch?v=${item.snippet.resourceId.videoId}`,
            duration: 0, // Será preenchido abaixo
            theme: 'Ensinamentos Gerais',
            event_type: 'Palestra',
            series_title: 'Ensinamentos do CEBB',
            track_title: item.snippet.title
          });
        }

        nextPageToken = data.nextPageToken || '';
      } while (nextPageToken);

      // Buscar durações dos vídeos
      await this.fillVideoDurations(videos);

      console.log(`[YouTubePlaylistService] ✅ Server-side: retornando ${videos.length} vídeos`);
      return videos;
    } catch (error) {
      console.error('[YouTubePlaylistService] Error fetching playlist videos:', error);
      return this.getMockVideos(playlistId);
    }
  }

  // Preencher durações dos vídeos
  private async fillVideoDurations(videos: MediaItem[]): Promise<void> {
    if (!this.apiKey) return;

    try {
      // Processar em lotes de 50 (limite da API)
      for (let i = 0; i < videos.length; i += 50) {
        const batch = videos.slice(i, i + 50);
        const videoIds = batch.map(v => v.id).join(',');
        
        const response = await fetch(
          `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${videoIds}&key=${this.apiKey}`
        );

        if (!response.ok) continue;

        const data: VideoDetailsResponse = await response.json();
        
        for (const videoDetail of data.items) {
          const video = videos.find(v => v.id === videoDetail.id);
          if (video) {
            video.duration = this.parseDuration(videoDetail.contentDetails.duration);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching video durations:', error);
    }
  }

  // Dados mockados como fallback
  private getMockVideos(playlistId: string): MediaItem[] {
    const mockVideos = [
      {
        id: `${playlistId}_1`,
        title: 'Vídeo 1 da Playlist',
        description: 'Descrição do primeiro vídeo',
        summary: 'Descrição resumida do primeiro vídeo...',
        date: '2025-01-01',
        location: 'CEBB',
        format: 'video' as const,
        media_url: `https://www.youtube.com/watch?v=${playlistId.slice(-11)}`,
        duration: 3600, // 1 hora
        theme: 'Ensinamentos Gerais',
        event_type: 'Palestra',
        series_title: 'Ensinamentos do CEBB',
        track_title: 'Vídeo 1 da Playlist'
      },
      {
        id: `${playlistId}_2`,
        title: 'Vídeo 2 da Playlist',
        description: 'Descrição do segundo vídeo',
        summary: 'Descrição resumida do segundo vídeo...',
        date: '2025-01-02',
        location: 'CEBB',
        format: 'video' as const,
        media_url: `https://www.youtube.com/watch?v=${playlistId.slice(-11)}`,
        duration: 2700, // 45 minutos
        theme: 'Ensinamentos Gerais',
        event_type: 'Palestra',
        series_title: 'Ensinamentos do CEBB',
        track_title: 'Vídeo 2 da Playlist'
      }
    ];

    return mockVideos;
  }
}

export const youtubePlaylistService = new YouTubePlaylistService();
