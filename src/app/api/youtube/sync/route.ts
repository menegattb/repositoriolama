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
}

interface YouTubeDataResponse {
  version: string;
  generatedAt: string;
  playlists: YouTubePlaylist[];
  standaloneVideos?: StandaloneVideo[];
  updatedAt: string;
}

/**
 * Buscar todas as playlists de um canal do YouTube
 */
async function fetchChannelPlaylists(channelId: string, apiKey: string): Promise<YouTubePlaylist[]> {
  const playlists: YouTubePlaylist[] = [];
  let nextPageToken = '';

  console.log(`[YOUTUBE SYNC] 🔍 Buscando playlists do canal: ${channelId}`);

  do {
    try {
      const url = `https://www.googleapis.com/youtube/v3/playlists?part=snippet,contentDetails&channelId=${channelId}&maxResults=50&key=${apiKey}${nextPageToken ? `&pageToken=${nextPageToken}` : ''}`;
      
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[YOUTUBE SYNC] ❌ Erro ao buscar playlists: ${response.status}`, errorText.substring(0, 500));
        throw new Error(`YouTube API error: ${response.status}`);
      }

      const data = await response.json();

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
      throw error;
    }
  } while (nextPageToken);

  console.log(`[YOUTUBE SYNC] ✅ Total de playlists encontradas: ${playlists.length}`);
  return playlists;
}

/**
 * Buscar vídeos standalone (não em playlists) de um canal
 * Nota: Esta função busca vídeos recentes do canal e verifica se estão em playlists.
 * Por limitações da API, pode não capturar todos os vídeos standalone antigos.
 */
async function fetchStandaloneVideos(channelId: string, apiKey: string, playlistIds: string[]): Promise<StandaloneVideo[]> {
  const standaloneVideos: StandaloneVideo[] = [];
  let nextPageToken = '';
  const maxVideosToCheck = 200; // Limitar para evitar timeout
  let videosChecked = 0;

  console.log(`[YOUTUBE SYNC] 🔍 Buscando vídeos standalone do canal: ${channelId}`);

  // Buscar todos os vídeos de todas as playlists para criar um Set de vídeos que estão em playlists
  const videosInPlaylists = new Set<string>();
  console.log(`[YOUTUBE SYNC] 📋 Coletando vídeos de ${playlistIds.length} playlists...`);
  
  for (const playlistId of playlistIds) {
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
  
  console.log(`[YOUTUBE SYNC] ✅ Encontrados ${videosInPlaylists.size} vídeos em playlists`);

  // Buscar vídeos recentes do canal
  do {
    try {
      if (videosChecked >= maxVideosToCheck) {
        console.log(`[YOUTUBE SYNC] ⚠️ Limite de ${maxVideosToCheck} vídeos atingido`);
        break;
      }

      const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&type=video&maxResults=50&order=date&key=${apiKey}${nextPageToken ? `&pageToken=${nextPageToken}` : ''}`;
      
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[YOUTUBE SYNC] ❌ Erro ao buscar vídeos: ${response.status}`, errorText.substring(0, 500));
        break; // Não crítico, continuar
      }

      const data = await response.json();

      if (data.items && data.items.length > 0) {
        for (const item of data.items) {
          const videoId = item.id.videoId;
          videosChecked++;
          
          // Se o vídeo não está em nenhuma playlist conhecida, é standalone
          if (!videosInPlaylists.has(videoId)) {
            standaloneVideos.push({
              id: videoId,
              title: item.snippet.title,
              description: item.snippet.description || '',
              publishedAt: item.snippet.publishedAt,
              thumbnail: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.default?.url,
            });
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
      // Continuar mesmo com erro (não crítico)
      break;
    }
  } while (nextPageToken && videosChecked < maxVideosToCheck);

  console.log(`[YOUTUBE SYNC] ✅ Total de vídeos standalone encontrados: ${standaloneVideos.length}`);
  return standaloneVideos;
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

  // Verificar se é uma chamada autorizada (cron job do Vercel ou header de autorização)
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  const isVercelCron = request.headers.get('x-vercel-cron') === '1';
  const userAgent = request.headers.get('user-agent') || '';
  const isManualScript = userAgent.includes('YouTube-Sync-Script');
  
  // Permitir se for:
  // 1. Cron job do Vercel
  // 2. Script manual (desenvolvimento)
  // 3. Header de autorização correto
  // 4. Modo desenvolvimento
  if (!isVercelCron && !isManualScript && (!cronSecret || authHeader !== `Bearer ${cronSecret}`)) {
    // Em desenvolvimento, permitir sem autenticação
    if (process.env.NODE_ENV === 'development') {
      console.warn('[YOUTUBE SYNC] ⚠️ Modo desenvolvimento: autenticação ignorada');
    } else {
      console.error('[YOUTUBE SYNC] ❌ Acesso não autorizado');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
  }

  try {
    // Verificar variáveis de ambiente
    const apiKey = process.env.YOUTUBE_API_KEY;
    const channelId = process.env.YOUTUBE_CHANNEL_ID;

    if (!apiKey) {
      console.error('[YOUTUBE SYNC] ❌ YOUTUBE_API_KEY não configurada!');
      return NextResponse.json(
        { error: 'YOUTUBE_API_KEY não configurada' },
        { status: 500 }
      );
    }

    if (!channelId) {
      console.error('[YOUTUBE SYNC] ❌ YOUTUBE_CHANNEL_ID não configurada!');
      return NextResponse.json(
        { error: 'YOUTUBE_CHANNEL_ID não configurada' },
        { status: 500 }
      );
    }

    console.log(`[YOUTUBE SYNC] 📋 Configurações:`);
    console.log(`[YOUTUBE SYNC]   - Channel ID: ${channelId}`);
    console.log(`[YOUTUBE SYNC]   - API Key: ${apiKey.substring(0, 10)}...`);

    // Buscar playlists
    const playlists = await fetchChannelPlaylists(channelId, apiKey);

    // Buscar vídeos standalone
    const playlistIds = playlists.map(p => p.id);
    const standaloneVideos = await fetchStandaloneVideos(channelId, apiKey, playlistIds);

    // Gerar JSON estruturado
    const now = new Date();
    const jsonData: YouTubeDataResponse = {
      version: '1.1',
      generatedAt: now.toISOString(),
      playlists: playlists,
      standaloneVideos: standaloneVideos.length > 0 ? standaloneVideos : undefined,
      updatedAt: now.toISOString(),
    };

    console.log(`[YOUTUBE SYNC] 📊 Dados coletados:`);
    console.log(`[YOUTUBE SYNC]   - Playlists: ${playlists.length}`);
    console.log(`[YOUTUBE SYNC]   - Vídeos standalone: ${standaloneVideos.length}`);

    // Fazer upload para Google Drive
    const driveUrl = await uploadJsonToDrive(jsonData);

    const duration = Date.now() - startTime;
    console.log(`[YOUTUBE SYNC] ✅ Sincronização concluída em ${duration}ms`);

    return NextResponse.json({
      success: true,
      message: 'Sincronização concluída com sucesso',
      data: {
        playlists: playlists.length,
        standaloneVideos: standaloneVideos.length,
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

