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

  // const isYouTube = mediaItem.media_url.includes('youtube.com') || mediaItem.media_url.includes('youtu.be');

  return (
    <div className="w-full bg-gray-900 rounded-lg overflow-hidden">
      {/* Player Container */}
      <div className="relative aspect-video bg-black">
        <ReactPlayer
          src={mediaItem.media_url}
          width="100%"
          height="100%"
          controls={true}
        />
      </div>

      {/* Title */}
      <div className="p-4">
        <h3 className="text-white font-medium">{mediaItem.title}</h3>
      </div>
    </div>
  );
}
