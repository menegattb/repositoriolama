import Link from 'next/link';
import { StandaloneVideo } from '@/types';
import { Calendar, Clock, ExternalLink } from 'lucide-react';
import Image from 'next/image';

interface VideoCardProps {
  video: StandaloneVideo;
  index?: number;
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

export default function VideoCard({ video }: VideoCardProps) {
  const thumbnailUrl = video.thumbnail || `https://img.youtube.com/vi/${video.id}/maxresdefault.jpg`;
  const publishedDate = new Date(video.publishedAt);
  const year = publishedDate.getFullYear().toString();

  return (
    <div className="bg-primary-white rounded-lg shadow-base overflow-hidden hover:shadow-lg transition-shadow duration-300">
      {/* Thumbnail */}
      <div className="relative">
        <div className="w-full h-48 relative bg-gray-200">
          <Image
            src={thumbnailUrl}
            alt={video.title}
            fill
            className="object-cover"
            unoptimized
            onError={(e) => {
              // Fallback para thumbnail padrão se falhar
              const target = e.target as HTMLImageElement;
              target.src = `https://img.youtube.com/vi/${video.id}/hqdefault.jpg`;
            }}
          />
        </div>

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
          {video.title}
        </h3>
        
        {/* Metadata */}
        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 mb-3">
          <div className="flex items-center">
            <Calendar className="w-4 h-4 mr-1" />
            {year}
          </div>
          {video.duration > 0 && (
            <div className="flex items-center">
              <Clock className="w-4 h-4 mr-1" />
              {formatDuration(video.duration)}
            </div>
          )}
        </div>

        {/* Description */}
        {video.description && (
          <p className="text-sm text-gray-600 mb-4 line-clamp-2">
            {video.description}
          </p>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Link 
            href={`/video/${video.id}`}
            className="flex-1 bg-white border border-gray-400 text-gray-800 px-4 py-2 rounded-lg text-center text-sm font-medium hover:bg-gray-100 transition-colors"
          >
            Ver Vídeo
          </Link>
          <a
            href={`https://www.youtube.com/watch?v=${video.id}`}
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

