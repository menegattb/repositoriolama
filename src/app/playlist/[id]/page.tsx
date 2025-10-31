import { getYouTubePlaylists } from '@/data/youtubeData';
import { mockTranscripts } from '@/data/mockData';
import PlaylistDetailClient from '@/components/PlaylistDetailClient';
import { notFound } from 'next/navigation';

// Tornar a página dinâmica (renderizada sob demanda)
export const dynamic = 'force-dynamic';
export const dynamicParams = true; // Permitir parâmetros dinâmicos
export const revalidate = 0; // Sempre buscar dados atualizados

// Não gerar páginas estáticas - todas serão dinâmicas
export async function generateStaticParams() {
  // Retornar array vazio para forçar geração dinâmica
  return [];
}

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function PlaylistDetailPage({ params }: PageProps) {
  const { id: playlistId } = await params;
  
  console.log('[PlaylistDetailPage] Buscando playlist:', playlistId);
  
  try {
    const youtubePlaylists = await getYouTubePlaylists();
    console.log('[PlaylistDetailPage] Total de playlists carregadas:', youtubePlaylists.length);
    
    const playlist = youtubePlaylists.find(p => p.id === playlistId);
    
    if (!playlist) {
      console.warn('[PlaylistDetailPage] Playlist não encontrada:', playlistId);
      notFound();
    }
    
    console.log('[PlaylistDetailPage] Playlist encontrada:', playlist.title);

    const currentMediaItem = playlist.items?.[0] || null;
    const transcript = currentMediaItem ? mockTranscripts.find(t => t.media_item_id === currentMediaItem.id) || null : null;

    return (
      <PlaylistDetailClient 
        playlist={playlist}
        initialMediaItem={currentMediaItem}
        transcript={transcript}
      />
    );
  } catch (error) {
    console.error('[PlaylistDetailPage] Erro ao carregar playlist:', error);
    notFound();
  }
}