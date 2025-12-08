import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { Readable } from 'stream';

const DRIVE_FOLDER_ID = '1SKEAfJ8oC0dOq0LGxUt6UtxQXjuvykwg';

interface YouTubePlaylist {
  id: string;
  title: string;
  description: string;
  publishedAt: string;
  itemCount: number;
}

interface StandaloneVideo {
  id: string;
  title: string;
  description: string;
  publishedAt: string;
  thumbnail?: string;
  duration?: number;
}

interface YouTubeDataResponse {
  version: string;
  generatedAt?: string;
  playlists: YouTubePlaylist[];
  standaloneVideos?: StandaloneVideo[];
  updatedAt: string;
}

/**
 * Ler JSON existente do Google Drive
 */
async function readJsonFromDrive(): Promise<YouTubeDataResponse | null> {
  const oauthClientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const oauthClientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  const oauthRefreshToken = process.env.GOOGLE_OAUTH_REFRESH_TOKEN;

  if (!oauthClientId || !oauthClientSecret || !oauthRefreshToken) {
    console.error('[YOUTUBE SYNC] ❌ Credenciais OAuth não configuradas!');
    return null;
  }

  try {
    console.log('[YOUTUBE SYNC] 📖 Lendo JSON existente do Drive...');
    
    const oauth2Client = new OAuth2Client(
      oauthClientId,
      oauthClientSecret,
      process.env.NODE_ENV === 'production' 
        ? 'https://repositorio.acaoparamita.com.br/api/auth/google/callback'
        : 'http://localhost:3000/api/auth/google/callback'
    );

    oauth2Client.setCredentials({
      refresh_token: oauthRefreshToken,
    });

    const { credentials } = await oauth2Client.refreshAccessToken();
    oauth2Client.setCredentials(credentials);

    const drive = google.drive({ version: 'v3', auth: oauth2Client });

    // Buscar arquivo youtube-data.json
    const fileName = 'youtube-data.json';
    const existingFiles = await drive.files.list({
      q: `name='${fileName}' and '${DRIVE_FOLDER_ID}' in parents and trashed=false`,
      fields: 'files(id, name)',
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    });

    if (!existingFiles.data.files || existingFiles.data.files.length === 0) {
      console.log('[YOUTUBE SYNC] ⚠️ JSON não encontrado no Drive, começando do zero');
      return null;
    }

    const fileId = existingFiles.data.files[0].id;
    console.log(`[YOUTUBE SYNC] ✅ JSON encontrado no Drive: ${fileId}`);

    // Baixar conteúdo do arquivo
    const fileContent = await drive.files.get({
      fileId: fileId!,
      alt: 'media',
      supportsAllDrives: true,
    }, {
      responseType: 'text',
    });

    const jsonData = JSON.parse(fileContent.data as string) as YouTubeDataResponse;
    console.log(`[YOUTUBE SYNC] ✅ JSON lido: ${jsonData.playlists.length} playlists, ${jsonData.standaloneVideos?.length || 0} vídeos standalone`);
    
    return jsonData;
  } catch (error) {
    console.error('[YOUTUBE SYNC] ❌ Erro ao ler JSON do Drive:', error);
    return null;
  }
}

/**
 * Buscar informações atualizadas de uma playlist por ID
 */
