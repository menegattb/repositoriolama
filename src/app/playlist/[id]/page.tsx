import { youtubePlaylists } from '@/data/youtubeData';
import { mockTranscripts } from '@/data/mockData';
import PlaylistDetailClient from '@/components/PlaylistDetailClient';
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
    <PlaylistDetailClient 
      playlist={playlist}
      initialMediaItem={currentMediaItem}
      transcript={transcript}
    />
  );
}