import { NextRequest, NextResponse } from 'next/server';
import { MediaItem } from '@/types';

interface YouTubeVideoItem {
  id: string;
  snippet: {
    publishedAt: string;
    channelId: string;
    title: string;
    description: string;
    thumbnails: {
      default: { url: string; width: number; height: number; };
      medium: { url: string; width: number; height: number; };
      high: { url: string; width: number; height: number; };
      standard: { url: string; width: number; height: number; };
      maxres: { url: string; width: number; height: number; };
    };
    resourceId: {
      kind: string;
      videoId: string;
    };
  };
}

interface YouTubePlaylistResponse {
  items: YouTubeVideoItem[];
  nextPageToken?: string;
}

interface VideoDetails {
  id: string;
  contentDetails: {
    duration: string;
  };
}

interface VideoDetailsResponse {
  items: VideoDetails[];
}

// Converter duração ISO 8601 para segundos
function parseDuration(duration: string): number {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  
  const hours = parseInt(match[1] || '0', 10);
  const minutes = parseInt(match[2] || '0', 10);
  const seconds = parseInt(match[3] || '0', 10);
  
  return hours * 3600 + minutes * 60 + seconds;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: playlistId } = await params;
    
    const apiKey = process.env.YOUTUBE_API_KEY;
    
    if (!apiKey) {
      console.warn('[API /api/youtube/playlist/[id]/videos] YouTube API key not configured');
      return NextResponse.json(
        { error: 'YouTube API key not configured', videos: [] },
        { status: 503 }
      );
    }

    console.log('[API /api/youtube/playlist/[id]/videos] Buscando vídeos da playlist:', playlistId);

    const videos: MediaItem[] = [];
    let nextPageToken = '';

    // Buscar todos os vídeos da playlist (paginado)
    do {
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${playlistId}&maxResults=50&key=${apiKey}${nextPageToken ? `&pageToken=${nextPageToken}` : ''}`
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[API /api/youtube/playlist/[id]/videos] YouTube API error: ${response.status}`, errorText);
        return NextResponse.json(
          { error: `YouTube API error: ${response.status}`, videos: [] },
          { status: response.status }
        );
      }

      const data: YouTubePlaylistResponse = await response.json();
      
      for (const item of data.items) {
        videos.push({
          id: item.snippet.resourceId.videoId,
          title: item.snippet.title,
          description: item.snippet.description,
          summary: item.snippet.description.substring(0, 200) + '...',
          date: item.snippet.publishedAt.split('T')[0],
          location: 'CEBB',
          format: 'video' as const,
          media_url: `https://www.youtube.com/watch?v=${item.snippet.resourceId.videoId}`,
          duration: 0, // Será preenchido abaixo
          theme: 'Ensinamentos Gerais',
          event_type: 'Palestra',
          series_title: 'Ensinamentos do CEBB',
          track_title: item.snippet.title
        });
      }

      nextPageToken = data.nextPageToken || '';
    } while (nextPageToken);

    // Buscar durações dos vídeos em lotes
    try {
      for (let i = 0; i < videos.length; i += 50) {
        const batch = videos.slice(i, i + 50);
        const videoIds = batch.map(v => v.id).join(',');
        
        const response = await fetch(
          `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${videoIds}&key=${apiKey}`
        );

        if (!response.ok) continue;

        const data: VideoDetailsResponse = await response.json();
        
        for (const videoDetail of data.items) {
          const video = videos.find(v => v.id === videoDetail.id);
          if (video) {
            video.duration = parseDuration(videoDetail.contentDetails.duration);
          }
        }
      }
    } catch (error) {
      console.error('[API /api/youtube/playlist/[id]/videos] Error fetching video durations:', error);
      // Continuar mesmo se falhar ao buscar durações
    }

    console.log(`[API /api/youtube/playlist/[id]/videos] ✅ Retornando ${videos.length} vídeos`);

    return NextResponse.json({ videos }, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (error) {
    console.error('[API /api/youtube/playlist/[id]/videos] Erro:', error);
    return NextResponse.json(
      { error: 'Internal server error', videos: [] },
      { status: 500 }
    );
  }
}

