import Link from 'next/link';
import { Playlist } from '@/types';
import { Star, Clock, MapPin, Headphones, ExternalLink, Calendar } from 'lucide-react';

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

  // Extrair ID do YouTube da URL da thumbnail
  const youtubeId = playlist.thumbnail_url.includes('youtube.com') 
    ? playlist.thumbnail_url.split('/').pop()?.split('?')[0]
    : playlist.id.slice(-11);

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
      {/* Thumbnail */}
      <div className="relative">
        {playlist.thumbnail_url.includes('youtube.com') ? (
          <img 
            src={playlist.thumbnail_url} 
            alt={playlist.title}
            className="w-full h-48 object-cover"
            onError={(e) => {
              // Fallback para ícone se a imagem falhar
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              target.parentElement!.innerHTML = `
                <div class="w-full h-48 bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                  <svg class="w-16 h-16 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                </div>
              `;
            }}
          />
        ) : (
          <div className="w-full h-48 bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
            <Headphones className="w-16 h-16 text-blue-600" />
          </div>
        )}
        
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

      <div className="p-6">
        {/* Title */}
        <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">
          {playlist.title}
        </h3>

        {/* Metadata */}
        <div className="space-y-2 mb-3">
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <div className="flex items-center space-x-1">
              <Calendar className="w-4 h-4" />
              <span>{playlist.metadata.year}</span>
            </div>
            <div className="flex items-center space-x-1">
              <MapPin className="w-4 h-4" />
              <span>{playlist.metadata.location}</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <div className="flex items-center space-x-1">
              <Clock className="w-4 h-4" />
              <span>{formatDuration(totalDuration)}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Headphones className="w-4 h-4" />
              <span>{playlist.metadata.total_talks} vídeos</span>
            </div>
          </div>
        </div>

        {/* Description */}
        <p className="text-gray-700 text-sm mb-4 line-clamp-3">
          {playlist.description || `Série de ${playlist.metadata.total_talks} vídeos sobre ensinamentos budistas do CEBB.`}
        </p>

        {/* Action buttons */}
        <div className="space-y-2">
          <Link 
            href={`/playlist/${playlist.id}`}
            className="inline-flex items-center justify-center w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Ver Playlist
          </Link>
          
          <a
            href={`https://www.youtube.com/playlist?list=${playlist.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors font-medium"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Abrir no YouTube
          </a>
        </div>
      </div>
    </div>
  );
}
