import { NextRequest, NextResponse } from 'next/server';
import { readdir, stat } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

const AUDIO_LOCAL_PATH = process.env.AUDIO_LOCAL_PATH || '/Users/bno/Documents/downloadYOUTUBE/downloads/audio';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ playlistId: string }> }
) {
  const { playlistId } = await params;

  try {
    console.log(`[API /api/audio/list] Buscando áudios para playlist: ${playlistId}`);
    console.log(`[API /api/audio/list] AUDIO_LOCAL_PATH: ${AUDIO_LOCAL_PATH}`);
    
    // Construir caminho da pasta da playlist
    const playlistPath = join(AUDIO_LOCAL_PATH, playlistId);
    console.log(`[API /api/audio/list] Caminho completo: ${playlistPath}`);

    // Verificar se a pasta existe
    if (!existsSync(playlistPath)) {
      console.log(`[API /api/audio/list] ❌ Pasta não encontrada: ${playlistPath}`);
      
      // Tentar listar todas as pastas disponíveis para debug
      try {
        const allFolders = await readdir(AUDIO_LOCAL_PATH, { withFileTypes: true });
        const folderNames = allFolders
          .filter(dirent => dirent.isDirectory())
          .map(dirent => dirent.name)
          .filter(name => name.startsWith('PLO_'))
          .slice(0, 10);
        console.log(`[API /api/audio/list] 📁 Primeiras 10 pastas disponíveis:`, folderNames);
        console.log(`[API /api/audio/list] 🔍 Procurando por playlistId: ${playlistId}`);
        
        // Verificar se há alguma pasta que contenha parte do playlistId
        const matchingFolder = allFolders
          .filter(dirent => dirent.isDirectory())
          .find(dirent => dirent.name === playlistId || dirent.name.includes(playlistId) || playlistId.includes(dirent.name));
        
        if (matchingFolder) {
          console.log(`[API /api/audio/list] ✅ Encontrada pasta similar: ${matchingFolder.name}`);
          const correctedPath = join(AUDIO_LOCAL_PATH, matchingFolder.name);
          if (existsSync(correctedPath)) {
            // Usar a pasta corrigida
            const files = await readdir(correctedPath);
            const audioFiles = await Promise.all(
              files
                .filter(file => file.endsWith('.mp3'))
                .map(async (filename) => {
                  const videoId = filename.replace('.mp3', '');
                  const filePath = join(correctedPath, filename);
                  try {
                    const stats = await stat(filePath);
                    return {
                      videoId,
                      filename,
                      url: `/api/audio/${matchingFolder.name}/${videoId}`,
                      size: stats.size,
                      exists: true,
                    };
                  } catch (error) {
                    console.error(`[API /api/audio/list] Erro ao obter stats:`, error);
                    return null;
                  }
                })
            );
            const validAudioFiles = audioFiles.filter((file): file is NonNullable<typeof file> => file !== null);
            console.log(`[API /api/audio/list] ✅ Encontrados ${validAudioFiles.length} arquivos usando pasta corrigida`);
            return NextResponse.json({ audioFiles: validAudioFiles });
          }
        }
      } catch (error) {
        console.error(`[API /api/audio/list] Erro ao listar pastas:`, error);
      }
      
      return NextResponse.json({ audioFiles: [] });
    }
    
    console.log(`[API /api/audio/list] ✅ Pasta encontrada: ${playlistPath}`);

    // Listar arquivos na pasta
    const files = await readdir(playlistPath);
    
    // Filtrar apenas arquivos .mp3 e extrair videoId
    const audioFiles = await Promise.all(
      files
        .filter(file => file.endsWith('.mp3'))
        .map(async (filename) => {
          const videoId = filename.replace('.mp3', '');
          const filePath = join(playlistPath, filename);
          
          try {
            const stats = await stat(filePath);
            
            return {
              videoId,
              filename,
              url: `/api/audio/${playlistId}/${videoId}`,
              size: stats.size,
              exists: true,
            };
          } catch (error) {
            console.error(`[API /api/audio/list] Erro ao obter stats do arquivo ${filename}:`, error);
            return null;
          }
        })
    );

    // Filtrar nulls (erros)
    const validAudioFiles = audioFiles.filter((file): file is NonNullable<typeof file> => file !== null);

    console.log(`[API /api/audio/list] Encontrados ${validAudioFiles.length} arquivos de áudio para playlist ${playlistId}`);
    
    return NextResponse.json({ audioFiles: validAudioFiles });
  } catch (error) {
    console.error('[API /api/audio/list] Erro ao listar áudios:', error);
    return NextResponse.json(
      { error: 'Erro ao listar áudios', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

