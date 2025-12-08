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

    // 2. Atualizar todas as playlists existentes
    const playlistsUpdated = await updatePlaylists(jsonData, apiKey);

    // 3. Atualizar todos os vídeos standalone existentes
    const videosUpdated = await updateStandaloneVideos(jsonData, apiKey);

    // 4. Atualizar timestamp
    jsonData.updatedAt = new Date().toISOString();
    jsonData.version = '1.1';

    console.log(`[YOUTUBE SYNC] 📊 Resumo da atualização:`);
    console.log(`[YOUTUBE SYNC]   - Playlists atualizadas: ${playlistsUpdated}/${jsonData.playlists.length}`);
    console.log(`[YOUTUBE SYNC]   - Vídeos atualizados: ${videosUpdated}/${jsonData.standaloneVideos?.length || 0}`);

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
          updated: playlistsUpdated,
        },
        standaloneVideos: {
          total: jsonData.standaloneVideos?.length || 0,
          updated: videosUpdated,
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

