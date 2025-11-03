import { NextRequest, NextResponse } from 'next/server';
import { createReadStream, existsSync, statSync } from 'fs';
import { join } from 'path';

const AUDIO_LOCAL_PATH = process.env.AUDIO_LOCAL_PATH || '/Users/bno/Documents/downloadYOUTUBE/downloads/audio';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ playlistId: string; videoId: string }> }
) {
  const { playlistId, videoId } = await params;

  try {
    // Sanitizar para evitar path traversal
    if (playlistId.includes('..') || videoId.includes('..')) {
      return NextResponse.json(
        { error: 'Invalid path' },
        { status: 400 }
      );
    }

    const filePath = join(AUDIO_LOCAL_PATH, playlistId, `${videoId}.mp3`);

    // Verificar se arquivo existe
    if (!existsSync(filePath)) {
      console.error(`[API /api/audio] Arquivo não encontrado: ${filePath}`);
      return NextResponse.json(
        { error: 'Arquivo de áudio não encontrado' },
        { status: 404 }
      );
    }

    const stats = statSync(filePath);
    const fileSize = stats.size;
    const range = request.headers.get('range');

    // Suporte a Range requests para navegação no áudio
    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = (end - start) + 1;
      
      if (start >= fileSize || end >= fileSize) {
        return NextResponse.json(
          { error: 'Range not satisfiable' },
          { status: 416 }
        );
      }

      const file = createReadStream(filePath, { start, end });
      const head = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize.toString(),
        'Content-Type': 'audio/mpeg',
      };

      return new NextResponse(file as any, {
        status: 206,
        headers: head,
      });
    }

    // Servir arquivo completo
    const file = createReadStream(filePath);
    const head = {
      'Content-Length': fileSize.toString(),
      'Content-Type': 'audio/mpeg',
      'Accept-Ranges': 'bytes',
    };

    return new NextResponse(file as any, {
      status: 200,
      headers: head,
    });
  } catch (error) {
    console.error('[API /api/audio] Erro ao servir áudio:', error);
    return NextResponse.json(
      { error: 'Erro ao servir áudio', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

