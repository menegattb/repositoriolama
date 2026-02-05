/**
 * API Route: Streaming de Áudio
 * Faz streaming de arquivos de áudio do Google Drive
 * Suporta Range requests para seek no player
 * 
 * Endpoint: GET /api/drive/audio/stream/[fileId]
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  isAudioDriveConfigured, 
  getFileMetadata,
  getFileStream,
  getFilePartial
} from '@/lib/audioDriveAuth';

export const dynamic = 'force-dynamic';

// Tamanho do chunk para streaming (1MB)
const CHUNK_SIZE = 1024 * 1024;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
  try {
    const { fileId } = await params;

    // Verificar configuração
    if (!isAudioDriveConfigured()) {
      return NextResponse.json({
        success: false,
        error: 'Audio Drive não configurado',
      }, { status: 503 });
    }

    if (!fileId) {
      return NextResponse.json({
        success: false,
        error: 'fileId é obrigatório',
      }, { status: 400 });
    }

    // Obter metadados do arquivo
    const metadata = await getFileMetadata(fileId);
    const { name, mimeType, size } = metadata;

    // Verificar se há Range header
    const rangeHeader = request.headers.get('range');

    if (rangeHeader) {
      // Parse do Range header (ex: "bytes=0-1023")
      const match = rangeHeader.match(/bytes=(\d*)-(\d*)/);
      
      if (match) {
        const start = match[1] ? parseInt(match[1], 10) : 0;
        const requestedEnd = match[2] ? parseInt(match[2], 10) : size - 1;
        
        // Limitar o tamanho do chunk
        const end = Math.min(requestedEnd, start + CHUNK_SIZE - 1, size - 1);
        const contentLength = end - start + 1;

        // Buscar conteúdo parcial
        const { buffer } = await getFilePartial(fileId, start, end);

        return new NextResponse(new Uint8Array(buffer), {
          status: 206,
          headers: {
            'Content-Type': mimeType,
            'Content-Length': contentLength.toString(),
            'Content-Range': `bytes ${start}-${end}/${size}`,
            'Accept-Ranges': 'bytes',
            'Content-Disposition': `inline; filename="${encodeURIComponent(name)}"`,
            'Cache-Control': 'public, max-age=3600',
          },
        });
      }
    }

    // Se não há Range header, fazer streaming completo
    // Para arquivos grandes, retornar apenas os primeiros bytes para iniciar rápido
    if (size > CHUNK_SIZE * 2) {
      // Arquivo grande: retornar resposta com Accept-Ranges para indicar suporte
      const { buffer } = await getFilePartial(fileId, 0, CHUNK_SIZE - 1);
      
      return new NextResponse(new Uint8Array(buffer), {
        status: 206,
        headers: {
          'Content-Type': mimeType,
          'Content-Length': CHUNK_SIZE.toString(),
          'Content-Range': `bytes 0-${CHUNK_SIZE - 1}/${size}`,
          'Accept-Ranges': 'bytes',
          'Content-Disposition': `inline; filename="${encodeURIComponent(name)}"`,
          'Cache-Control': 'public, max-age=3600',
        },
      });
    }

    // Arquivo pequeno: retornar completo
    const { stream } = await getFileStream(fileId);
    
    // Converter stream para ReadableStream do Web API
    const chunks: Buffer[] = [];
    
    for await (const chunk of stream) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    
    const buffer = Buffer.concat(chunks);

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': mimeType,
        'Content-Length': size.toString(),
        'Accept-Ranges': 'bytes',
        'Content-Disposition': `inline; filename="${encodeURIComponent(name)}"`,
        'Cache-Control': 'public, max-age=3600',
      },
    });

  } catch (error) {
    console.error('[Audio Stream] Erro:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    
    // Se for erro 404 do Google Drive
    if (errorMessage.includes('File not found') || errorMessage.includes('404')) {
      return NextResponse.json({
        success: false,
        error: 'Arquivo não encontrado',
      }, { status: 404 });
    }
    
    return NextResponse.json({
      success: false,
      error: errorMessage,
    }, { status: 500 });
  }
}

/**
 * HEAD request para obter metadados sem baixar o arquivo
 */
export async function HEAD(
  request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
  try {
    const { fileId } = await params;

    if (!isAudioDriveConfigured()) {
      return new NextResponse(null, { status: 503 });
    }

    if (!fileId) {
      return new NextResponse(null, { status: 400 });
    }

    const metadata = await getFileMetadata(fileId);

    return new NextResponse(null, {
      status: 200,
      headers: {
        'Content-Type': metadata.mimeType,
        'Content-Length': metadata.size.toString(),
        'Accept-Ranges': 'bytes',
        'Content-Disposition': `inline; filename="${encodeURIComponent(metadata.name)}"`,
      },
    });

  } catch (error) {
    console.error('[Audio Stream HEAD] Erro:', error);
    return new NextResponse(null, { status: 500 });
  }
}