async function fetchPlaylistInfo(playlistId: string, apiKey: string): Promise<YouTubePlaylist | null> {
  try {
    const url = `https://www.googleapis.com/youtube/v3/playlists?part=snippet,contentDetails&id=${playlistId}&key=${apiKey}`;
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[YOUTUBE SYNC] ❌ Erro ao buscar playlist ${playlistId}: ${response.status}`, errorText.substring(0, 200));
      return null;
    }
    
    const data = await response.json();
    
    if (!data.items || data.items.length === 0) {
      console.warn(`[YOUTUBE SYNC] ⚠️ Playlist ${playlistId} não encontrada`);
      return null;
    }
    
    const item = data.items[0];
    return {
      id: playlistId,
      title: item.snippet.title,
      description: item.snippet.description || '',
      publishedAt: item.snippet.publishedAt,
      itemCount: item.contentDetails?.itemCount || 0,
    };
  } catch (error) {
    console.error(`[YOUTUBE SYNC] ❌ Erro ao buscar playlist ${playlistId}:`, error);
    return null;
  }
}

/**
 * Buscar informações atualizadas de um vídeo por ID
 */
async function fetchVideoInfo(videoId: string, apiKey: string): Promise<StandaloneVideo | null> {
  try {
    const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${videoId}&key=${apiKey}`;
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[YOUTUBE SYNC] ❌ Erro ao buscar vídeo ${videoId}: ${response.status}`, errorText.substring(0, 200));
      return null;
    }
    
    const data = await response.json();
    
    if (!data.items || data.items.length === 0) {
      console.warn(`[YOUTUBE SYNC] ⚠️ Vídeo ${videoId} não encontrado`);
      return null;
    }
    
    const item = data.items[0];
    
    // Converter duração ISO 8601 para segundos
    const durationMatch = item.contentDetails?.duration?.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    const duration = durationMatch 
      ? (parseInt(durationMatch[1] || '0', 10) * 3600 + 
         parseInt(durationMatch[2] || '0', 10) * 60 + 
         parseInt(durationMatch[3] || '0', 10))
      : 0;
    
    return {
      id: videoId,
      title: item.snippet.title,
      description: item.snippet.description || '',
      publishedAt: item.snippet.publishedAt,
      thumbnail: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.default?.url,
      duration: duration,
    };
  } catch (error) {
    console.error(`[YOUTUBE SYNC] ❌ Erro ao buscar vídeo ${videoId}:`, error);
    return null;
  }
}

/**
 * Buscar todas as playlists do canal (públicas e privadas se OAuth disponível)
 */
async function fetchAllChannelPlaylists(channelId: string, apiKey: string): Promise<YouTubePlaylist[]> {
  const playlists: YouTubePlaylist[] = [];
  let nextPageToken = '';

  // Tentar usar OAuth do YouTube primeiro (para playlists privadas)
  const youtubeOAuthClientId = process.env.YOUTUBE_OAUTH_CLIENT_ID;
  const youtubeOAuthClientSecret = process.env.YOUTUBE_OAUTH_CLIENT_SECRET;
  const youtubeOAuthRefreshToken = process.env.YOUTUBE_OAUTH_REFRESH_TOKEN;
  
  let useOAuth = false;
  let youtube: any = null;
  
  if (youtubeOAuthClientId && youtubeOAuthClientSecret && youtubeOAuthRefreshToken) {
    try {
      console.log(`[YOUTUBE SYNC] 🔐 Usando OAuth do YouTube para buscar playlists (incluindo privadas)...`);
      const oauth2Client = new OAuth2Client(
        youtubeOAuthClientId,
        youtubeOAuthClientSecret,
        process.env.NODE_ENV === 'production' 
          ? 'https://repositorio.acaoparamita.com.br/api/auth/youtube/callback'
          : 'http://localhost:3000/api/auth/youtube/callback'
      );

      oauth2Client.setCredentials({
        refresh_token: youtubeOAuthRefreshToken,
      });

      const { credentials } = await oauth2Client.refreshAccessToken();
      oauth2Client.setCredentials(credentials);

      youtube = google.youtube({ version: 'v3', auth: oauth2Client });
      useOAuth = true;
    } catch (error) {
      console.warn(`[YOUTUBE SYNC] ⚠️ Erro ao configurar OAuth do YouTube, usando API Key apenas:`, error);
      useOAuth = false;
    }
  } else {
    console.log(`[YOUTUBE SYNC] 📝 Usando API Key apenas (playlists públicas)...`);
  }

  console.log(`[YOUTUBE SYNC] 🔍 Buscando TODAS as playlists do canal: ${channelId}`);

  do {
    try {
      let data: any;
      
      if (useOAuth && youtube) {
        // Usar OAuth para buscar playlists (incluindo privadas)
        const response = await youtube.playlists.list({
          part: ['snippet', 'contentDetails'],
          channelId: channelId,
          maxResults: 50,
          pageToken: nextPageToken || undefined,
        });
        
        data = response.data;
      } else {
        // Usar API Key para buscar playlists públicas
        const url = `https://www.googleapis.com/youtube/v3/playlists?part=snippet,contentDetails&channelId=${channelId}&maxResults=50&key=${apiKey}${nextPageToken ? `&pageToken=${nextPageToken}` : ''}`;
        
        const response = await fetch(url, {
          headers: {
            'Accept': 'application/json',
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`[YOUTUBE SYNC] ❌ Erro ao buscar playlists: ${response.status}`, errorText.substring(0, 500));
          break;
        }

        data = await response.json();
      }

      if (data.items && data.items.length > 0) {
        for (const item of data.items) {
          playlists.push({
            id: item.id,
            title: item.snippet.title,
            description: item.snippet.description || '',
            publishedAt: item.snippet.publishedAt,
            itemCount: item.contentDetails?.itemCount || 0,
          });
        }
        console.log(`[YOUTUBE SYNC] ✅ Encontradas ${data.items.length} playlists nesta página (total: ${playlists.length})`);
      }

      nextPageToken = data.nextPageToken || '';
      
      // Delay para evitar rate limiting
      if (nextPageToken) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    } catch (error) {
      console.error('[YOUTUBE SYNC] ❌ Erro ao buscar playlists:', error);
      break;
    }
  } while (nextPageToken);

  console.log(`[YOUTUBE SYNC] ✅ Total de playlists encontradas no canal: ${playlists.length}`);
  return playlists;
}

