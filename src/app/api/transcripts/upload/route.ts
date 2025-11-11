import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

/**
 * API Route para receber e salvar arquivos de transcrição via POST
 * Endpoint: POST /api/transcripts/upload
 * 
 * Body JSON:
 * {
 *   playlistId: string,
 *   videoId: string,
 *   content: string (conteúdo SRT)
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { playlistId, videoId, content } = body;

    // Validação
    if (!playlistId || !videoId || !content) {
      return NextResponse.json(
        {
          success: false,
          error: 'playlistId, videoId e content são obrigatórios'
        },
        { status: 400 }
      );
    }

    // Definir estrutura de pastas: public/transcripts/{playlistId}/{videoId}.srt
    const playlistFolder = playlistId || 'standalone';
    const transcriptDir = path.join(process.cwd(), 'public', 'transcripts', playlistFolder);
    const transcriptFilePath = path.join(transcriptDir, `${videoId}.srt`);

    try {
      // Criar diretório se não existir
      await fs.mkdir(transcriptDir, { recursive: true });

      // Salvar arquivo
      await fs.writeFile(transcriptFilePath, content, 'utf-8');

      if (process.env.NODE_ENV === 'development') {
        console.log(`[UPLOAD API] Arquivo salvo: ${transcriptFilePath}`);
      }

      return NextResponse.json({
        success: true,
        message: 'Transcrição salva com sucesso',
        path: `/transcripts/${playlistFolder}/${videoId}.srt`,
        filePath: transcriptFilePath
      });
    } catch (fileError) {
      const errorMessage = fileError instanceof Error ? fileError.message : 'Erro desconhecido';
      console.error('[UPLOAD API ERROR] Erro ao salvar arquivo:', errorMessage);
      
      return NextResponse.json(
        {
          success: false,
          error: 'Erro ao salvar arquivo',
          details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
        },
        { status: 500 }
      );
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('[UPLOAD API ERROR] Erro ao processar requisição:', errorMessage);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao processar requisição',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    );
  }
}

// Handler para métodos não permitidos
export async function GET() {
  return NextResponse.json(
    { error: 'Método não permitido. Use POST.' },
    { status: 405 }
  );
}

