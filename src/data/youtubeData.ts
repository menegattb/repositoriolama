import { Playlist, MediaItem, StandaloneVideo } from '@/types';

// Interface para os dados do YouTube
interface YouTubePlaylist {
  id: string;
  title: string;
  description: string;
  publishedAt: string;
  itemCount: number;
}

// URL da Hostinger onde o JSON está hospedado
// Usar API route do Next.js como proxy para evitar problemas de CORS
const getYouTubeDataUrl = (forceRefresh: boolean = false) => {
  // Em produção, sempre usar a API route local (que busca do Drive)
  // Em desenvolvimento, usar arquivo local ou API route
  const baseUrl = process.env.NEXT_PUBLIC_YOUTUBE_DATA_URL || 
    (typeof window !== 'undefined' 
      ? '/api/youtube-data'  // Client-side: usar API route do Next.js (evita CORS)
      : (process.env.NODE_ENV === 'production'
          ? 'https://repositorio.acaoparamita.com.br/api/youtube-data'  // Server-side produção: usar API route (busca do Drive)
          : (process.env.HOSTINGER_API_URL 
              ? `${process.env.HOSTINGER_API_URL}/repositorio/api/youtube-data.json`
              : 'https://acaoparamita.com.br/repositorio/api/youtube-data.json'))  // Server-side desenvolvimento: Hostinger
    );
  
  // Adicionar refresh=true se necessário
  if (forceRefresh && baseUrl.includes('/api/youtube-data')) {
    return `${baseUrl}?refresh=true`;
  }
  
  return baseUrl;
};

// Cache para os dados
let cachedData: Playlist[] | null = null;
let fetchPromise: Promise<Playlist[]> | null = null;

/**
 * Limpar cache dos dados do YouTube
 */
export function clearYouTubeDataCache() {
  cachedData = null;
  fetchPromise = null;
  console.log('[YouTube Data] 🗑️ Cache limpo');
}

/**
 * Busca os dados do YouTube
 * Em desenvolvimento no servidor: busca do arquivo local
 * Em produção ou client-side: busca via API/Hostinger
 * @param forceRefresh - Se true, força busca atualizada ignorando cache
 */
