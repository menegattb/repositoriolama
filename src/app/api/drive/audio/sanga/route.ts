/**
 * API Route: Áudios da Sanga
 * Lista arquivos de áudio exclusivos (não correspondem ao YouTube)
 * 
 * Endpoint: GET /api/drive/audio/sanga
 * Query params:
 *   - folder: nome da pasta para listar arquivos
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  isAudioDriveConfigured, 
  getAudioFolderIds,
  listAudioFiles,
  listSubfolders
} from '@/lib/audioDriveAuth';

export const dynamic = 'force-dynamic';

interface FolderWithAudios {
  id: string;
  name: string;
  audioCount?: number;
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
    const folderName = searchParams.get('folder');

    const folderIds = getAudioFolderIds();

    if (!folderIds.sanga) {
      return NextResponse.json({
        success: false,
        error: 'AUDIO_DRIVE_SANGA_FOLDER_ID não configurado',
      }, { status: 400 });
    }

    // Se nenhuma pasta específica foi solicitada, listar todas as pastas
    if (!folderName) {
      const subfolders = await listSubfolders(folderIds.sanga);
      
      // Opcionalmente, contar arquivos em cada pasta (pode ser lento)
      const foldersWithCount: FolderWithAudios[] = await Promise.all(
        subfolders.map(async (folder) => {
          try {
            const files = await listAudioFiles(folder.id);
            return {
              id: folder.id,
              name: folder.name,
              audioCount: files.length,
            };
          } catch {
            return {
              id: folder.id,
              name: folder.name,
              audioCount: 0,
            };
          }
        })
      );

      // Também listar arquivos diretamente na pasta raiz
      const rootAudios = await listAudioFiles(folderIds.sanga);

      return NextResponse.json({
        success: true,
        folders: foldersWithCount,
        rootAudios: rootAudios,
        rootAudioCount: rootAudios.length,
      });
    }

    // Buscar pasta específica
    const subfolders = await listSubfolders(folderIds.sanga);
    const targetFolder = subfolders.find(
      f => f.name.toLowerCase() === folderName.toLowerCase() || f.id === folderName
    );

    if (!targetFolder) {
      return NextResponse.json({
        success: false,
        error: `Pasta não encontrada: ${folderName}`,
        availableFolders: subfolders.map(f => f.name),
      }, { status: 404 });
    }

    // Listar arquivos de áudio na pasta
    const audioFiles = await listAudioFiles(targetFolder.id);

    // Também verificar subpastas dentro desta pasta
    const nestedSubfolders = await listSubfolders(targetFolder.id);

    return NextResponse.json({
      success: true,
      folder: targetFolder.name,
      folderId: targetFolder.id,
      count: audioFiles.length,
      audios: audioFiles,
      subfolders: nestedSubfolders,
    });

  } catch (error) {
    console.error('[Audio Sanga] Erro:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    
    return NextResponse.json({
      success: false,
      error: errorMessage,
    }, { status: 500 });
  }
}