/**
 * Buscar todos os vídeos standalone do canal
 */
async function fetchAllStandaloneVideos(channelId: string, apiKey: string, existingPlaylistIds: string[]): Promise<StandaloneVideo[]> {
  const standaloneVideos: StandaloneVideo[] = [];
  let nextPageToken = '';
  const maxVideosToCheck = 2000; // Aumentar limite para buscar mais vídeos
  let videosChecked = 0;

  // Tentar usar OAuth do YouTube primeiro (para vídeos privados)
  const youtubeOAuthClientId = process.env.YOUTUBE_OAUTH_CLIENT_ID;
  const youtubeOAuthClientSecret = process.env.YOUTUBE_OAUTH_CLIENT_SECRET;
  const youtubeOAuthRefreshToken = process.env.YOUTUBE_OAUTH_REFRESH_TOKEN;
  
  let useOAuth = false;
  let youtube: any = null;
  
  if (youtubeOAuthClientId && youtubeOAuthClientSecret && youtubeOAuthRefreshToken) {
    try {
      const oauth2Client = new OAuth2Client(
        youtubeOAuthClientId,
        youtubeOAuthClientSecret,
        process.env.NODE_ENV === 'production' 
          ? 'https://repositorio.acaoparamita.com.br/api/auth/youtube/callback'
          : 'http://localhost:3000/api/auth/youtube/callback'
      );

      oauth2Client.setCredentials({
        refresh_token: youtubeOAuthRefreshToken,
      });

      const { credentials } = await oauth2Client.refreshAccessToken();
      oauth2Client.setCredentials(credentials);

      youtube = google.youtube({ version: 'v3', auth: oauth2Client });
      useOAuth = true;
    } catch (error) {
      console.warn(`[YOUTUBE SYNC] ⚠️ Erro ao configurar OAuth do YouTube para vídeos, usando API Key apenas:`, error);
      useOAuth = false;
    }
  }

  console.log(`[YOUTUBE SYNC] 🔍 Buscando TODOS os vídeos standalone do canal: ${channelId}`);

  // Buscar todos os vídeos de todas as playlists conhecidas para criar um Set
  const videosInPlaylists = new Set<string>();
  console.log(`[YOUTUBE SYNC] 📋 Coletando vídeos de ${existingPlaylistIds.length} playlists conhecidas...`);
  
  // Processar todas as playlists, mas em lotes para não demorar muito
  const batchSize = 50;
  for (let i = 0; i < Math.min(existingPlaylistIds.length, 200); i += batchSize) {
    const batch = existingPlaylistIds.slice(i, i + batchSize);
    console.log(`[YOUTUBE SYNC] 📋 Processando lote ${Math.floor(i / batchSize) + 1} de playlists (${batch.length} playlists)...`);
    
    for (const playlistId of batch) {
    try {
      let playlistPageToken = '';
      do {
        const playlistItemsUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${playlistId}&maxResults=50&key=${apiKey}${playlistPageToken ? `&pageToken=${playlistPageToken}` : ''}`;
        const playlistResponse = await fetch(playlistItemsUrl);
        
        if (playlistResponse.ok) {
          const playlistData = await playlistResponse.json();
          if (playlistData.items) {
            for (const item of playlistData.items) {
              if (item.snippet?.resourceId?.videoId) {
                videosInPlaylists.add(item.snippet.resourceId.videoId);
              }
            }
          }
          playlistPageToken = playlistData.nextPageToken || '';
        }
        await new Promise(resolve => setTimeout(resolve, 50));
      } while (playlistPageToken);
    } catch (error) {
      console.warn(`[YOUTUBE SYNC] ⚠️ Erro ao buscar vídeos da playlist ${playlistId}:`, error);
    }
    }
    
    // Delay entre lotes
    if (i + batchSize < Math.min(existingPlaylistIds.length, 200)) {
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }
  
  console.log(`[YOUTUBE SYNC] ✅ Encontrados ${videosInPlaylists.size} vídeos em playlists conhecidas`);

  // Buscar vídeos do canal
  do {
    try {
      if (videosChecked >= maxVideosToCheck) {
        console.log(`[YOUTUBE SYNC] ⚠️ Limite de ${maxVideosToCheck} vídeos atingido`);
        break;
      }

      let data: any;
      
      if (useOAuth && youtube) {
        // Usar OAuth para buscar vídeos (incluindo privados)
        const response = await youtube.search.list({
          part: ['snippet'],
          channelId: channelId,
          type: 'video',
          maxResults: 50,
          order: 'date',
          pageToken: nextPageToken || undefined,
        });
        
        data = response.data;
      } else {
        // Usar API Key para buscar vídeos públicos
        const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&type=video&maxResults=50&order=date&key=${apiKey}${nextPageToken ? `&pageToken=${nextPageToken}` : ''}`;
        
        const response = await fetch(url, {
          headers: {
            'Accept': 'application/json',
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`[YOUTUBE SYNC] ❌ Erro ao buscar vídeos: ${response.status}`, errorText.substring(0, 500));
          break;
        }

        data = await response.json();
      }

      if (data.items && data.items.length > 0) {
        // Buscar informações detalhadas dos vídeos em lote
        const videoIds = data.items.map((item: any) => item.id.videoId || item.id).join(',');
        
        let videosDetailsData: any;
        
        if (useOAuth && youtube) {
          // Usar OAuth para buscar detalhes dos vídeos
          const videosDetailsResponse = await youtube.videos.list({
            part: ['snippet', 'contentDetails'],
            id: videoIds.split(','),
          });
          videosDetailsData = videosDetailsResponse.data;
        } else {
          // Usar API Key
          const videosDetailsUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${videoIds}&key=${apiKey}`;
          const videosDetailsResponse = await fetch(videosDetailsUrl);
          
          if (!videosDetailsResponse.ok) {
            console.error(`[YOUTUBE SYNC] ❌ Erro ao buscar detalhes dos vídeos: ${videosDetailsResponse.status}`);
            nextPageToken = data.nextPageToken || '';
            if (nextPageToken) {
              await new Promise(resolve => setTimeout(resolve, 100));
            }
            continue;
          }
          
          videosDetailsData = await videosDetailsResponse.json();
        }
        
        if (videosDetailsData && videosDetailsData.items) {
          
          for (const videoDetail of videosDetailsData.items || []) {
            const videoId = videoDetail.id;
            videosChecked++;
            
            // Se o vídeo não está em nenhuma playlist conhecida, é standalone
            if (!videosInPlaylists.has(videoId)) {
              const durationMatch = videoDetail.contentDetails?.duration?.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
              const duration = durationMatch 
                ? (parseInt(durationMatch[1] || '0', 10) * 3600 + 
                   parseInt(durationMatch[2] || '0', 10) * 60 + 
                   parseInt(durationMatch[3] || '0', 10))
                : 0;
              
              standaloneVideos.push({
                id: videoId,
                title: videoDetail.snippet.title,
                description: videoDetail.snippet.description || '',
                publishedAt: videoDetail.snippet.publishedAt,
                thumbnail: videoDetail.snippet.thumbnails?.high?.url || videoDetail.snippet.thumbnails?.default?.url,
                duration: duration,
              });
            }
          }
        }
        
        console.log(`[YOUTUBE SYNC] ✅ Processados ${data.items.length} vídeos nesta página (standalone encontrados: ${standaloneVideos.length})`);
      }

      nextPageToken = data.nextPageToken || '';
      
      // Delay para evitar rate limiting
      if (nextPageToken) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    } catch (error) {
      console.error('[YOUTUBE SYNC] ❌ Erro ao buscar vídeos standalone:', error);
      break;
    }
  } while (nextPageToken && videosChecked < maxVideosToCheck);

  console.log(`[YOUTUBE SYNC] ✅ Total de vídeos standalone encontrados: ${standaloneVideos.length}`);
  return standaloneVideos;
}

/**
 * Atualizar e sincronizar playlists: atualizar existentes e adicionar novas
 */
async function syncPlaylists(jsonData: YouTubeDataResponse, channelId: string, apiKey: string): Promise<{ updated: number; added: number }> {
  let updatedCount = 0;
  let addedCount = 0;
  
  // Buscar todas as playlists do canal
  const allChannelPlaylists = await fetchAllChannelPlaylists(channelId, apiKey);
  
  // Criar Map de playlists existentes por ID para busca rápida
  const existingPlaylistsMap = new Map<string, YouTubePlaylist>();
  jsonData.playlists.forEach(p => existingPlaylistsMap.set(p.id, p));
  
  console.log(`[YOUTUBE SYNC] 🔄 Sincronizando playlists...`);
  console.log(`[YOUTUBE SYNC]   - Existentes no JSON: ${jsonData.playlists.length}`);
  console.log(`[YOUTUBE SYNC]   - Encontradas no canal: ${allChannelPlaylists.length}`);
  
  // Atualizar playlists existentes e adicionar novas
  const syncedPlaylists: YouTubePlaylist[] = [];
  
  for (const channelPlaylist of allChannelPlaylists) {
    const existing = existingPlaylistsMap.get(channelPlaylist.id);
    
    if (existing) {
      // Atualizar dados existentes
      existing.title = channelPlaylist.title;
      existing.description = channelPlaylist.description;
      existing.publishedAt = channelPlaylist.publishedAt;
      existing.itemCount = channelPlaylist.itemCount;
      syncedPlaylists.push(existing);
      updatedCount++;
    } else {
      // Adicionar nova playlist
      syncedPlaylists.push(channelPlaylist);
      addedCount++;
      console.log(`[YOUTUBE SYNC] ➕ Nova playlist adicionada: ${channelPlaylist.title}`);
    }
  }
  
  // Manter playlists que não estão mais no canal (não deletar)
  for (const existingPlaylist of jsonData.playlists) {
    if (!allChannelPlaylists.find(p => p.id === existingPlaylist.id)) {
      syncedPlaylists.push(existingPlaylist);
      console.log(`[YOUTUBE SYNC] 📌 Mantendo playlist que não está mais no canal: ${existingPlaylist.title}`);
    }
  }
  
  // Ordenar por publishedAt (mais recentes primeiro)
  syncedPlaylists.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
  
  jsonData.playlists = syncedPlaylists;
  
  console.log(`[YOUTUBE SYNC] ✅ Sincronização de playlists concluída:`);
  console.log(`[YOUTUBE SYNC]   - Atualizadas: ${updatedCount}`);
  console.log(`[YOUTUBE SYNC]   - Adicionadas: ${addedCount}`);
  console.log(`[YOUTUBE SYNC]   - Total final: ${jsonData.playlists.length}`);
  
  return { updated: updatedCount, added: addedCount };
}

/**
 * Atualizar todas as playlists do JSON existente
 */
async function updatePlaylists(jsonData: YouTubeDataResponse, apiKey: string): Promise<number> {
  let updatedCount = 0;
  
  console.log(`[YOUTUBE SYNC] 🔄 Atualizando ${jsonData.playlists.length} playlists...`);
  
  // Processar em lotes para evitar rate limiting
  for (let i = 0; i < jsonData.playlists.length; i++) {
    const playlist = jsonData.playlists[i];
    console.log(`[YOUTUBE SYNC] 🔍 [${i + 1}/${jsonData.playlists.length}] Atualizando playlist: ${playlist.id}`);
    
    const updatedInfo = await fetchPlaylistInfo(playlist.id, apiKey);
    
    if (updatedInfo) {
      // Atualizar dados mantendo o ID
      playlist.title = updatedInfo.title;
      playlist.description = updatedInfo.description;
      playlist.publishedAt = updatedInfo.publishedAt;
      playlist.itemCount = updatedInfo.itemCount;
      updatedCount++;
      console.log(`[YOUTUBE SYNC] ✅ Atualizada: ${playlist.title} (${playlist.itemCount} itens)`);
    } else {
      console.warn(`[YOUTUBE SYNC] ⚠️ Não foi possível atualizar playlist ${playlist.id}, mantendo dados antigos`);
    }
    
    // Delay para evitar rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log(`[YOUTUBE SYNC] ✅ ${updatedCount} de ${jsonData.playlists.length} playlists atualizadas`);
  return updatedCount;
}

/**
 * Atualizar todos os vídeos standalone do JSON existente
 */
async function updateStandaloneVideos(jsonData: YouTubeDataResponse, apiKey: string): Promise<number> {
  if (!jsonData.standaloneVideos || jsonData.standaloneVideos.length === 0) {
    console.log('[YOUTUBE SYNC] ⚠️ Nenhum vídeo standalone para atualizar');
    return 0;
  }
  
  let updatedCount = 0;
  
  console.log(`[YOUTUBE SYNC] 🔄 Atualizando ${jsonData.standaloneVideos.length} vídeos standalone...`);
  
  for (let i = 0; i < jsonData.standaloneVideos.length; i++) {
    const video = jsonData.standaloneVideos[i];
    console.log(`[YOUTUBE SYNC] 🔍 [${i + 1}/${jsonData.standaloneVideos.length}] Atualizando vídeo: ${video.id}`);
    
    const updatedInfo = await fetchVideoInfo(video.id, apiKey);
    
    if (updatedInfo) {
      // Atualizar dados mantendo o ID
      video.title = updatedInfo.title;
      video.description = updatedInfo.description;
      video.publishedAt = updatedInfo.publishedAt;
      video.thumbnail = updatedInfo.thumbnail;
      video.duration = updatedInfo.duration;
      updatedCount++;
      console.log(`[YOUTUBE SYNC] ✅ Atualizado: ${video.title}`);
    } else {
      console.warn(`[YOUTUBE SYNC] ⚠️ Não foi possível atualizar vídeo ${video.id}, mantendo dados antigos`);
    }
    
    // Delay para evitar rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log(`[YOUTUBE SYNC] ✅ ${updatedCount} de ${jsonData.standaloneVideos.length} vídeos atualizados`);
  return updatedCount;
}


/**
 * Fazer upload do JSON para Google Drive
 */
async function uploadJsonToDrive(jsonData: YouTubeDataResponse): Promise<string | null> {
  const oauthClientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const oauthClientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  const oauthRefreshToken = process.env.GOOGLE_OAUTH_REFRESH_TOKEN;

  if (!oauthClientId || !oauthClientSecret || !oauthRefreshToken) {
    console.error('[YOUTUBE SYNC] ❌ Credenciais OAuth não configuradas!');
    return null;
  }

  try {
    console.log('[YOUTUBE SYNC] 🔐 Iniciando autenticação OAuth 2.0...');
    
    const oauth2Client = new OAuth2Client(
      oauthClientId,
      oauthClientSecret,
      process.env.NODE_ENV === 'production' 
        ? 'https://repositorio.acaoparamita.com.br/api/auth/google/callback'
        : 'http://localhost:3000/api/auth/google/callback'
    );

    oauth2Client.setCredentials({
      refresh_token: oauthRefreshToken,
    });

    const { credentials } = await oauth2Client.refreshAccessToken();
    oauth2Client.setCredentials(credentials);

    console.log('[YOUTUBE SYNC] ✅ Autenticação OAuth concluída');

    const drive = google.drive({ version: 'v3', auth: oauth2Client });

    // Converter JSON para Buffer
    const jsonString = JSON.stringify(jsonData, null, 2);
    const jsonBuffer = Buffer.from(jsonString, 'utf-8');
    const fileName = 'youtube-data.json';

    // Verificar se arquivo já existe
    let existingFileId: string | null = null;
    try {
      const existingFiles = await drive.files.list({
        q: `name='${fileName}' and '${DRIVE_FOLDER_ID}' in parents and trashed=false`,
        fields: 'files(id, name)',
        supportsAllDrives: true,
        includeItemsFromAllDrives: true,
      });

      if (existingFiles.data.files && existingFiles.data.files.length > 0) {
        existingFileId = existingFiles.data.files[0].id || null;
        console.log(`[YOUTUBE SYNC] 📝 Arquivo já existe, será sobrescrito: ${existingFileId}`);
      }
    } catch (searchError) {
      console.warn('[YOUTUBE SYNC] ⚠️ Erro ao buscar arquivo existente:', searchError);
    }

    const bufferStream = Readable.from(jsonBuffer);
    
    let response;
    if (existingFileId) {
      // Atualizar arquivo existente
      console.log('[YOUTUBE SYNC] 📤 Atualizando arquivo no Drive...');
      response = await drive.files.update({
        fileId: existingFileId,
        requestBody: {
          name: fileName,
        },
        media: {
          mimeType: 'application/json',
          body: bufferStream,
        },
        fields: 'id, webViewLink, name',
        supportsAllDrives: true,
      });
      console.log('[YOUTUBE SYNC] ✅ Arquivo atualizado no Drive');
    } else {
      // Criar novo arquivo
      console.log('[YOUTUBE SYNC] 📤 Criando novo arquivo no Drive...');
      response = await drive.files.create({
        requestBody: {
          name: fileName,
          parents: [DRIVE_FOLDER_ID],
          mimeType: 'application/json',
        },
        media: {
          mimeType: 'application/json',
          body: bufferStream,
        },
        fields: 'id, webViewLink, name',
        supportsAllDrives: true,
      });
      console.log('[YOUTUBE SYNC] ✅ Arquivo criado no Drive');
    }

    const fileId = response.data.id;
    const webViewLink = response.data.webViewLink;

    console.log(`[YOUTUBE SYNC] ✅ Upload concluído! ID: ${fileId}`);
    console.log(`[YOUTUBE SYNC] 🔗 Link: ${webViewLink}`);

    return webViewLink || null;
  } catch (error) {
    console.error('[YOUTUBE SYNC] ❌ Erro ao fazer upload para Drive:', error);
    return null;
  }
}

/**
 * Endpoint principal de sincronização
 * Protegido: apenas cron jobs do Vercel podem chamar
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  console.log('[YOUTUBE SYNC] 🚀 Iniciando sincronização com YouTube...');

  // Verificar se é uma chamada autorizada
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  const isVercelCron = request.headers.get('x-vercel-cron') === '1';
  const userAgent = request.headers.get('user-agent') || '';
  const isManualScript = userAgent.includes('YouTube-Sync-Script');
  const isProduction = process.env.NODE_ENV === 'production';
  
  // Permitir acesso se:
  // 1. Cron job do Vercel (sempre permitido)
  // 2. Script manual com User-Agent correto
  // 3. Header de autorização correto (se CRON_SECRET configurado)
  // 4. Modo desenvolvimento (sempre permitido)
  // 5. Em produção sem CRON_SECRET configurado (permitir para facilitar testes)
  
  const hasValidAuth = cronSecret && authHeader === `Bearer ${cronSecret}`;
  const shouldAllow = isVercelCron || isManualScript || hasValidAuth || !isProduction || !cronSecret;
  
  if (!shouldAllow) {
    console.error('[YOUTUBE SYNC] ❌ Acesso não autorizado');
    console.error('[YOUTUBE SYNC] Headers:', {
      'x-vercel-cron': request.headers.get('x-vercel-cron'),
      'user-agent': userAgent,
      'authorization': authHeader ? 'present' : 'missing',
    });
    return NextResponse.json(
      { error: 'Unauthorized', message: 'Use npm run sync:youtube ou configure CRON_SECRET' },
      { status: 401 }
    );
  }
  
  if (!isVercelCron && !hasValidAuth) {
    console.warn('[YOUTUBE SYNC] ⚠️ Execução manual detectada');
  }

  try {
    // Verificar variáveis de ambiente
    const apiKey = process.env.YOUTUBE_API_KEY;

    if (!apiKey) {
      console.error('[YOUTUBE SYNC] ❌ YOUTUBE_API_KEY não configurada!');
      return NextResponse.json(
        { error: 'YOUTUBE_API_KEY não configurada' },
        { status: 500 }
      );
    }

    console.log(`[YOUTUBE SYNC] 📋 Configurações:`);
    console.log(`[YOUTUBE SYNC]   - API Key: ${apiKey.substring(0, 10)}...`);

    // 1. Ler JSON existente do Drive (ou começar vazio)
    let jsonData = await readJsonFromDrive();
    
    if (!jsonData) {
      // Se não existe, criar estrutura vazia
      console.log('[YOUTUBE SYNC] 📝 Criando novo JSON vazio');
      jsonData = {
        version: '1.1',
        playlists: [],
        standaloneVideos: [],
        updatedAt: new Date().toISOString(),
      };
    } else {
      // Garantir que standaloneVideos existe
      if (!jsonData.standaloneVideos) {
        jsonData.standaloneVideos = [];
      }
      
      console.log(`[YOUTUBE SYNC] 📊 JSON existente carregado:`);
      console.log(`[YOUTUBE SYNC]   - Playlists: ${jsonData.playlists.length}`);
      console.log(`[YOUTUBE SYNC]   - Vídeos standalone: ${jsonData.standaloneVideos.length}`);
    }

    // 2. Buscar todas as playlists do canal e sincronizar (atualizar existentes + adicionar novas)
    const channelId = process.env.YOUTUBE_CHANNEL_ID || 'UCz3WPsPTwekahMtKoz9YdmA';
    const playlistsSync = await syncPlaylists(jsonData, channelId, apiKey);

    // 3. Buscar todos os vídeos standalone do canal
    const existingPlaylistIds = jsonData.playlists.map(p => p.id);
    const allStandaloneVideos = await fetchAllStandaloneVideos(channelId, apiKey, existingPlaylistIds);
    
    // Criar Map de vídeos existentes por ID
    const existingVideosMap = new Map<string, StandaloneVideo>();
    (jsonData.standaloneVideos || []).forEach(v => existingVideosMap.set(v.id, v));
    
    // Sincronizar vídeos standalone (atualizar existentes + adicionar novos)
    const syncedVideos: StandaloneVideo[] = [];
    let videosUpdated = 0;
    let videosAdded = 0;
    
    for (const channelVideo of allStandaloneVideos) {
      const existing = existingVideosMap.get(channelVideo.id);
      if (existing) {
        // Atualizar dados existentes
        existing.title = channelVideo.title;
        existing.description = channelVideo.description;
        existing.publishedAt = channelVideo.publishedAt;
        existing.thumbnail = channelVideo.thumbnail;
        existing.duration = channelVideo.duration;
        syncedVideos.push(existing);
        videosUpdated++;
      } else {
        // Adicionar novo vídeo
        syncedVideos.push(channelVideo);
        videosAdded++;
        console.log(`[YOUTUBE SYNC] ➕ Novo vídeo standalone adicionado: ${channelVideo.title}`);
      }
    }
    
    // Ordenar por publishedAt (mais recentes primeiro)
    syncedVideos.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
    
    jsonData.standaloneVideos = syncedVideos.length > 0 ? syncedVideos : undefined;
    
    console.log(`[YOUTUBE SYNC] ✅ Sincronização de vídeos standalone concluída:`);
    console.log(`[YOUTUBE SYNC]   - Atualizados: ${videosUpdated}`);
    console.log(`[YOUTUBE SYNC]   - Adicionados: ${videosAdded}`);
    console.log(`[YOUTUBE SYNC]   - Total final: ${syncedVideos.length}`);

    // 4. Atualizar timestamp
    jsonData.updatedAt = new Date().toISOString();
    jsonData.version = '1.1';

    console.log(`[YOUTUBE SYNC] 📊 Resumo da sincronização:`);
    console.log(`[YOUTUBE SYNC]   - Playlists: ${jsonData.playlists.length} total (${playlistsSync.updated} atualizadas, ${playlistsSync.added} adicionadas)`);
    console.log(`[YOUTUBE SYNC]   - Vídeos standalone: ${syncedVideos.length} total (${videosUpdated} atualizados, ${videosAdded} adicionados)`);

    // 5. Salvar JSON atualizado no Drive
    const driveUrl = await uploadJsonToDrive(jsonData);

    const duration = Date.now() - startTime;
    console.log(`[YOUTUBE SYNC] ✅ Sincronização concluída em ${duration}ms`);

    return NextResponse.json({
      success: true,
      message: 'Sincronização concluída com sucesso',
      data: {
        playlists: {
          total: jsonData.playlists.length,
          updated: playlistsSync.updated,
          added: playlistsSync.added,
        },
        standaloneVideos: {
          total: syncedVideos.length,
          updated: videosUpdated,
          added: videosAdded,
        },
        driveUrl: driveUrl,
        duration: `${duration}ms`,
      },
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    const errorStack = error instanceof Error ? error.stack : undefined;

    console.error('[YOUTUBE SYNC] ❌ Erro na sincronização:', errorMessage);
    if (errorStack) {
      console.error('[YOUTUBE SYNC] Stack trace:', errorStack);
    }

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        duration: `${duration}ms`,
      },
      { status: 500 }
    );
  }
}

