import { getYouTubePlaylists } from '@/data/youtubeData';
import { mockTranscripts } from '@/data/mockData';
import PlaylistDetailClient from '@/components/PlaylistDetailClient';
import { notFound } from 'next/navigation';

// Tornar a página dinâmica (renderizada sob demanda)
export const dynamic = 'force-dynamic';
export const revalidate = 0; // Sempre buscar dados atualizados

// Função opcional para gerar algumas páginas estáticas (se os dados estiverem disponíveis no build)
export async function generateStaticParams() {
  try {
    const youtubePlaylists = await getYouTubePlaylists();
    if (youtubePlaylists.length > 0) {
      // Gerar apenas as primeiras 50 para não sobrecarregar o build
      return youtubePlaylists.slice(0, 50).map((playlist) => ({
        id: playlist.id,
      }));
    }
    // Se não conseguir buscar dados no build, retornar array vazio
    // As páginas serão geradas dinamicamente quando acessadas
    return [];
  } catch (error) {
    console.error('[generateStaticParams] Erro ao buscar playlists:', error);
    // Retornar array vazio - páginas serão geradas dinamicamente
    return [];
  }
}

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function PlaylistDetailPage({ params }: PageProps) {
  const { id: playlistId } = await params;
  
  const youtubePlaylists = await getYouTubePlaylists();
  const playlist = youtubePlaylists.find(p => p.id === playlistId);
  
  if (!playlist) {
    notFound();
  }

  const currentMediaItem = playlist.items?.[0] || null;
  const transcript = currentMediaItem ? mockTranscripts.find(t => t.media_item_id === currentMediaItem.id) || null : null;

  return (
    <PlaylistDetailClient 
      playlist={playlist}
      initialMediaItem={currentMediaItem}
      transcript={transcript}
    />
  );
}