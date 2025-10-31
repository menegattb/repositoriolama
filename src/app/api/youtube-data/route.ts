import { NextResponse } from 'next/server';

const YOUTUBE_DATA_URL = 'https://repositorio.acaoparamita.com.br/api/youtube-data.json';

/**
 * API Route para buscar dados do YouTube da Hostinger
 * Funciona como proxy para evitar problemas de CORS no client-side
 */
export async function GET() {
  try {
    console.log('[API /api/youtube-data] Buscando dados de:', YOUTUBE_DATA_URL);
    
    const response = await fetch(YOUTUBE_DATA_URL, {
      cache: 'no-store',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('[API /api/youtube-data] Erro:', response.status);
      return NextResponse.json(
        { error: `Failed to fetch: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('[API /api/youtube-data] Dados recebidos. Playlists:', data.playlists?.length || 0);
    
    // Retornar os dados com headers CORS adequados
    return NextResponse.json(data, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (error) {
    console.error('[API /api/youtube-data] Erro:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

