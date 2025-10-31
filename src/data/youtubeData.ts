import { Playlist, MediaItem } from '@/types';

// Interface para os dados do YouTube
interface YouTubePlaylist {
  id: string;
  title: string;
  description: string;
  publishedAt: string;
  itemCount: number;
}

// URL da Hostinger onde o JSON está hospedado
const YOUTUBE_DATA_URL = process.env.NEXT_PUBLIC_YOUTUBE_DATA_URL || 
  'https://repositorio.acaoparamita.com.br/api/youtube-data.json';

// Cache para os dados
let cachedData: Playlist[] | null = null;
let fetchPromise: Promise<Playlist[]> | null = null;

/**
 * Busca os dados do YouTube da Hostinger
 */
async function fetchYouTubeData(): Promise<YouTubePlaylist[]> {
  try {
    console.log('[YouTube Data] Buscando dados de:', YOUTUBE_DATA_URL);
    
    const response = await fetch(YOUTUBE_DATA_URL, {
      // Adicionar cache para evitar múltiplas requisições
      cache: 'no-store', // Sempre buscar dados atualizados
      headers: {
        'Accept': 'application/json',
      },
    });

    console.log('[YouTube Data] Status da resposta:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[YouTube Data] Erro na resposta:', response.status, errorText);
      throw new Error(`Failed to fetch YouTube data: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('[YouTube Data] Dados recebidos. Total de playlists:', data.playlists?.length || 0);
    
    if (!data.playlists || !Array.isArray(data.playlists)) {
      console.error('[YouTube Data] Formato de dados inválido:', data);
      return [];
    }
    
    return data.playlists;
  } catch (error) {
    console.error('[YouTube Data] Erro ao buscar dados:', error);
    console.error('[YouTube Data] URL tentada:', YOUTUBE_DATA_URL);
    
    // Em desenvolvimento, mostrar erro completo
    if (typeof window !== 'undefined') {
      console.error('[YouTube Data] Erro completo:', error);
    }
    
    // Retornar array vazio em caso de erro (fallback)
    return [];
  }
}

/**
 * Converte dados do YouTube para formato Playlist
 */
function convertYouTubeToPlaylist(youtubeData: YouTubePlaylist[]): Playlist[] {
  return youtubeData.map((item) => {
    const publishedDate = new Date(item.publishedAt);
    const year = publishedDate.getFullYear().toString();
    
    // Extrair localização do título (se contiver informações de local)
    const locationMatch = item.title.match(/(CEBB|SP|Rio|BH|Curitiba|Londrina|Paris|Lisboa|Alto Paraíso|Akanishta|Caminho do Meio|Darmata|Sukhavati|Joinville|Floripa|Ponta Grossa|Campinas|Viamão|Araras|Ilhabela)/);
    const location = locationMatch ? locationMatch[1] : 'Brasil';
    
    // Determinar se é destaque baseado no número de itens e recência
    const isFeatured = item.itemCount >= 10 || publishedDate > new Date('2020-01-01');
    
    // Criar itens de mídia mock baseados no itemCount
    const mediaItems: MediaItem[] = Array.from({ length: Math.min(item.itemCount, 5) }, (_, i) => ({
      id: `${item.id}-${i + 1}`,
      title: `${item.title} - Parte ${i + 1}`,
      description: `Parte ${i + 1} de ${item.itemCount} da série "${item.title}"`,
      summary: `Esta é a parte ${i + 1} de uma série de ${item.itemCount} vídeos sobre ensinamentos budistas.`,
      date: publishedDate.toISOString().split('T')[0],
      location: location,
      format: 'video' as const,
      media_url: `https://www.youtube.com/playlist?list=${item.id}`,
      duration: getDeterministicDuration(item.id),
      theme: getThemeFromTitle(item.title),
      event_type: getEventTypeFromTitle(item.title),
      series_title: item.title,
      track_title: `${item.title} - Parte ${i + 1}`
    }));

    return {
      id: item.id,
      title: item.title,
      description: item.description || `Série de ${item.itemCount} vídeos sobre ensinamentos budistas.`,
      thumbnail_url: getYouTubeThumbnail(item.id),
      featured: isFeatured,
      metadata: {
        total_talks: item.itemCount,
        year: year,
        location: location,
        format: 'Video',
        hasTranscription: false,
        hasAudio: mediaItems.some(mediaItem => mediaItem.format === 'audio')
      },
      items: mediaItems
    };
  });
}

