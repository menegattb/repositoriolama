// Serviço para buscar dados do YouTube usando OAuth
import secret from '../../secret.json';

interface YouTubeVideo {
  id: string;
  title: string;
  thumbnail: {
    url: string;
    width: number;
    height: number;
  };
}

interface YouTubePlaylistItem {
  id: string;
  snippet: {
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
      videoId: string;
    };
  };
}

interface YouTubePlaylistResponse {
  items: YouTubePlaylistItem[];
  nextPageToken?: string;
}

class YouTubeService {
  private accessToken: string | null = null;
  private readonly clientId = secret.web.client_id;
  private readonly clientSecret = secret.web.client_secret;

  // Método simplificado - usar API key em vez de OAuth
  async getAccessToken(): Promise<string> {
    // Por enquanto, usar método determinístico como fallback
    throw new Error('Using fallback method');
  }

  // Buscar primeiro vídeo de uma playlist - usar API key
  async getFirstVideoFromPlaylist(playlistId: string): Promise<string | null> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const apiKey = (secret as any).web?.api_key || (secret as any).api_key;
      
      if (!apiKey) {
        console.log('API key not found');
        return null;
      }

      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${playlistId}&maxResults=1&key=${apiKey}`
      );

      if (!response.ok) {
        console.error(`YouTube API error: ${response.status}`);
        return null;
      }

      const data = await response.json();
      
      if (data.items && data.items.length > 0) {
        const videoId = data.items[0].snippet.resourceId.videoId;
        console.log(`Found video ID: ${videoId} for playlist: ${playlistId}`);
        return videoId;
      }

      return null;
    } catch (error) {
      console.error('Error fetching video from playlist:', error);
      return null;
    }
  }

  // Buscar thumbnail de um vídeo - usar URLs padrão do YouTube ou fallback
  async getVideoThumbnail(videoId: string): Promise<string | null> {
    // Tentar URL padrão do YouTube primeiro
    const youtubeUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
    
    try {
      // Testar se a URL existe
      const response = await fetch(youtubeUrl, { method: 'HEAD' });
      if (response.ok) {
        return youtubeUrl;
      }
    } catch (error) {
      // URL não existe, usar fallback
    }
    
    // Fallback: retornar null para usar gradiente temático
    return null;
  }

}
export const youtubeService = new YouTubeService();

