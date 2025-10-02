import { youtubePlaylists } from '@/data/youtubeData';
import { mockTranscripts } from '@/data/mockData';
import MediaPlayer from '@/components/MediaPlayer';
import Sidebar from '@/components/Sidebar';
import { Share2, ArrowLeft, ExternalLink, Calendar, MapPin, Headphones } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

// Função necessária para static export
export async function generateStaticParams() {
  return youtubePlaylists.map((playlist) => ({
    id: playlist.id,
  }));
}

interface PageProps {
  params: {
    id: string;
  };
}

export default function PlaylistDetailPage({ params }: PageProps) {
  const playlistId = params.id;
  
  const playlist = youtubePlaylists.find(p => p.id === playlistId);
  
  if (!playlist) {
    notFound();
  }

  const currentMediaItem = playlist.items?.[0] || null;
  const transcript = currentMediaItem ? mockTranscripts.find(t => t.media_item_id === currentMediaItem.id) || null : null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link 
                href="/playlists" 
                className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft size={20} />
                Voltar
              </Link>
              <div className="h-6 w-px bg-gray-300"></div>
              <h1 className="text-lg font-semibold text-gray-900 truncate">
                {playlist.title}
              </h1>
            </div>
            
            <button className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <Share2 size={16} />
              Compartilhar
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Media Player */}
            <MediaPlayer 
              mediaItem={currentMediaItem} 
            />

            {/* Series Information */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Sobre esta playlist</h2>
              <p className="text-gray-600 mb-4">{playlist.description}</p>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar size={16} className="text-gray-400" />
                  <span className="text-gray-600">
                    {playlist.metadata.year || 'N/A'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin size={16} className="text-gray-400" />
                  <span className="text-gray-600">
                    {playlist.metadata.location || 'N/A'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Headphones size={16} className="text-gray-400" />
                  <span className="text-gray-600">
                    {playlist.items?.length || 0} itens
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <ExternalLink size={16} className="text-gray-400" />
                  <a 
                    href={playlist.items?.[0]?.media_url || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-700"
                  >
                    Ver no YouTube
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Sidebar */}
          <div className="lg:col-span-1">
            <Sidebar 
              playlist={playlist}
              currentMediaItem={currentMediaItem}
              
              transcript={transcript}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
