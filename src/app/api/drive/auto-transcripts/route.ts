import { NextRequest, NextResponse } from 'next/server';

// Forçar modo dinâmico para sempre buscar dados atualizados do Google Drive
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const DRIVE_FOLDER_ID = '1SKEAfJ8oC0dOq0LGxUt6UtxQXjuvykwg'; // Pasta de transcrições automáticas
const GOOGLE_DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3';

interface DriveFile {
  id: string;
  name: string;
  createdTime?: string;
  modifiedTime?: string;
  webViewLink?: string;
  webContentLink?: string;
}

interface DriveApiResponse {
  files?: DriveFile[];
  nextPageToken?: string;
}

/**
 * Busca arquivos do Google Drive usando a API v3
 */
async function fetchDriveFiles(folderId: string, apiKey?: string): Promise<DriveFile[]> {
  // Buscar arquivos DOCX (transcrições automáticas)
  const query = `'${folderId}' in parents and (mimeType='application/vnd.openxmlformats-officedocument.wordprocessingml.document' or mimeType='application/msword') and trashed=false`;
  const fields = 'files(id,name,createdTime,modifiedTime,webViewLink,webContentLink)';
  
  let url = `${GOOGLE_DRIVE_API_BASE}/files?q=${encodeURIComponent(query)}&fields=${fields}&orderBy=name&pageSize=1000`;
  
  if (apiKey) {
    url += `&key=${apiKey}`;
  }

  const allFiles: DriveFile[] = [];
  let nextPageToken: string | undefined;

  do {
    const currentUrl = nextPageToken ? `${url}&pageToken=${nextPageToken}` : url;
    
    const response = await fetch(currentUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Drive Auto-Transcripts API] Erro na resposta:', response.status, errorText);
      
      if (response.status === 403) {
        throw new Error('Acesso negado à API do Google Drive. Verifique se a pasta é pública ou configure GOOGLE_DRIVE_API_KEY.');
      }
      
      throw new Error(`Erro ao buscar arquivos do Drive: ${response.status} - ${errorText}`);
    }

    const data: DriveApiResponse = await response.json();
    
    if (data.files && Array.isArray(data.files)) {
      allFiles.push(...data.files);
    }

    nextPageToken = data.nextPageToken;
  } while (nextPageToken);

  return allFiles;
}

/**
 * Busca arquivos JSON no Google Drive
 */
async function fetchJsonFiles(folderId: string, apiKey?: string): Promise<DriveFile[]> {
  const query = `'${folderId}' in parents and mimeType='application/json' and trashed=false`;
  const fields = 'files(id,name,createdTime,modifiedTime,webViewLink,webContentLink)';
  
  let url = `${GOOGLE_DRIVE_API_BASE}/files?q=${encodeURIComponent(query)}&fields=${fields}&orderBy=name&pageSize=1000`;
  
  if (apiKey) {
    url += `&key=${apiKey}`;
  }

  const allFiles: DriveFile[] = [];
  let nextPageToken: string | undefined;

  do {
    const currentUrl = nextPageToken ? `${url}&pageToken=${nextPageToken}` : url;
    
    const response = await fetch(currentUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Drive Auto-Transcripts API] Erro ao buscar JSONs:', response.status, errorText);
      break; // Não crítico, continuar sem JSONs
    }

    const data: DriveApiResponse = await response.json();
    
    if (data.files && Array.isArray(data.files)) {
      allFiles.push(...data.files);
    }

    nextPageToken = data.nextPageToken;
  } while (nextPageToken);

  return allFiles;
}

interface TranscriptJsonData {
  videoId?: string;
  videoTitle?: string;
  videoUrl?: string;
  lang?: string;
  transcriptArray?: Array<{ text?: string; content?: string; offset: number; duration?: number }>;
  createdAt?: string;
  version?: string;
}

/**
 * Busca e baixa conteúdo de um arquivo JSON do Drive
 */
async function fetchJsonContent(fileId: string, apiKey?: string): Promise<TranscriptJsonData | null> {
  try {
    let url = `${GOOGLE_DRIVE_API_BASE}/files/${fileId}?alt=media`;
    
    if (apiKey) {
      url += `&key=${apiKey}`;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      console.warn(`[Drive Auto-Transcripts API] Erro ao baixar JSON ${fileId}:`, response.status);
      return null;
    }

    const jsonData = await response.json();
    return jsonData;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido';
    console.warn(`[Drive Auto-Transcripts API] Erro ao buscar conteúdo do JSON ${fileId}:`, errorMsg);
    return null;
  }
}

/**
 * Busca uma transcrição específica por videoId
 * Tenta encontrar arquivo que contenha o videoId no nome
 */
async function findTranscriptByVideoId(videoId: string, apiKey?: string): Promise<{ docxFile: DriveFile | null; jsonData: TranscriptJsonData | null }> {
  const allFiles = await fetchDriveFiles(DRIVE_FOLDER_ID, apiKey);
  
  // Normalizar videoId para busca (remover caracteres especiais)
  const normalizedVideoId = videoId.toLowerCase().replace(/[^a-z0-9]/g, '');
  
  // Buscar arquivo DOCX que contenha o videoId no nome
  const matchingDocxFile = allFiles.find(file => {
    const fileName = file.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    return fileName.includes(normalizedVideoId) || normalizedVideoId.includes(fileName.substring(0, 11));
  });
  
  if (!matchingDocxFile) {
    return { docxFile: null, jsonData: null };
  }

  // Buscar JSON correspondente
  const jsonFiles = await fetchJsonFiles(DRIVE_FOLDER_ID, apiKey);
  const matchingJsonFile = jsonFiles.find(file => {
    const fileName = file.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    return fileName.includes(normalizedVideoId) || normalizedVideoId.includes(fileName.substring(0, 11));
  });

  let jsonData = null;
  if (matchingJsonFile) {
    jsonData = await fetchJsonContent(matchingJsonFile.id, apiKey);
    if (jsonData && jsonData.transcriptArray) {
      console.log(`[Drive Auto-Transcripts API] ✅ JSON encontrado e carregado para videoId: ${videoId}`);
    }
  }

  return { docxFile: matchingDocxFile, jsonData };
}

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
    
    console.log('[Drive Auto-Transcripts API] Buscando arquivos da pasta:', DRIVE_FOLDER_ID);
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
    const driveFiles = await fetchDriveFiles(DRIVE_FOLDER_ID, apiKey);
    
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

