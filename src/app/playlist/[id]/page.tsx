'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { mockPlaylists, mockTranscripts } from '@/data/mockData';
import { Playlist, MediaItem, Transcript } from '@/types';
import MediaPlayer from '@/components/MediaPlayer';
import Sidebar from '@/components/Sidebar';
import { Share2, ArrowLeft } from 'lucide-react';
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
      const foundPlaylist = mockPlaylists.find(p => p.id === playlistId);
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
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                {playlist.title}
              </h1>
              <p className="text-lg text-gray-600 max-w-3xl">
                {playlist.description}
              </p>
            </div>
            
            <button
              onClick={handleShare}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Share2 className="w-4 h-4" />
              <span>Compartilhar</span>
            </button>
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
                <p className="text-gray-700 leading-relaxed">
                  {playlist.description}
                </p>
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
