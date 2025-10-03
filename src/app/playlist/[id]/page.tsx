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
  params: Promise<{
    id: string;
  }>;
}

export default async function PlaylistDetailPage({ params }: PageProps) {
  const { id: playlistId } = await params;
  
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
            <div className="flex items-center space-x-4">
              <Link 
                href="/playlists" 
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Voltar às Playlists
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <button className="flex items-center text-gray-600 hover:text-gray-900 transition-colors">
                <Share2 className="w-5 h-5 mr-2" />
                Compartilhar
              </button>
              <a 
                href={`https://www.youtube.com/playlist?list=${playlist.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ExternalLink className="w-5 h-5 mr-2" />
                Ver no YouTube
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Video Player - 2/3 width */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <MediaPlayer mediaItem={currentMediaItem} />
              
              {/* Video Info */}
              <div className="p-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  {playlist.title}
                </h1>
                <p className="text-gray-600 mb-4">
                  {playlist.description}
                </p>
                
                {/* Metadata */}
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-4">
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    {new Date(playlist.metadata.year).getFullYear()}
                  </div>
                  <div className="flex items-center">
                    <MapPin className="w-4 h-4 mr-1" />
                    {playlist.metadata.location}
                  </div>
                  <div className="flex items-center">
                    <Headphones className="w-4 h-4 mr-1" />
                    {playlist.metadata.total_talks} vídeos
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar - 1/3 width */}
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
