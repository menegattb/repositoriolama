import Link from 'next/link';
import { Playlist } from '@/types';
import { Star, Clock, MapPin, Headphones, ExternalLink, Calendar } from 'lucide-react';
import LazyYouTubeThumbnail from './LazyYouTubeThumbnail';

interface PlaylistCardProps {
  playlist: Playlist;
  index?: number; // Índice do item na lista
}

export default function PlaylistCard({ playlist, index = 0 }: PlaylistCardProps) {
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  const totalDuration = playlist.items.reduce((acc, item) => acc + item.duration, 0);
  
  // Extrair o ID do vídeo da URL do primeiro item
  const getFirstVideoId = (playlist: Playlist) => {
    const firstItem = playlist.items[0];
    if (!firstItem) return null;
    
    // Se a URL é uma playlist, vamos gerar um ID determinístico baseado no ID da playlist
    if (firstItem.media_url.includes('playlist?list=')) {
      const playlistId = playlist.id;
      let hash = 0;
      for (let i = 0; i < playlistId.length; i++) {
        const char = playlistId.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
      }
      
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
      let result = '';
      let num = Math.abs(hash);
      
      for (let i = 0; i < 11; i++) {
        result += chars[num % chars.length];
        num = Math.floor(num / chars.length);
      }
      
      return result;
    }
    
    // Se é uma URL de vídeo, extrair o ID
    const videoIdMatch = firstItem.media_url.match(/[?&]v=([^&]+)/);
    return videoIdMatch ? videoIdMatch[1] : null;
  };

  const firstVideoId = getFirstVideoId(playlist);

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
      {/* Thumbnail */}
      <div className="relative">
        <div className="w-full h-48 relative">
          <LazyYouTubeThumbnail
            playlistId={playlist.id}
            videoId={firstVideoId}
            title={playlist.title}
            theme={playlist.items[0]?.theme || 'Ensinamentos Gerais'}
            className="w-full h-full"
            index={index}
          />
        </div>
        
        {playlist.featured && (
          <div className="absolute top-3 left-3">
            <div className="flex items-center space-x-1 bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-medium">
              <Star className="w-3 h-3" />
              <span>Destaque</span>
            </div>
          </div>
        )}

        {/* YouTube Badge */}
        <div className="absolute top-3 right-3">
          <div className="bg-red-600 text-white px-2 py-1 rounded text-xs font-medium">
            YouTube
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
          {playlist.title}
        </h3>
        
        {/* Metadata */}
        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 mb-3">
          <div className="flex items-center">
            <Calendar className="w-4 h-4 mr-1" />
            {playlist.metadata.year}
          </div>
          <div className="flex items-center">
            <MapPin className="w-4 h-4 mr-1" />
            {playlist.metadata.location}
          </div>
          <div className="flex items-center">
            <Clock className="w-4 h-4 mr-1" />
            {formatDuration(totalDuration)}
          </div>
          <div className="flex items-center">
            <Headphones className="w-4 h-4 mr-1" />
            {playlist.metadata.total_talks} vídeos
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
          {playlist.description}
        </p>

        {/* Actions */}
        <div className="flex gap-2">
          <Link 
            href={`/playlist/${playlist.id}`}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg text-center text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Ver Playlist
          </Link>
          <a
            href={`https://www.youtube.com/playlist?list=${playlist.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center px-3 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-300 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  );
}
