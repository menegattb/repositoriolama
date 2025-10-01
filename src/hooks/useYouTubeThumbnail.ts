import { useState, useEffect } from 'react';

interface VideoData {
  videoId: string;
  title: string;
  thumbnail: string;
}

export function useYouTubeThumbnail(playlistId: string) {
  const [videoData, setVideoData] = useState<VideoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVideoData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Usar uma API pública para buscar dados da playlist
        // Alternativa: usar YouTube Data API v3 com chave de API
        const response = await fetch(`/api/youtube/playlist/${playlistId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch playlist data');
        }

        const data = await response.json();
        
        if (data.items && data.items.length > 0) {
          const firstVideo = data.items[0];
          setVideoData({
            videoId: firstVideo.id,
            title: firstVideo.title,
            thumbnail: `https://img.youtube.com/vi/${firstVideo.id}/maxresdefault.jpg`
          });
        }
      } catch (err) {
        console.error('Error fetching video data:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    if (playlistId) {
      fetchVideoData();
    }
  }, [playlistId]);

  return { videoData, loading, error };
}
