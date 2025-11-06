import { getStandaloneVideos } from '@/data/youtubeData';
import { mockTranscripts } from '@/data/mockData';
import PlaylistDetailClient from '@/components/PlaylistDetailClient';
import { notFound } from 'next/navigation';
import { MediaItem, Playlist } from '@/types';

// Tornar a página dinâmica (renderizada sob demanda)
export const dynamic = 'force-dynamic';
export const dynamicParams = true;
export const fetchCache = 'force-no-store';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function VideoDetailPage({ params }: PageProps) {
  const { id: videoId } = await params;
  
  console.log('[VideoDetailPage] Buscando vídeo:', videoId);
  
  try {
    const standaloneVideos = await getStandaloneVideos();
    console.log('[VideoDetailPage] Total de vídeos standalone carregados:', standaloneVideos.length);
  
    const video = standaloneVideos.find(v => v.id === videoId);
  
    if (!video) {
      console.warn('[VideoDetailPage] Vídeo não encontrado:', videoId);
      notFound();
    }
    
    console.log('[VideoDetailPage] Vídeo encontrado:', video.title);

    // Converter StandaloneVideo para MediaItem
    const publishedDate = new Date(video.publishedAt);
    const locationMatch = video.title.match(/(CEBB|SP|Rio|BH|Curitiba|Londrina|Paris|Lisboa|Alto Paraíso|Akanishta|Caminho do Meio|Darmata|Sukhavati|Joinville|Floripa|Ponta Grossa|Campinas|Viamão|Araras|Ilhabela)/);
    const location = locationMatch ? locationMatch[1] : 'Brasil';

    const mediaItem: MediaItem = {
      id: video.id,
      title: video.title,
      description: video.description || '',
      summary: video.description ? video.description.substring(0, 200) + '...' : '',
      date: publishedDate.toISOString().split('T')[0],
      location: location,
      format: 'video' as const,
      media_url: `https://www.youtube.com/watch?v=${video.id}`,
      duration: video.duration || 0,
      theme: 'Ensinamentos Gerais',
      event_type: 'Palestra',
      series_title: 'Vídeos Sem Playlist',
      track_title: video.title
    };

    // Criar uma "playlist" virtual com apenas este vídeo para usar o componente PlaylistDetailClient
    const virtualPlaylist: Playlist = {
      id: `standalone-${video.id}`,
      title: video.title,
      description: video.description || '',
      thumbnail_url: video.thumbnail || `https://img.youtube.com/vi/${video.id}/maxresdefault.jpg`,
      featured: false,
      items: [mediaItem],
      metadata: {
        total_talks: 1,
        year: publishedDate.getFullYear().toString(),
        location: location,
        format: 'Video',
        hasTranscription: false,
        hasAudio: false
      }
    };

    const transcript = mockTranscripts.find(t => t.media_item_id === video.id) || null;

    return (
      <PlaylistDetailClient 
        playlist={virtualPlaylist}
        initialMediaItem={mediaItem}
        transcript={transcript}
      />
    );
  } catch (error) {
    console.error('[VideoDetailPage] Erro ao carregar vídeo:', error);
    notFound();
  }
}

