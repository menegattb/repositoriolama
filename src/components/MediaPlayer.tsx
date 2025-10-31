'use client';

import { MediaItem } from '@/types';

interface MediaPlayerProps {
  mediaItem: MediaItem | null;
}

export default function MediaPlayer({ mediaItem }: MediaPlayerProps) {

  if (!mediaItem) {
    return (
      <div className="w-full bg-gray-900 rounded-lg p-8 flex items-center justify-center min-h-[400px]">
        <p className="text-gray-400">Selecione um item para reproduzir</p>
      </div>
    );
  }

  // Extrair playlistId da URL (pode ser playlist ou vídeo individual)
  let playlistId: string | null = null;
  let videoId: string | null = null;
  
  // Tentar extrair playlist ID
  const playlistMatch = mediaItem.media_url.match(/[?&]list=([^&]+)/);
  if (playlistMatch) {
    playlistId = playlistMatch[1];
  }
  
  // Tentar extrair video ID (se for vídeo individual)
  const videoMatch = mediaItem.media_url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
  if (videoMatch) {
    videoId = videoMatch[1];
  }
  
  // Se tiver playlistId, usar embed de playlist
  if (playlistId) {
    return (
      <div className="w-full bg-gray-900 rounded-lg overflow-hidden">
        <div className="relative aspect-video bg-black">
          <iframe
            src={`https://www.youtube.com/embed/videoseries?list=${playlistId}&autoplay=0`}
            width="100%"
            height="100%"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 w-full h-full"
          />
        </div>
        <div className="p-4">
          <h3 className="text-white font-medium">{mediaItem.title}</h3>
          <p className="text-gray-400 text-sm mt-1">Playlist completa no YouTube</p>
        </div>
      </div>
    );
  }
  
  // Se tiver apenas videoId, usar embed de vídeo individual
  if (videoId) {
    return (
      <div className="w-full bg-gray-900 rounded-lg overflow-hidden">
        <div className="relative aspect-video bg-black">
          <iframe
            src={`https://www.youtube.com/embed/${videoId}?autoplay=0`}
            width="100%"
            height="100%"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 w-full h-full"
          />
        </div>
        <div className="p-4">
          <h3 className="text-white font-medium">{mediaItem.title}</h3>
        </div>
      </div>
    );
  }
  
  // Fallback: mostrar mensagem de erro
  return (
    <div className="w-full bg-gray-900 rounded-lg p-8 flex items-center justify-center min-h-[400px]">
      <p className="text-gray-400">URL de vídeo inválida: {mediaItem.media_url}</p>
    </div>
  );
}
