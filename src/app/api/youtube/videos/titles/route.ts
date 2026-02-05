import { NextRequest, NextResponse } from 'next/server';

interface YouTubeVideoSnippet {
  id: string;
  snippet: {
    title: string;
    description: string;
    publishedAt: string;
    channelTitle: string;
  };
}

interface YouTubeVideosResponse {
  items: YouTubeVideoSnippet[];
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const idsParam = searchParams.get('ids');

    if (!idsParam) {
      return NextResponse.json(
        { error: 'Missing ids parameter', titles: {} },
        { status: 400 }
      );
    }

    const videoIds = idsParam.split(',').filter(id => /^[a-zA-Z0-9_-]{11}$/.test(id));
    
    if (videoIds.length === 0) {
      return NextResponse.json({ titles: {} });
    }

    const apiKey = process.env.YOUTUBE_API_KEY;
    
    if (!apiKey) {
      console.error('[API /api/youtube/videos/titles] ❌ YouTube API key not configured');
      return NextResponse.json(
        { error: 'YouTube API key not configured', titles: {} },
        { status: 503 }
      );
    }

    console.log(`[API /api/youtube/videos/titles] 🔍 Buscando títulos de ${videoIds.length} vídeos`);

    const titles: Record<string, string> = {};

    // Buscar em lotes de 50 (limite da API)
    for (let i = 0; i < videoIds.length; i += 50) {
      const batch = videoIds.slice(i, i + 50);
      const idsString = batch.join(',');

      try {
        const response = await fetch(
          `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${idsString}&key=${apiKey}`
        );

        if (!response.ok) {
          console.error(`[API /api/youtube/videos/titles] ❌ YouTube API error: ${response.status}`);
          continue;
        }

        const data: YouTubeVideosResponse = await response.json();

        for (const item of data.items) {
          titles[item.id] = item.snippet.title;
        }
      } catch (error) {
        console.error('[API /api/youtube/videos/titles] Error fetching batch:', error);
      }
    }

    console.log(`[API /api/youtube/videos/titles] ✅ Retornando ${Object.keys(titles).length} títulos`);

    return NextResponse.json({
      titles,
      found: Object.keys(titles).length,
      requested: videoIds.length
    });
  } catch (error) {
    console.error('[API /api/youtube/videos/titles] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch video titles', titles: {} },
      { status: 500 }
    );
  }
}
