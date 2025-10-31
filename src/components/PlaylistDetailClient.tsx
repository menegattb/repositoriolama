'use client';

import { useState, useEffect } from 'react';
import { Playlist, MediaItem, Transcript } from '@/types';
import MediaPlayer from '@/components/MediaPlayer';
import Sidebar from '@/components/Sidebar';
import { Share2, ArrowLeft, ExternalLink, Calendar, MapPin, Headphones } from 'lucide-react';
import Link from 'next/link';
import { youtubePlaylistService } from '@/services/youtubePlaylistService';

interface PlaylistDetailClientProps {
  playlist: Playlist;
  initialMediaItem: MediaItem | null;
  transcript: Transcript | null;
}

export default function PlaylistDetailClient({ 
  playlist, 
  initialMediaItem, 
  transcript 
}: PlaylistDetailClientProps) {
  const [currentMediaItem, setCurrentMediaItem] = useState<MediaItem | null>(initialMediaItem);
  const [playlistVideos, setPlaylistVideos] = useState<MediaItem[]>(playlist.items || []);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlaylistVideos = async () => {
      try {
        setLoading(true);
        const videos = await youtubePlaylistService.getPlaylistVideos(playlist.id);
        
        // Se retornou vídeos válidos (com URLs de vídeo, não playlist)
        const validVideos = videos.filter(v => 
          v.media_url && 
          (v.media_url.includes('youtube.com/watch') || v.media_url.includes('youtu.be/'))
        );
        
        if (validVideos.length > 0) {
          setPlaylistVideos(validVideos);
          // Se não há item atual ou o item atual não existe nos novos dados, usar o primeiro
          if (!currentMediaItem || !validVideos.find(v => v.id === currentMediaItem.id)) {
            setCurrentMediaItem(validVideos[0] || null);
          }
        } else {
          // Se não há vídeos válidos, manter os itens da playlist mas não tentar buscar mais
          console.log('[PlaylistDetailClient] Usando itens da playlist (sem API key do YouTube)');
          setPlaylistVideos(playlist.items || []);
        }
      } catch (error) {
        console.error('Error fetching playlist videos:', error);
        // Em caso de erro, usar os itens da playlist original
        setPlaylistVideos(playlist.items || []);
      } finally {
        setLoading(false);
      }
    };

    fetchPlaylistVideos();
  }, [playlist.id]);

  const handleMediaItemSelect = (item: MediaItem) => {
    console.log('Selected item:', item.title);
    setCurrentMediaItem(item);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: playlist.title,
        text: playlist.description,
        url: window.location.href,
      }).catch((error) => console.error('Error sharing:', error));
    } else {
      alert('Compartilhamento não suportado neste navegador.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back to Playlists */}
        <div className="mb-6 flex justify-between items-center">
          <Link href="/playlists" className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors font-medium">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Voltar às Playlists
          </Link>
          <div className="flex space-x-4">
            <button 
              onClick={handleShare}
              className="inline-flex items-center text-gray-600 hover:text-blue-600 transition-colors font-medium"
            >
              <Share2 className="w-5 h-5 mr-2" />
              Compartilhar
            </button>
            <a
              href={`https://www.youtube.com/playlist?list=${playlist.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-gray-600 hover:text-blue-600 transition-colors font-medium"
            >
              <ExternalLink className="w-5 h-5 mr-2" />
              Ver no YouTube
            </a>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Media Player */}
            {loading ? (
              <div className="w-full bg-gray-900 rounded-lg p-8 flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                  <p className="text-gray-400">Carregando vídeos...</p>
                </div>
              </div>
            ) : (
              <MediaPlayer 
                mediaItem={currentMediaItem} 
                key={currentMediaItem?.id}
              />
            )}

            {/* Series Information */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                {playlist.title}
              </h2>
              <p className="text-gray-700 mb-4">
                {playlist.description || `Série de ${playlist.metadata.total_talks} vídeos sobre ensinamentos budistas.`}
              </p>
              <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                <div className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4" />
                  <span>{playlist.metadata.year}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <MapPin className="w-4 h-4" />
                  <span>{playlist.metadata.location}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Headphones className="w-4 h-4" />
                  <span>{playlist.metadata.total_talks} vídeos</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Sidebar */}
          <div className="lg:col-span-1">
            <Sidebar 
              playlist={{...playlist, items: playlistVideos}} 
              currentMediaItem={currentMediaItem} 
              transcript={transcript}
              onMediaItemSelect={handleMediaItemSelect}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
