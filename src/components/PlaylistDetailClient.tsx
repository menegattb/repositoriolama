'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Playlist, MediaItem } from '@/types';
import MediaPlayer from '@/components/MediaPlayer';
import Sidebar from '@/components/Sidebar';
import { Share2, ArrowLeft, ExternalLink, Calendar, MapPin, Headphones } from 'lucide-react';
import Link from 'next/link';
import { youtubePlaylistService } from '@/services/youtubePlaylistService';

interface PlaylistDetailClientProps {
  playlist: Playlist;
  initialMediaItem: MediaItem | null;
}

export default function PlaylistDetailClient({ 
  playlist, 
  initialMediaItem
}: PlaylistDetailClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tabParam = searchParams.get('tab');
  const initialTab = (tabParam === 'audio' || tabParam === 'transcript') ? tabParam : 'playlist';
  
  // Inicializar currentMediaItem com initialMediaItem ou o primeiro item da playlist
  const [currentMediaItem, setCurrentMediaItem] = useState<MediaItem | null>(
    initialMediaItem || playlist.items?.[0] || null
  );
  const [playlistVideos, setPlaylistVideos] = useState<MediaItem[]>(playlist.items || []);
  const [loading, setLoading] = useState(true);
  
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
        // Vídeos reais da API têm IDs que são videoIds do YouTube (exatamente 11 caracteres base64url)
        // IDs de YouTube PODEM conter - e _ (são caracteres válidos de base64url)
        const realVideos = videos.filter(v => 
          v.media_url && 
          v.media_url.includes('youtube.com/watch') && // URLs de vídeo individual
          /^[a-zA-Z0-9_-]{11}$/.test(v.id) // Exatamente 11 chars base64url = YouTube video ID
        );
        
        console.log('[PlaylistDetailClient] ✅ Vídeos reais encontrados da API:', realVideos.length);
        console.log('[PlaylistDetailClient] 📹 Total de vídeos retornados:', videos.length);
        
        // Se encontrou vídeos reais da API do YouTube, usar eles
        if (realVideos.length > 0) {
          console.log('[PlaylistDetailClient] ✅ Usando vídeos reais da API do YouTube');
          setPlaylistVideos(realVideos);
          
          // Sempre atualizar o currentMediaItem se ele tem ID mock ou não existe nos novos dados
          const currentItemHasMockId = currentMediaItem?.id.includes('-') && /^\d+$/.test(currentMediaItem.id.split('-').pop() || '');
          const currentItemExistsInRealVideos = currentMediaItem && realVideos.find(v => v.id === currentMediaItem.id);
          
          if (!currentMediaItem || currentItemHasMockId || !currentItemExistsInRealVideos) {
            // Tentar encontrar pelo título primeiro
            let matchingVideo = currentMediaItem?.title 
              ? realVideos.find(v => v.title === currentMediaItem.title)
              : null;
            
            // Se não encontrar pelo título, usar o primeiro vídeo
            if (!matchingVideo && realVideos[0]) {
              matchingVideo = realVideos[0];
            }
            
            if (matchingVideo) {
              console.log('[PlaylistDetailClient] 🎬 Atualizando vídeo atual:', {
                oldId: currentMediaItem?.id,
                newId: matchingVideo.id,
                title: matchingVideo.title
              });
              setCurrentMediaItem(matchingVideo);
            }
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
          <button onClick={() => router.push('/playlists')} className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors font-medium">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Voltar às Playlists
          </button>
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

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-3 space-y-6">
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
                  <span>{playlistVideos.length} vídeos</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Sidebar */}
          <div className="lg:col-span-2">
            <Sidebar 
              playlist={{...playlist, items: playlistVideos}} 
              currentMediaItem={currentMediaItem} 
              onMediaItemSelect={handleMediaItemSelect}
              initialTab={initialTab}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
