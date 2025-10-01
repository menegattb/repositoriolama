import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const playlistId = params.id;

    // Para desenvolvimento, vamos usar uma abordagem mais simples
    // Em produção, você precisaria de uma chave de API do YouTube
    const response = await fetch(
      `https://www.youtube.com/playlist?list=${playlistId}`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch playlist');
    }

    const html = await response.text();
    
    // Extrair informações básicas do HTML (método simples)
    // Em produção, use a YouTube Data API v3
    const videoIdMatch = html.match(/"videoId":"([^"]+)"/);
    
    if (videoIdMatch) {
      const videoId = videoIdMatch[1];
      return NextResponse.json({
        items: [{
          id: videoId,
          title: 'Vídeo da Playlist',
          thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
        }]
      });
    }

    // Fallback: retornar dados mock baseados no ID da playlist
    return NextResponse.json({
      items: [{
        id: playlistId.slice(-11), // Usar últimos 11 caracteres como "video ID"
        title: 'Vídeo da Playlist',
        thumbnail: `https://img.youtube.com/vi/${playlistId.slice(-11)}/maxresdefault.jpg`
      }]
    });

  } catch (error) {
    console.error('Error fetching playlist data:', error);
    
    // Fallback em caso de erro
    const playlistId = params.id;
    return NextResponse.json({
      items: [{
        id: playlistId.slice(-11),
        title: 'Vídeo da Playlist',
        thumbnail: `https://img.youtube.com/vi/${playlistId.slice(-11)}/maxresdefault.jpg`
      }]
    });
  }
}
