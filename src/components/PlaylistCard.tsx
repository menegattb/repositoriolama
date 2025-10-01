import Link from 'next/link';
import { Playlist } from '@/types';
import { Star, Clock, MapPin, Headphones } from 'lucide-react';

interface PlaylistCardProps {
  playlist: Playlist;
}

export default function PlaylistCard({ playlist }: PlaylistCardProps) {
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  const totalDuration = playlist.items.reduce((acc, item) => acc + item.duration, 0);

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
      {/* Thumbnail */}
      <div className="relative">
        <div className="w-full h-48 bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
          <Headphones className="w-16 h-16 text-blue-600" />
        </div>
        {playlist.featured && (
          <div className="absolute top-3 left-3">
            <div className="flex items-center space-x-1 bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-medium">
              <Star className="w-3 h-3" />
              <span>Destaque</span>
            </div>
          </div>
        )}
      </div>

      <div className="p-6">
        {/* Title */}
        <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">
          {playlist.title}
        </h3>

        {/* Metadata */}
        <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
          <div className="flex items-center space-x-1">
            <Clock className="w-4 h-4" />
            <span>{formatDuration(totalDuration)}</span>
          </div>
          <div className="flex items-center space-x-1">
            <MapPin className="w-4 h-4" />
            <span>{playlist.metadata.location}</span>
          </div>
        </div>

        {/* Metadata summary */}
        <div className="text-sm text-gray-600 mb-4">
          {playlist.metadata.total_talks} talks, {playlist.metadata.year}, {playlist.metadata.location}, {playlist.metadata.format}
        </div>

        {/* Description */}
        <p className="text-gray-700 text-sm mb-4 line-clamp-3">
          {playlist.description}
        </p>

        {/* Action button */}
        <Link 
          href={`/playlist/${playlist.id}`}
          className="inline-flex items-center justify-center w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          Ver Playlist
        </Link>
      </div>
    </div>
  );
}
