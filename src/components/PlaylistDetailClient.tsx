'use client';

import { useState, useEffect } from 'react';
import { Playlist, MediaItem, Transcript } from '@/types';
import MediaPlayer from '@/components/MediaPlayer';
import Sidebar from '@/components/Sidebar';
import AudioPlayerBottomBar from '@/components/AudioPlayerBottomBar';
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
  // Inicializar currentMediaItem com initialMediaItem ou o primeiro item da playlist
  const [currentMediaItem, setCurrentMediaItem] = useState<MediaItem | null>(
    initialMediaItem || playlist.items?.[0] || null
  );
  const [playlistVideos, setPlaylistVideos] = useState<MediaItem[]>(playlist.items || []);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'playlist' | 'transcript' | 'audio'>('playlist');
  
  console.log('[PlaylistDetailClient] 🎬 Inicializado com:', {
    hasInitialMediaItem: !!initialMediaItem,
    initialMediaItemUrl: initialMediaItem?.media_url,
    playlistItemsCount: playlist.items?.length || 0,
    firstItemUrl: playlist.items?.[0]?.media_url
  });

  useEffect(() => {
    const fetchPlaylistVideos = async () => {
      try {
        setLoading(true);
        console.log('[PlaylistDetailClient] 🔍 Buscando vídeos da playlist:', playlist.id);
        console.log('[PlaylistDetailClient] 📦 Itens iniciais da playlist:', playlist.items?.length || 0);
        
        const videos = await youtubePlaylistService.getPlaylistVideos(playlist.id);
        console.log('[PlaylistDetailClient] 📹 Vídeos recebidos da API:', videos.length);
        console.log('[PlaylistDetailClient] 📹 Primeiro vídeo:', videos[0] ? {
          id: videos[0].id,
          title: videos[0].title,
          media_url: videos[0].media_url
        } : 'nenhum');
        
        // Verificar se os vídeos retornados são reais (têm videoIds válidos do YouTube, não mock)
        // Vídeos reais da API têm IDs que são videoIds do YouTube (11 caracteres, sem hífen/underscore)
        const realVideos = videos.filter(v => 
          v.media_url && 
          v.media_url.includes('youtube.com/watch') && // URLs de vídeo individual
          !v.id.includes('-') && // Não é formato playlistId-1
          !v.id.includes('_') && // Não é formato playlistId_1
          v.id.length >= 11 // VideoId do YouTube tem 11 caracteres
        );
        
        console.log('[PlaylistDetailClient] ✅ Vídeos reais encontrados da API:', realVideos.length);
        console.log('[PlaylistDetailClient] 📹 Total de vídeos retornados:', videos.length);
        
        // Se encontrou vídeos reais da API do YouTube, usar eles
        if (realVideos.length > 0) {
          console.log('[PlaylistDetailClient] ✅ Usando vídeos reais da API do YouTube');
          setPlaylistVideos(realVideos);
          // Se não há item atual ou o item atual não existe nos novos dados, usar o primeiro
          if (!currentMediaItem || !realVideos.find(v => v.id === currentMediaItem.id)) {
            console.log('[PlaylistDetailClient] 🎬 Definindo primeiro vídeo como atual:', realVideos[0].title);
            setCurrentMediaItem(realVideos[0] || null);
          }
        } else {
          // Se não encontrou vídeos reais, usar os itens da playlist original (mock ou playlist completa)
          console.log('[PlaylistDetailClient] ⚠️ Usando itens da playlist original');
          console.log('[PlaylistDetailClient] 📦 Itens da playlist:', playlist.items?.length || 0);
          setPlaylistVideos(playlist.items || []);
          
          // Garantir que o primeiro item está selecionado (se ainda não tiver um)
          if (playlist.items && playlist.items.length > 0) {
            if (!currentMediaItem || !playlist.items.find(item => item.id === currentMediaItem.id)) {
              console.log('[PlaylistDetailClient] 🎬 Definindo primeiro item da playlist como atual:', playlist.items[0].title);
              setCurrentMediaItem(playlist.items[0]);
            }
          }
        }
      } catch (error) {
        console.error('[PlaylistDetailClient] ❌ Erro ao buscar vídeos:', error);
        // Em caso de erro, usar os itens da playlist original
        setPlaylistVideos(playlist.items || []);
        
        // Garantir que o primeiro item está selecionado
        if (playlist.items && playlist.items.length > 0 && !currentMediaItem) {
          setCurrentMediaItem(playlist.items[0]);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchPlaylistVideos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playlist.id]);

  const handleMediaItemSelect = (item: MediaItem) => {
    console.log('[PlaylistDetailClient] 🎬 Selected item:', {
      title: item.title,
      format: item.format,
      media_url: item.media_url
    });
    setCurrentMediaItem(item);
    // Se for áudio, mudar para aba de áudio automaticamente
    if (item.format === 'audio') {
      console.log('[PlaylistDetailClient] 🎵 Mudando para aba de áudio');
      setActiveTab('audio');
    }
  };

  // Debug: log do currentMediaItem quando mudar
  useEffect(() => {
    console.log('[PlaylistDetailClient] 🎬 currentMediaItem atualizado:', {
      hasItem: !!currentMediaItem,
      title: currentMediaItem?.title,
      format: currentMediaItem?.format,
      media_url: currentMediaItem?.media_url
    });
  }, [currentMediaItem]);

  const handleCloseAudioPlayer = () => {
    // Ao fechar o player de áudio, mudar para um vídeo ou primeiro item
    const firstVideo = playlistVideos.find(v => v.format !== 'audio') || playlistVideos[0];
    if (firstVideo) {
      setCurrentMediaItem(firstVideo);
    }
  };

  const handleSwitchToTranscript = () => {
    // Mudar para aba de transcrição
    setActiveTab('transcript');
    // Scroll para o topo da página para ver a transcrição
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

  // Verificar se há áudio tocando para adicionar padding-bottom
  const hasAudioPlaying = currentMediaItem?.format === 'audio' || currentMediaItem?.media_url?.startsWith('/api/audio');

  return (
    <div className={`min-h-screen bg-gray-50 py-8 pt-20 ${hasAudioPlaying ? 'pb-24' : ''}`}>
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
              // Só mostrar MediaPlayer se não for áudio (áudio vai no player fixo da base)
              currentMediaItem?.format !== 'audio' ? (
                <MediaPlayer 
                  mediaItem={currentMediaItem} 
                  key={currentMediaItem?.id}
                />
              ) : (
                <div className="w-full bg-gray-900 rounded-lg p-8 flex flex-col items-center justify-center min-h-[400px]">
                  <div className="text-center">
                    <Headphones className="w-16 h-16 text-blue-600 mx-auto mb-4" />
                    <h3 className="text-xl font-medium text-white mb-2">{currentMediaItem.title}</h3>
                    <p className="text-gray-400 text-sm">O áudio está sendo reproduzido no player fixo abaixo</p>
                    <p className="text-gray-500 text-xs mt-4">Use o player na parte inferior da página para controlar a reprodução</p>
                  </div>
                </div>
              )
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
              activeTab={activeTab}
              onTabChange={setActiveTab}
            />
          </div>
        </div>
      </div>

      {/* Audio Player Bottom Bar - Fixo na base */}
      <AudioPlayerBottomBar
        currentMediaItem={currentMediaItem}
        onClose={handleCloseAudioPlayer}
        onSwitchToTranscript={handleSwitchToTranscript}
      />
    </div>
  );
}
