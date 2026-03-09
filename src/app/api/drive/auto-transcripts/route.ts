import { NextRequest, NextResponse } from 'next/server';
import {
  fetchDriveDocxFiles,
  findTranscriptByVideoId,
} from '@/lib/driveAutoTranscripts';

// Forçar modo dinâmico para sempre buscar dados atualizados do Google Drive
export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/drive/auto-transcripts
 * Busca transcrições automáticas do Google Drive
 * 
 * Query params:
 * - videoId: (opcional) Busca transcrição específica para um vídeo
 */
export async function GET(request: NextRequest) {
  try {
    const apiKey = process.env.GOOGLE_DRIVE_API_KEY;
    const searchParams = request.nextUrl.searchParams;
    const videoId = searchParams.get('videoId');
    
    console.log('[Drive Auto-Transcripts API] Buscando arquivos da pasta de transcrições automáticas');
    console.log('[Drive Auto-Transcripts API] VideoId:', videoId || 'Nenhum (buscando todos)');
    
    // Se videoId fornecido, buscar transcrição específica
    if (videoId) {
      try {
        const { docxFile, jsonData } = await findTranscriptByVideoId(videoId, apiKey);
        
        if (docxFile) {
          return NextResponse.json({
            success: true,
            found: true,
            transcript: {
              id: docxFile.id,
              name: docxFile.name,
              driveFileId: docxFile.id,
              webViewLink: docxFile.webViewLink || `https://drive.google.com/file/d/${docxFile.id}/view`,
              webContentLink: docxFile.webContentLink,
              createdTime: docxFile.createdTime,
              modifiedTime: docxFile.modifiedTime,
              // Incluir transcriptArray se JSON foi encontrado
              transcriptArray: jsonData?.transcriptArray || undefined,
              videoTitle: jsonData?.videoTitle || undefined,
              videoUrl: jsonData?.videoUrl || undefined,
              lang: jsonData?.lang || undefined,
            },
          }, {
            headers: {
              'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
              'Pragma': 'no-cache',
              'Expires': '0',
            },
          });
        }
        
        return NextResponse.json({
          success: true,
          found: false,
          transcript: null,
        }, {
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
          },
        });
      } catch (findError) {
        const findErrorMsg = findError instanceof Error ? findError.message : 'Erro desconhecido';
        console.error('[Drive Auto-Transcripts API] Erro ao buscar transcrição específica:', findErrorMsg);
        // Retornar erro específico mas não quebrar a requisição
        return NextResponse.json({
          success: false,
          found: false,
          error: findErrorMsg,
          transcript: null,
        }, {
          status: 500,
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
          },
        });
      }
    }
    
    // Buscar todos os arquivos
    const driveFiles = await fetchDriveDocxFiles(apiKey);
    
    console.log(`[Drive Auto-Transcripts API] ✅ ${driveFiles.length} arquivos encontrados`);
    
    return NextResponse.json({
      success: true,
      transcripts: driveFiles.map(file => ({
        id: file.id,
        name: file.name,
        driveFileId: file.id,
        webViewLink: file.webViewLink || `https://drive.google.com/file/d/${file.id}/view`,
        webContentLink: file.webContentLink,
        createdTime: file.createdTime,
        modifiedTime: file.modifiedTime,
      })),
      total: driveFiles.length,
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('[Drive Auto-Transcripts API] Erro:', errorMessage);

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        transcripts: [],
        total: 0,
      },
      { 
        status: 500,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      }
    );
  }
}
