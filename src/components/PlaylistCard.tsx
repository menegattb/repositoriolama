import Link from 'next/link';
import { Playlist } from '@/types';
import { Star, MapPin, Headphones, ExternalLink, Calendar } from 'lucide-react';
import LazyYouTubeThumbnail from './LazyYouTubeThumbnail';

interface PlaylistCardProps {
  playlist: Playlist;
  index?: number; // Índice do item na lista
}

export default function PlaylistCard({ playlist, index = 0 }: PlaylistCardProps) {

  return (
    <div className="bg-primary-white rounded-lg shadow-base overflow-hidden hover:shadow-lg transition-shadow duration-300">
      {/* Thumbnail */}
      <div className="relative">
        <div className="w-full h-48 relative">
          <LazyYouTubeThumbnail
            playlistId={playlist.id}
            title={playlist.title}
            theme={playlist.items[0]?.theme || 'Ensinamentos Gerais'}
            className="w-full h-full"
            index={index}
          />
        </div>
        
              {playlist.featured && (
                <div className="absolute top-3 left-3">
                  <div className="flex items-center space-x-1 bg-accent-gold text-white px-2 py-1 rounded-full text-xs font-medium">
                    <Star className="w-3 h-3" />
                    <span>Destaque</span>
                  </div>
                </div>
              )}

              {/* YouTube Badge */}
              <div className="absolute top-3 right-3">
                <div className="bg-accent-red text-white px-2 py-1 rounded text-xs font-medium">
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
            <Headphones className="w-4 h-4 mr-1" />
            {playlist.items?.length || playlist.metadata.total_talks} vídeos
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
            className="flex-1 bg-white border border-gray-400 text-gray-800 px-4 py-2 rounded-lg text-center text-sm font-medium hover:bg-gray-100 transition-colors"
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
