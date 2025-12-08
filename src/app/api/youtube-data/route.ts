import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

// Usar variável de ambiente ou novo domínio padrão
const YOUTUBE_DATA_URL = process.env.HOSTINGER_API_URL 
  ? `${process.env.HOSTINGER_API_URL}/repositorio/api/youtube-data.json`
  : 'https://acaoparamita.com.br/repositorio/api/youtube-data.json';

const DRIVE_FOLDER_ID = '1SKEAfJ8oC0dOq0LGxUt6UtxQXjuvykwg';

// Cache em memória com TTL de 1 minuto (reduzido para atualizações mais rápidas)
interface CacheEntry {
  data: any;
  timestamp: number;
}

let cache: CacheEntry | null = null;
const CACHE_TTL = 1 * 60 * 1000; // 1 minuto em milissegundos

/**
 * Buscar JSON do Google Drive
 */
async function fetchJsonFromDrive(): Promise<any | null> {
  const oauthClientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const oauthClientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  const oauthRefreshToken = process.env.GOOGLE_OAUTH_REFRESH_TOKEN;

  if (!oauthClientId || !oauthClientSecret || !oauthRefreshToken) {
    console.warn('[API /api/youtube-data] ⚠️ Credenciais OAuth não configuradas para Drive');
    return null;
  }

  try {
    console.log('[API /api/youtube-data] 🔐 Autenticando com Google Drive...');
    
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
      console.warn('[API /api/youtube-data] ⚠️ Arquivo não encontrado no Drive');
      return null;
    }

    const fileId = existingFiles.data.files[0].id;
    console.log(`[API /api/youtube-data] 📖 Baixando arquivo do Drive: ${fileId}`);

    // Baixar conteúdo do arquivo
    const fileContent = await drive.files.get({
      fileId: fileId!,
      alt: 'media',
      supportsAllDrives: true,
    }, {
      responseType: 'text',
    });

    const jsonData = JSON.parse(fileContent.data as string);
    console.log(`[API /api/youtube-data] ✅ Dados carregados do Drive. Playlists: ${jsonData.playlists?.length || 0}`);
    
    return jsonData;
  } catch (error) {
    console.error('[API /api/youtube-data] ❌ Erro ao buscar do Drive:', error);
    return null;
  }
}

/**
 * API Route para buscar dados do YouTube
 * Em desenvolvimento: busca do arquivo local public/youtube-data.json
 * Em produção: busca do Google Drive primeiro, fallback para Hostinger
 * 
 * Parâmetros de query:
 * - refresh=true: força busca do Drive ignorando cache
 */
export async function GET(request: NextRequest) {
  try {
    // Verificar se é para forçar refresh (ignorar cache)
    const url = new URL(request.url);
    const forceRefresh = url.searchParams.get('refresh') === 'true';
    
    if (forceRefresh) {
      console.log('[API /api/youtube-data] 🔄 Refresh forçado - ignorando cache');
    }
    
    // Em desenvolvimento, tentar buscar do arquivo local primeiro
    if (process.env.NODE_ENV === 'development') {
      const localFilePath = join(process.cwd(), 'public', 'youtube-data.json');
      
      if (existsSync(localFilePath)) {
        console.log('[API /api/youtube-data] 📁 Buscando dados do arquivo local:', localFilePath);
        const fileContent = await readFile(localFilePath, 'utf-8');
        const data = JSON.parse(fileContent);
        console.log('[API /api/youtube-data] ✅ Dados carregados localmente. Playlists:', data.playlists?.length || 0);
        
        return NextResponse.json(data, {
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET',
            'Cache-Control': 'no-store', // Sem cache em desenvolvimento
          },
        });
      } else {
        console.warn('[API /api/youtube-data] ⚠️ Arquivo local não encontrado, buscando do Drive...');
      }
    }
    
    const now = Date.now();
    
    // Verificar cache APENAS se não for refresh forçado
    if (!forceRefresh && cache && (now - cache.timestamp) < CACHE_TTL) {
      console.log('[API /api/youtube-data] 💾 Retornando dados do cache');
      return NextResponse.json(cache.data, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET',
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120', // 1 minuto
        },
      });
    }
    
    // Em produção, tentar buscar do Google Drive primeiro
    if (process.env.NODE_ENV === 'production') {
      console.log('[API /api/youtube-data] 🔐 Tentando buscar do Google Drive...');
      const driveData = await fetchJsonFromDrive();
      
      if (driveData) {
        // Atualizar cache
        cache = {
          data: driveData,
          timestamp: now,
        };
        
        console.log(`[API /api/youtube-data] ✅ Dados atualizados do Drive. Playlists: ${driveData.playlists?.length || 0}`);
        
        return NextResponse.json(driveData, {
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET',
            'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120', // 1 minuto
          },
        });
      } else {
        console.warn('[API /api/youtube-data] ⚠️ Falha ao buscar do Drive, usando fallback Hostinger...');
      }
    }
    
    // Fallback: buscar da Hostinger
    console.log('[API /api/youtube-data] 🌐 Buscando dados de:', YOUTUBE_DATA_URL);
    
    const response = await fetch(YOUTUBE_DATA_URL, {
      cache: 'no-store',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('[API /api/youtube-data] ❌ Erro ao buscar da Hostinger:', response.status);
      
      // Se estiver em produção e Drive falhou, retornar erro mais específico
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json(
          { 
            error: 'Failed to fetch YouTube data',
            message: 'Both Google Drive and Hostinger sources failed',
            status: response.status 
          },
          { status: 503 }
        );
      }
      
      return NextResponse.json(
        { error: `Failed to fetch: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('[API /api/youtube-data] ✅ Dados recebidos da Hostinger. Playlists:', data.playlists?.length || 0);
    
    // Atualizar cache
    cache = {
      data: data,
      timestamp: now,
    };
    
    // Atualizar cache
    cache = {
      data: data,
      timestamp: now,
    };
    
    // Retornar os dados com headers CORS adequados
    return NextResponse.json(data, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120', // 1 minuto
      },
    });
  } catch (error) {
    console.error('[API /api/youtube-data] ❌ Erro:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

