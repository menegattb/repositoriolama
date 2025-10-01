'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { youtubePlaylists } from '@/data/youtubeData';
import { mockTranscripts } from '@/data/mockData';
import { Playlist, MediaItem, Transcript } from '@/types';
import MediaPlayer from '@/components/MediaPlayer';
import Sidebar from '@/components/Sidebar';
import { Share2, ArrowLeft, ExternalLink, Calendar, MapPin, Headphones } from 'lucide-react';
import Link from 'next/link';

export default function PlaylistDetailPage() {
  const params = useParams();
  const playlistId = params.id as string;
  
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [currentMediaItem, setCurrentMediaItem] = useState<MediaItem | null>(null);
  const [transcript, setTranscript] = useState<Transcript | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simular carregamento de dados
    const timer = setTimeout(() => {
      const foundPlaylist = youtubePlaylists.find(p => p.id === playlistId);
      if (foundPlaylist) {
        setPlaylist(foundPlaylist);
        // Selecionar o primeiro item por padrão
        if (foundPlaylist.items.length > 0) {
          setCurrentMediaItem(foundPlaylist.items[0]);
          // Buscar transcrição correspondente
          const foundTranscript = mockTranscripts.find(t => t.media_item_id === foundPlaylist.items[0].id);
          setTranscript(foundTranscript || null);
        }
      }
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, [playlistId]);

  const handleMediaItemSelect = (item: MediaItem) => {
    setCurrentMediaItem(item);
    // Buscar transcrição correspondente
    const foundTranscript = mockTranscripts.find(t => t.media_item_id === item.id);
    setTranscript(foundTranscript || null);
  };

  const handleTimeUpdate = (time: number) => {
    // Esta função pode ser usada para sincronizar a transcrição com o player
    console.log('Current time:', time);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: playlist?.title,
        text: playlist?.description,
        url: window.location.href,
      });
    } else {
      // Fallback para copiar URL
      navigator.clipboard.writeText(window.location.href);
      alert('Link copiado para a área de transferência!');
    }
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando playlist...</p>
        </div>
      </div>
    );
  }

  if (!playlist) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Playlist não encontrada</h1>
          <Link 
            href="/playlists"
            className="inline-flex items-center text-blue-600 hover:text-blue-800"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para Playlists
          </Link>
        </div>
      </div>
    );
  }

  const totalDuration = playlist.items.reduce((acc, item) => acc + item.duration, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/playlists"
            className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para Playlists
          </Link>
          
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
                  {playlist.title}
                </h1>
                <div className="bg-red-600 text-white px-2 py-1 rounded text-sm font-medium">
                  YouTube
                </div>
              </div>
              
              <p className="text-lg text-gray-600 max-w-3xl mb-4">
                {playlist.description || `Série de ${playlist.metadata.total_talks} vídeos sobre ensinamentos budistas do CEBB.`}
              </p>

              {/* Playlist Stats */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-4">
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
                <div className="flex items-center space-x-1">
                  <span>Duração total: {formatDuration(totalDuration)}</span>
                </div>
              </div>
            </div>
            
            <div className="flex space-x-3">
              <a
                href={`https://www.youtube.com/playlist?list=${playlist.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Abrir no YouTube</span>
              </a>
              
              <button
                onClick={handleShare}
                className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Share2 className="w-4 h-4" />
                <span>Compartilhar</span>
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Media Player */}
            <MediaPlayer 
              mediaItem={currentMediaItem} 
              onTimeUpdate={handleTimeUpdate}
            />

            {/* Series Information */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Informações da Série
              </h2>
              <div className="prose prose-gray max-w-none">
                <p className="text-gray-700 leading-relaxed mb-4">
                  {playlist.description || `Esta é uma série de ${playlist.metadata.total_talks} vídeos sobre ensinamentos budistas do CEBB (Centro de Estudos Budistas Bodisatva).`}
                </p>
                
                <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
                  <h3 className="font-semibold text-blue-900 mb-2">Sobre o CEBB</h3>
                  <p className="text-blue-800 text-sm">
                    O Centro de Estudos Budistas Bodisatva (CEBB) é uma organização dedicada ao estudo e prática do budismo tibetano, 
                    oferecendo ensinamentos, retiros e cursos para a comunidade brasileira.
                  </p>
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
              onMediaItemSelect={handleMediaItemSelect}
              onTimeUpdate={handleTimeUpdate}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
