'use client';

import ReactPlayer from 'react-player';
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

  // Verificar se é uma URL de playlist (não vídeo individual)
  const isPlaylistUrl = mediaItem.media_url.includes('playlist?list=');
  
  // Se for playlist, usar embed da playlist do YouTube
  if (isPlaylistUrl) {
    const playlistId = mediaItem.media_url.match(/list=([^&]+)/)?.[1];
    
    if (playlistId) {
      return (
        <div className="w-full bg-gray-900 rounded-lg overflow-hidden">
          {/* Player Container - Playlist Embed */}
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

          {/* Title */}
          <div className="p-4">
            <h3 className="text-white font-medium">{mediaItem.title}</h3>
            <p className="text-gray-400 text-sm mt-1">Playlist completa no YouTube</p>
          </div>
        </div>
      );
    }
  }

  // Para vídeos individuais, usar ReactPlayer
  return (
    <div className="w-full bg-gray-900 rounded-lg overflow-hidden">
      {/* Player Container */}
      <div className="relative aspect-video bg-black">
        <ReactPlayer
          url={mediaItem.media_url}
          width="100%"
          height="100%"
          controls={true}
          config={{
            youtube: {
              playerVars: {
                autoplay: 0,
              },
            },
          }}
        />
      </div>

      {/* Title */}
      <div className="p-4">
        <h3 className="text-white font-medium">{mediaItem.title}</h3>
      </div>
    </div>
  );
}
