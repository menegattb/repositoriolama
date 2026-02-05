/**
 * API Route: Áudios do YouTube
 * Lista arquivos de áudio correspondentes aos vídeos do YouTube
 * 
 * Endpoint: GET /api/drive/audio/youtube
 * Query params:
 *   - folder: número da pasta (1, 2, 3...)
 *   - playlistId: ID da playlist do YouTube (busca no catálogo)
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  isAudioDriveConfigured, 
  getAudioFolderIds,
  listAudioFiles,
  listSubfolders,
  findFileByName,
  fetchJsonFromDrive,
  AudioFile
} from '@/lib/audioDriveAuth';

export const dynamic = 'force-dynamic';

// Cache para mapeamento de pastas
let folderMapCache: Map<string, string> | null = null;
let folderMapTimestamp = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

interface FolderInfo {
  id: string;
  name: string;
}

/**
 * Carrega o mapeamento de pastas (playlistId -> folderId)
 */
async function loadFolderMap(): Promise<Map<string, string>> {
  const now = Date.now();
  
  if (folderMapCache && (now - folderMapTimestamp) < CACHE_TTL) {
    return folderMapCache;
  }

  const folderIds = getAudioFolderIds();
  const map = new Map<string, string>();

  if (!folderIds.youtube) {
    return map;
  }

  // Listar todas as subpastas de audios-youtube
  const subfolders = await listSubfolders(folderIds.youtube);

  for (const folder of subfolders) {
    // A pasta pode ter o nome como número (1, 2, 3) ou como playlistId
    map.set(folder.name, folder.id);
  }

  // Tentar carregar o catálogo para mapeamento adicional
  try {
    const catalogFileId = await findFileByName(folderIds.root, 'audio_catalog.json');
    if (catalogFileId) {
      const catalog = await fetchJsonFromDrive<Record<string, { folderId?: string; playlistId?: string }>>(catalogFileId);
      
      for (const [key, value] of Object.entries(catalog)) {
        if (value.playlistId && value.folderId) {
          map.set(value.playlistId, value.folderId);
        }
        if (value.folderId) {
          map.set(key, value.folderId);
        }
      }
    }
  } catch (e) {
    console.log('[Audio YouTube] Catálogo não encontrado, usando apenas nomes de pastas');
  }

  folderMapCache = map;
  folderMapTimestamp = now;

  return map;
}

export async function GET(request: NextRequest) {
  try {
    // Verificar configuração
    if (!isAudioDriveConfigured()) {
      return NextResponse.json({
        success: false,
        error: 'Audio Drive não configurado. Acesse /api/auth/audio-drive para autenticar.',
      }, { status: 503 });
    }

    const searchParams = request.nextUrl.searchParams;
    const folder = searchParams.get('folder');
    const playlistId = searchParams.get('playlistId');

    const folderIds = getAudioFolderIds();

    if (!folderIds.youtube) {
      return NextResponse.json({
        success: false,
        error: 'AUDIO_DRIVE_YOUTUBE_FOLDER_ID não configurado',
      }, { status: 400 });
    }

    let targetFolderId: string | null = null;
    let targetFolderName: string = '';

    // Se nenhum parâmetro foi passado, listar todas as subpastas com contagem de áudios
    if (!folder && !playlistId) {
      const subfolders = await listSubfolders(folderIds.youtube);
      
      // Contar áudios em cada pasta (em paralelo para performance)
      const foldersWithCount = await Promise.all(
        subfolders.map(async (subfolder) => {
          try {
            const audios = await listAudioFiles(subfolder.id);
            return {
              ...subfolder,
              audioCount: audios.length,
            };
          } catch {
            return {
              ...subfolder,
              audioCount: 0,
            };
          }
        })
      );
      
      // Filtrar apenas pastas que têm áudios
      const foldersWithAudios = foldersWithCount.filter(f => f.audioCount > 0);
      
      return NextResponse.json({
        success: true,
        folders: foldersWithAudios,
        totalFolders: subfolders.length,
        foldersWithAudios: foldersWithAudios.length,
        message: 'Use ?folder=<nome> ou ?playlistId=<id> para listar áudios de uma pasta específica',
      });
    }

    // Carregar mapeamento de pastas
    const folderMap = await loadFolderMap();

    // Buscar por playlistId primeiro
    if (playlistId) {
      targetFolderId = folderMap.get(playlistId) || null;
      targetFolderName = playlistId;
    }

    // Buscar por nome de pasta
    if (!targetFolderId && folder) {
      targetFolderId = folderMap.get(folder) || null;
      targetFolderName = folder;

      // Se não encontrou no mapeamento, buscar diretamente nas subpastas
      if (!targetFolderId) {
        const subfolders = await listSubfolders(folderIds.youtube);
        const matchingFolder = subfolders.find(f => f.name === folder || f.name === folder.toString());
        
        if (matchingFolder) {
          targetFolderId = matchingFolder.id;
          targetFolderName = matchingFolder.name;
        }
      }
    }

    if (!targetFolderId) {
      // Retornar lista de pastas disponíveis
      const subfolders = await listSubfolders(folderIds.youtube);
      
      return NextResponse.json({
        success: false,
        error: `Pasta não encontrada: ${folder || playlistId}`,
        availableFolders: subfolders.map(f => f.name),
      }, { status: 404 });
    }

    // Listar arquivos de áudio na pasta
    const audioFiles = await listAudioFiles(targetFolderId);

    return NextResponse.json({
      success: true,
      folder: targetFolderName,
      folderId: targetFolderId,
      count: audioFiles.length,
      audios: audioFiles,
    });

  } catch (error) {
    console.error('[Audio YouTube] Erro:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    
    return NextResponse.json({
      success: false,
      error: errorMessage,
    }, { status: 500 });
  }
}
