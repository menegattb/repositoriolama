'use client';

import { useState } from 'react';
import ReactPlayer from 'react-player';
import { Play, Pause, Volume2, VolumeX, ExternalLink } from 'lucide-react';
import { MediaItem } from '@/types';

interface MediaPlayerProps {
  mediaItem: MediaItem | null;
}

export default function MediaPlayer({ mediaItem }: MediaPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  if (!mediaItem) {
    return (
      <div className="w-full bg-gray-900 rounded-lg p-8 flex items-center justify-center min-h-[400px]">
        <p className="text-gray-400">Selecione um item para reproduzir</p>
      </div>
    );
  }

  const isYouTube = mediaItem.media_url.includes('youtube.com') || mediaItem.media_url.includes('youtu.be');

  return (
    <div className="w-full bg-gray-900 rounded-lg overflow-hidden">
      {/* Player Container */}
      <div className="relative aspect-video bg-black">
        <ReactPlayer
          src={mediaItem.media_url}
          playing={isPlaying}
          volume={isMuted ? 0 : 0.8}
          width="100%"
          height="100%"
        />
        
        {/* YouTube Badge Overlay */}
        {isYouTube && (
          <div className="absolute top-4 right-4 bg-red-600 text-white px-3 py-1 rounded-md text-sm font-medium flex items-center gap-2">
            <ExternalLink size={14} />
            YouTube
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="p-4 space-y-4">
        {/* Title */}
        <div>
          <h3 className="text-white font-medium">{mediaItem.title}</h3>
        </div>

        {/* Control Buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Play/Pause Button */}
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="w-10 h-10 flex items-center justify-center bg-blue-600 hover:bg-blue-700 rounded-full text-white transition-colors"
            >
              {isPlaying ? <Pause size={20} fill="white" /> : <Play size={20} fill="white" />}
            </button>

            {/* Volume Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsMuted(!isMuted)}
                className="text-gray-300 hover:text-white transition-colors"
              >
                {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Open in YouTube Button */}
            {isYouTube && (
              <button
                onClick={() => window.open(mediaItem.media_url, '_blank')}
                className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm flex items-center gap-2 transition-colors"
              >
                <ExternalLink size={16} />
                Abrir no YouTube
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
