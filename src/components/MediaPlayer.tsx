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

  // Log para debug
  console.log('[MediaPlayer] 🎬 Recebido mediaItem:', {
    id: mediaItem.id,
    title: mediaItem.title,
    media_url: mediaItem.media_url
  });

  // Extrair playlistId da URL (pode ser playlist ou vídeo individual)
  let playlistId: string | null = null;
  let videoId: string | null = null;
  
  // Tentar extrair playlist ID de diferentes formatos
  // Formato 1: https://www.youtube.com/playlist?list=PLAYLIST_ID
  // Formato 2: https://youtube.com/playlist?list=PLAYLIST_ID
  // Formato 3: ...&list=PLAYLIST_ID (em URLs de vídeo com playlist)
  const playlistMatch = mediaItem.media_url.match(/[?&]list=([^&]+)/);
  if (playlistMatch && playlistMatch[1]) {
    playlistId = playlistMatch[1];
    console.log('[MediaPlayer] ✅ Playlist ID extraído:', playlistId);
  }
  
  // Tentar extrair video ID (se for vídeo individual)
  const videoMatch = mediaItem.media_url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
  if (videoMatch && videoMatch[1]) {
    videoId = videoMatch[1];
    console.log('[MediaPlayer] ✅ Video ID extraído:', videoId);
  }
  
  // Se tiver playlistId, usar embed de playlist
  if (playlistId) {
    const embedUrl = `https://www.youtube.com/embed/videoseries?list=${playlistId}&autoplay=0`;
    console.log('[MediaPlayer] 🎬 Usando embed de playlist:', embedUrl);
    
    return (
      <div className="w-full bg-gray-900 rounded-lg overflow-hidden">
        <div className="relative aspect-video bg-black">
          <iframe
            src={embedUrl}
            width="100%"
            height="100%"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 w-full h-full"
            title={mediaItem.title}
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
    const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=0`;
    console.log('[MediaPlayer] 🎬 Usando embed de vídeo:', embedUrl);
    
    return (
      <div className="w-full bg-gray-900 rounded-lg overflow-hidden">
        <div className="relative aspect-video bg-black">
          <iframe
            src={embedUrl}
            width="100%"
            height="100%"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 w-full h-full"
            title={mediaItem.title}
          />
        </div>
        <div className="p-4">
          <h3 className="text-white font-medium">{mediaItem.title}</h3>
        </div>
      </div>
    );
  }
  
  // Fallback: mostrar mensagem de erro com detalhes
  console.error('[MediaPlayer] ❌ URL não reconhecida:', mediaItem.media_url);
  return (
    <div className="w-full bg-gray-900 rounded-lg p-8 flex flex-col items-center justify-center min-h-[400px]">
      <p className="text-red-400 mb-2">❌ Vídeo indisponível</p>
      <p className="text-gray-400 text-sm text-center">
        URL: {mediaItem.media_url || '(vazia)'}
      </p>
      <p className="text-gray-500 text-xs mt-2">
        Título: {mediaItem.title}
      </p>
    </div>
  );
}