// Função auxiliar para extrair tema do título
function getThemeFromTitle(title: string): string {
  if (title.includes('meditação') || title.includes('Meditação')) return 'Meditação';
  if (title.includes('retiro') || title.includes('Retiro')) return 'Retiro';
  if (title.includes('estudo') || title.includes('Estudo')) return 'Estudo';
  if (title.includes('palestra') || title.includes('Palestra')) return 'Palestra';
  if (title.includes('curso') || title.includes('Curso')) return 'Curso';
  if (title.includes('Sutra')) return 'Sutras';
  if (title.includes('elementos')) return 'Cinco Elementos';
  if (title.includes('relações') || title.includes('Relações')) return 'Relações';
  if (title.includes('budismo') || title.includes('Budismo')) return 'Budismo';
  if (title.includes('educação') || title.includes('Educação')) return 'Educação';
  if (title.includes('psicologia') || title.includes('Psicologia')) return 'Psicologia';
  if (title.includes('corporativo') || title.includes('Corporativo')) return 'Mundo Corporativo';
  return 'Ensinamentos Gerais';
}

// Função auxiliar para extrair tipo de evento do título
function getEventTypeFromTitle(title: string): string {
  if (title.includes('retiro') || title.includes('Retiro')) return 'Retiro';
  if (title.includes('palestra') || title.includes('Palestra')) return 'Palestra';
  if (title.includes('curso') || title.includes('Curso')) return 'Curso';
  if (title.includes('estudo') || title.includes('Estudo')) return 'Estudo de Aprofundamento';
  if (title.includes('mini-retiro')) return 'Mini-retiro';
  if (title.includes('encontro') || title.includes('Encontro')) return 'Encontro';
  if (title.includes('workshop') || title.includes('Workshop')) return 'Workshop';
  return 'Ensinamento';
}

// Função auxiliar para obter thumbnail do YouTube
function getYouTubeThumbnail(playlistId: string): string {
  // Para playlists, não há thumbnail direto, usar placeholder
  return `https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg`; // Placeholder
}

// Função auxiliar para duração determinística
function getDeterministicDuration(id: string): number {
  // Usar hash simples do ID para duração entre 1800 e 7200 segundos
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash) + id.charCodeAt(i);
    hash = hash & hash; // Convert to 32bit integer
  }
  return 1800 + (Math.abs(hash) % 5400);
}

/**
 * Função assíncrona para buscar playlists da Hostinger
 * Use esta função em Server Components ou com await
 */
export async function getYouTubePlaylists(): Promise<Playlist[]> {
  // Se já temos cache, retornar
  if (cachedData) {
    return cachedData;
  }

  // Se já existe uma requisição em andamento, aguardar ela
  if (fetchPromise) {
    return fetchPromise;
  }

  // Criar nova requisição
  fetchPromise = fetchYouTubeData().then((data) => {
    cachedData = convertYouTubeToPlaylist(data);
    fetchPromise = null; // Limpar após concluir
    return cachedData;
  });

  return fetchPromise;
}

/**
 * Export síncrono para compatibilidade (retorna array vazio inicialmente)
 * Componentes Client devem usar useEffect para buscar dados
 */
export const youtubePlaylists: Playlist[] = [];

// Exportar função de conversão caso precise ser usada externamente
export { convertYouTubeToPlaylist };
