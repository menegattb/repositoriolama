/**
 * API Route: Catálogo de Áudios
 * Busca o arquivo audio_catalog.json do Google Drive
 * 
 * Endpoint: GET /api/drive/audio/catalog
 */

import { NextResponse } from 'next/server';
import { 
  isAudioDriveConfigured, 
  getAudioDriveClient, 
  getAudioFolderIds,
  findFileByName,
  fetchJsonFromDrive 
} from '@/lib/audioDriveAuth';

export const dynamic = 'force-dynamic';

// Interface para o catálogo de áudios
interface AudioCatalogEntry {
  folderId?: string;
  folderName?: string;
  playlistId?: string;
  videoId?: string;
  title?: string;
  [key: string]: unknown;
}

interface AudioCatalog {
  [key: string]: AudioCatalogEntry | AudioCatalogEntry[];
}

// Cache em memória
let catalogCache: AudioCatalog | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

export async function GET() {
  try {
    // Verificar configuração
    if (!isAudioDriveConfigured()) {
      return NextResponse.json({
        success: false,
        error: 'Audio Drive não configurado. Acesse /api/auth/audio-drive para autenticar.',
        configuredVars: {
          clientId: !!process.env.AUDIO_DRIVE_CLIENT_ID,
          clientSecret: !!process.env.AUDIO_DRIVE_CLIENT_SECRET,
          refreshToken: !!process.env.AUDIO_DRIVE_REFRESH_TOKEN,
        },
      }, { status: 503 });
    }

    // Verificar cache
    const now = Date.now();
    if (catalogCache && (now - cacheTimestamp) < CACHE_TTL) {
      return NextResponse.json({
        success: true,
        catalog: catalogCache,
        cached: true,
      });
    }

    const folderIds = getAudioFolderIds();

    if (!folderIds.root) {
      return NextResponse.json({
        success: false,
        error: 'AUDIO_DRIVE_ROOT_FOLDER_ID não configurado',
      }, { status: 400 });
    }

    // Buscar o arquivo audio_catalog.json na pasta raiz
    const catalogFileId = await findFileByName(folderIds.root, 'audio_catalog.json');

    if (!catalogFileId) {
      return NextResponse.json({
        success: false,
        error: 'Arquivo audio_catalog.json não encontrado na pasta raiz do Drive',
      }, { status: 404 });
    }

    // Buscar e parsear o conteúdo do JSON
    const catalog = await fetchJsonFromDrive<AudioCatalog>(catalogFileId);

    // Atualizar cache
    catalogCache = catalog;
    cacheTimestamp = now;

    return NextResponse.json({
      success: true,
      catalog,
      cached: false,
    });

  } catch (error) {
    console.error('[Audio Catalog] Erro:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    
    return NextResponse.json({
      success: false,
      error: errorMessage,
    }, { status: 500 });
  }
}