async function fetchYouTubeData(forceRefresh: boolean = false): Promise<YouTubePlaylist[]> {
  // Em desenvolvimento no servidor, ler diretamente do arquivo local
  if (process.env.NODE_ENV === 'development' && typeof window === 'undefined') {
    try {
      const { readFile } = await import('fs/promises');
      const { join } = await import('path');
      const { existsSync } = await import('fs');
      
      const localFilePath = join(process.cwd(), 'public', 'youtube-data.json');
      
      if (existsSync(localFilePath)) {
        console.log('[YouTube Data] 📁 Buscando dados do arquivo local (server-side):', localFilePath);
        const fileContent = await readFile(localFilePath, 'utf-8');
        const data = JSON.parse(fileContent);
        console.log('[YouTube Data] ✅ Dados carregados localmente (server-side). Total de playlists:', data.playlists?.length || 0);
        
        if (!data || typeof data !== 'object' || data.error) {
          console.error('[YouTube Data] ❌ Erro na resposta do arquivo local:', data.error);
          return [];
        }
        
        return data.playlists || [];
      } else {
        console.warn('[YouTube Data] ⚠️ Arquivo local não encontrado, buscando via API...');
      }
    } catch (error) {
      console.error('[YouTube Data] ❌ Erro ao ler arquivo local:', error);
      console.warn('[YouTube Data] ⚠️ Continuando com busca via API...');
    }
  }
  
  // Buscar via API/Hostinger
  const url = getYouTubeDataUrl(forceRefresh);
  
  try {
    console.log('[YouTube Data] 🌐 Buscando dados de:', url);
    console.log('[YouTube Data] 📍 Ambiente:', typeof window !== 'undefined' ? 'Client' : 'Server');
    if (forceRefresh) {
      console.log('[YouTube Data] 🔄 Refresh forçado');
    }
    
    // Adicionar timestamp para evitar cache do navegador em client-side (se não tiver refresh=true)
    const urlWithCacheBust = typeof window !== 'undefined' && !forceRefresh
      ? `${url}${url.includes('?') ? '&' : '?'}t=${Date.now()}`
      : url;
    
    // Configuração de fetch - sempre usar no-store para garantir dados atualizados
    const fetchOptions: RequestInit = {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      cache: 'no-store' as RequestCache, // Sempre sem cache
    };
    
    const response = await fetch(urlWithCacheBust, fetchOptions);

    console.log('[YouTube Data] 📊 Status da resposta:', response.status, response.statusText);
    console.log('[YouTube Data] 📋 Headers CORS:', {
      'access-control-allow-origin': response.headers.get('access-control-allow-origin'),
      'access-control-allow-methods': response.headers.get('access-control-allow-methods'),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[YouTube Data] ❌ Erro na resposta:', response.status, errorText);
      throw new Error(`Failed to fetch YouTube data: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('[YouTube Data] ✅ Dados recebidos. Total de playlists:', data.playlists?.length || 0);
    console.log('[YouTube Data] 📦 Estrutura dos dados:', Object.keys(data));
    
    if (!data || typeof data !== 'object') {
      console.error('[YouTube Data] ❌ Dados não são um objeto:', typeof data);
      return [];
    }
    
    // Verificar se há erro na resposta
    if (data.error) {
      console.error('[YouTube Data] ❌ Erro na resposta da API:', data.error);
      return [];
    }
    
    if (!data.playlists || !Array.isArray(data.playlists)) {
      console.error('[YouTube Data] ❌ Formato de dados inválido. Estrutura recebida:', Object.keys(data));
      console.error('[YouTube Data] ❌ playlists existe?', 'playlists' in data);
      console.error('[YouTube Data] ❌ playlists é array?', Array.isArray(data.playlists));
      console.error('[YouTube Data] ❌ Dados recebidos:', JSON.stringify(data).substring(0, 500));
      return [];
    }
    
    if (data.playlists.length === 0) {
      console.warn('[YouTube Data] ⚠️ Array de playlists está vazio');
    }
    
    return data.playlists;
  } catch (error) {
    console.error('[YouTube Data] ❌ Erro ao buscar dados:', error);
    console.error('[YouTube Data] 🔗 URL tentada:', url);
    
    // Em client-side, mostrar erro detalhado
    if (typeof window !== 'undefined') {
      const err = error as Error;
      console.error('[YouTube Data] ❌ Tipo do erro:', err.name);
      console.error('[YouTube Data] ❌ Mensagem:', err.message);
      console.error('[YouTube Data] ❌ Stack:', err.stack);
      
      // Verificar se é erro de CORS
      if (err.message.includes('CORS') || err.message.includes('Failed to fetch')) {
        console.error('[YouTube Data] ⚠️ POSSÍVEL ERRO DE CORS!');
        console.error('[YouTube Data] 💡 Verifique se o .htaccess está configurado corretamente na Hostinger');
      }
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
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function getYouTubeThumbnail(_playlistId: string): string {
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
 * @param forceRefresh - Se true, ignora cache e busca dados atualizados
 */
export async function getYouTubePlaylists(forceRefresh: boolean = false): Promise<Playlist[]> {
  // Se forçar refresh, limpar cache primeiro
  if (forceRefresh) {
    clearYouTubeDataCache();
  }
  
  // Se já temos cache e não é refresh forçado, retornar
  if (!forceRefresh && cachedData) {
    return cachedData;
  }

  // Se já existe uma requisição em andamento, aguardar ela
  if (fetchPromise) {
    return fetchPromise;
  }

  // Criar nova requisição
  fetchPromise = fetchYouTubeData(forceRefresh).then((data) => {
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

/**
 * Função para buscar vídeos sem playlist do JSON
 */
export async function getStandaloneVideos(): Promise<StandaloneVideo[]> {
  const url = getYouTubeDataUrl(true); // Forçar refresh para dados atualizados
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      cache: 'no-store' as RequestCache, // Sempre sem cache
    });

    if (!response.ok) {
      console.error('[YouTube Data] ❌ Erro ao buscar vídeos standalone:', response.status);
      return [];
    }

    const data = await response.json();
    
    if (data.standaloneVideos && Array.isArray(data.standaloneVideos)) {
      console.log('[YouTube Data] ✅ Vídeos standalone encontrados:', data.standaloneVideos.length);
      return data.standaloneVideos;
    }
    
    return [];
  } catch (error) {
    console.error('[YouTube Data] ❌ Erro ao buscar vídeos standalone:', error);
    return [];
  }
}

// Exportar função de conversão caso precise ser usada externamente
export { convertYouTubeToPlaylist };
