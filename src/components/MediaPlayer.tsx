'use client';

import { useState, useRef, useEffect } from 'react';
import ReactPlayer from 'react-player';
import { Play, Pause, Volume2, VolumeX, Maximize, ExternalLink } from 'lucide-react';
import { MediaItem } from '@/types';

interface MediaPlayerProps {
  mediaItem: MediaItem | null;
  onTimeUpdate?: (time: number) => void;
}

export default function MediaPlayer({ mediaItem, onTimeUpdate }: MediaPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isYouTube, setIsYouTube] = useState(false);
  const playerRef = useRef<ReactPlayer | null>(null);

  useEffect(() => {
    if (mediaItem) {
      setIsYouTube(mediaItem.media_url.includes('youtube.com') || mediaItem.media_url.includes('youtu.be'));
    }
  }, [mediaItem]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const handleMute = () => {
    setIsMuted(!isMuted);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    if (playerRef.current) {
      playerRef.current.seekTo(newTime);
    }
  };

  const handleProgress = (state: { playedSeconds: number }) => {
    setCurrentTime(state.playedSeconds);
    if (onTimeUpdate) {
      onTimeUpdate(state.playedSeconds);
    }
  };

  const handleDuration = (duration: number) => {
    setDuration(duration);
  };

  if (!mediaItem) {
    return (
      <div className="bg-gray-100 rounded-lg p-8 text-center">
        <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center mx-auto mb-4">
          <Play className="w-8 h-8 text-gray-500" />
        </div>
        <p className="text-gray-500">Selecione uma faixa para reproduzir</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Player */}
      <div className="relative">
        <ReactPlayer
          ref={playerRef}
          url={mediaItem.media_url}
          playing={isPlaying}
          volume={isMuted ? 0 : volume}
          onProgress={handleProgress}
          onDuration={handleDuration}
          width="100%"
          height="300px"
          config={{
            youtube: {
              playerVars: {
                showinfo: 0,
                rel: 0,
                modestbranding: 1,
              },
            },
            file: {
              attributes: {
                controls: false,
              },
            },
          }}
        />
        
        {/* Custom Controls Overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
          <div className="flex items-center space-x-4">
            {/* Play/Pause Button */}
            <button
              onClick={handlePlayPause}
              className="bg-white/20 hover:bg-white/30 rounded-full p-2 transition-colors"
            >
              {isPlaying ? (
                <Pause className="w-6 h-6 text-white" />
              ) : (
                <Play className="w-6 h-6 text-white" />
              )}
            </button>

            {/* Progress Bar */}
            <div className="flex-1">
              <input
                type="range"
                min="0"
                max={duration}
                value={currentTime}
                onChange={handleSeek}
                className="w-full h-2 bg-white/30 rounded-lg appearance-none cursor-pointer slider"
                style={{
                  background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${(currentTime / duration) * 100}%, rgba(255,255,255,0.3) ${(currentTime / duration) * 100}%, rgba(255,255,255,0.3) 100%)`
                }}
              />
            </div>

            {/* Time Display */}
            <span className="text-white text-sm font-mono">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>

            {/* Volume Controls */}
            <div className="flex items-center space-x-2">
              <button
                onClick={handleMute}
                className="bg-white/20 hover:bg-white/30 rounded-full p-2 transition-colors"
              >
                {isMuted ? (
                  <VolumeX className="w-5 h-5 text-white" />
                ) : (
                  <Volume2 className="w-5 h-5 text-white" />
                )}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-20 h-2 bg-white/30 rounded-lg appearance-none cursor-pointer slider"
              />
            </div>

            {/* Fullscreen Button */}
            <button className="bg-white/20 hover:bg-white/30 rounded-full p-2 transition-colors">
              <Maximize className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* YouTube Badge */}
        {isYouTube && (
          <div className="absolute top-3 right-3">
            <div className="bg-red-600 text-white px-2 py-1 rounded text-xs font-medium">
              YouTube
            </div>
          </div>
        )}
      </div>

      {/* Media Info */}
      <div className="p-6">
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-xl font-bold text-gray-900">
            {mediaItem.track_title}
          </h3>
          {isYouTube && (
            <a
              href={mediaItem.media_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-1 text-red-600 hover:text-red-800 text-sm"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Abrir no YouTube</span>
            </a>
          )}
        </div>
        
        <p className="text-gray-600 text-sm mb-2">
          {mediaItem.series_title}
        </p>
        
        <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
          <span>{mediaItem.event_type}</span>
          <span>•</span>
          <span>{mediaItem.location}</span>
          <span>•</span>
          <span>{new Date(mediaItem.date).toLocaleDateString('pt-BR')}</span>
        </div>
        
        <p className="text-gray-700 text-sm">
          {mediaItem.description}
        </p>
      </div>
    </div>
  );
}
