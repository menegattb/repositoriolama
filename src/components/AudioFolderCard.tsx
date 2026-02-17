import Link from 'next/link';
import { Music, FolderOpen, Headphones } from 'lucide-react';

interface AudioFolderCardProps {
  id: string;
  name: string;
  audioCount?: number;
  source: 'youtube' | 'sanga';
  href: string;
  index?: number;
}

export default function AudioFolderCard({ name, audioCount, source, href }: AudioFolderCardProps) {
  const isSanga = source === 'sanga';

  return (
    <div className="bg-primary-white rounded-lg shadow-base overflow-hidden hover:shadow-lg transition-shadow duration-300">
      {/* Placeholder Image */}
      <div className="relative">
        <div className="w-full h-48 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
          <Music className="w-16 h-16 text-blue-200" />
        </div>

        {/* Source Badge */}
        <div className="absolute top-3 right-3">
          <div className={`px-2 py-1 rounded text-xs font-medium ${
            isSanga
              ? 'bg-emerald-500 text-white'
              : 'bg-red-500 text-white'
          }`}>
            {isSanga ? 'Sanga' : 'YouTube'}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
          {name}
        </h3>

        {/* Metadata */}
        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 mb-3">
          <div className="flex items-center">
            <FolderOpen className="w-4 h-4 mr-1" />
            Pasta de áudios
          </div>
          {audioCount !== undefined && (
            <div className="flex items-center">
              <Headphones className="w-4 h-4 mr-1" />
              {audioCount} {audioCount === 1 ? 'áudio' : 'áudios'}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Link
            href={href}
            className="flex-1 bg-white border border-gray-400 text-gray-800 px-4 py-2 rounded-lg text-center text-sm font-medium hover:bg-gray-100 transition-colors"
          >
            Ver Áudios
          </Link>
        </div>
      </div>
    </div>
  );
}
