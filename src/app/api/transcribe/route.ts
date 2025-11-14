import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import { existsSync } from 'fs';
import path from 'path';
import { Readable } from 'stream';
import { Document, Packer, Paragraph, TextRun, ExternalHyperlink } from 'docx';
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

/**
 * Função para fazer upload do arquivo de transcrição para o Hostinger via API HTTP
 */
async function uploadToHostinger(
  localFilePath: string,
  playlistFolder: string,
  videoId: string,
  fileContent: string,
  playlistId: string
): Promise<void> {
  // Usar domínio acaoparamita.com.br para acessar a Hostinger
  // Usar PHP endpoint que funciona sem Node.js
  const hostingerApiUrl = process.env.HOSTINGER_API_URL || 'https://acaoparamita.com.br';
  const uploadUrl = `${hostingerApiUrl}/repositorio/api/transcripts/upload.php`;

  try {
    const response = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        playlistId: playlistId || playlistFolder,
        videoId: videoId,
        content: fileContent,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    const result = await response.json();
    if (process.env.NODE_ENV === 'development') {
      console.log('[HOSTINGER] Upload concluído:', result);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    throw new Error(`Falha ao fazer upload para Hostinger: ${errorMessage}`);
  }
}

interface TranscriptItem {
  text?: string;
  content?: string;
  offset: number;
  duration?: number;
}

/**
 * Função para criar DOCX e fazer upload para o Google Drive
 */
async function createAndUploadDocx(
  transcriptArray: TranscriptItem[],
  videoId: string,
  videoTitle?: string,
  videoUrl?: string,
  lang?: string
): Promise<string | null> {
  try {
    // Função auxiliar para formatar tempo
    const formatTimeForDisplay = (milliseconds: number): string => {
      const totalSeconds = Math.floor(milliseconds / 1000);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    const paragraphs: Paragraph[] = [];

    // Cabeçalho: Título do vídeo
    if (videoTitle) {
      paragraphs.push(
        new Paragraph({
          text: videoTitle,
          heading: 'Heading1',
          spacing: { after: 400 },
        })
      );
    }

    // Link do vídeo
    if (videoUrl) {
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'Link: ', bold: true }),
            new ExternalHyperlink({
              children: [new TextRun({ text: videoUrl, color: '0066CC', style: 'Hyperlink' })],
              link: videoUrl,
            }),
          ],
          spacing: { after: 200 },
        })
      );
    }

    // Idioma
    if (lang) {
      paragraphs.push(
        new Paragraph({
          text: `Idioma: ${lang.toUpperCase()}`,
          spacing: { after: 200 },
        })
      );
    }

    paragraphs.push(new Paragraph({ text: '', spacing: { after: 400 } }));

    // Adicionar transcrição
    transcriptArray.forEach((item) => {
      const text = item.text || item.content || '';
      if (text && text.trim().length > 0) {
        const timeStr = formatTimeForDisplay(item.offset || 0);
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({ text: `${timeStr} `, bold: true, color: '4B5563' }),
              new TextRun({ text: text.trim(), color: '111827' }),
            ],
            spacing: { after: 200 },
          })
        );
      }
    });

    // Criar documento
    const doc = new Document({
      sections: [{ children: paragraphs }],
    });

    // Gerar buffer
    const buffer = await Packer.toBuffer(doc);

    // Criar nome do arquivo
    const safeTitle = (videoTitle || videoId || 'transcricao')
      .replace(/[^a-z0-9\s-]/gi, '')
      .replace(/\s+/g, '-')
      .substring(0, 50);
    const fileName = `${safeTitle}-${videoId}.docx`;

    // Fazer upload para Drive usando OAuth 2.0
    const DRIVE_FOLDER_ID = '1SKEAfJ8oC0dOq0LGxUt6UtxQXjuvykwg';
    
    // Carregar credenciais OAuth 2.0
    const oauthClientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
    const oauthClientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
    const oauthRefreshToken = process.env.GOOGLE_OAUTH_REFRESH_TOKEN;

    if (!oauthClientId || !oauthClientSecret) {
      console.error('[DRIVE UPLOAD ERROR] ❌ Credenciais OAuth não configuradas!');
      console.error('[DRIVE UPLOAD ERROR] Configure as variáveis de ambiente:');
      console.error('[DRIVE UPLOAD ERROR] - GOOGLE_OAUTH_CLIENT_ID');
      console.error('[DRIVE UPLOAD ERROR] - GOOGLE_OAUTH_CLIENT_SECRET');
      console.error('[DRIVE UPLOAD ERROR] - GOOGLE_OAUTH_REFRESH_TOKEN');
      return null;
    }

    if (!oauthRefreshToken) {
      console.error('[DRIVE UPLOAD ERROR] ❌ Refresh Token não configurado!');
      console.error('[DRIVE UPLOAD ERROR] Para obter o refresh token:');
      console.error('[DRIVE UPLOAD ERROR] 1. Acesse: /api/auth/google');
      console.error('[DRIVE UPLOAD ERROR] 2. Autorize o acesso');
      console.error('[DRIVE UPLOAD ERROR] 3. Copie o refresh_token retornado');
      console.error('[DRIVE UPLOAD ERROR] 4. Configure GOOGLE_OAUTH_REFRESH_TOKEN no .env.local ou Vercel');
      return null;
    }

    try {
      console.log('[DRIVE UPLOAD] Iniciando autenticação com OAuth 2.0...');
      console.log('[DRIVE UPLOAD] Client ID:', oauthClientId.substring(0, 20) + '...');
      console.log('[DRIVE UPLOAD] Pasta de destino:', DRIVE_FOLDER_ID);
      
      // Criar cliente OAuth 2.0
      const oauth2Client = new OAuth2Client(
        oauthClientId,
        oauthClientSecret,
        process.env.NODE_ENV === 'production' 
          ? 'https://repositorio.acaoparamita.com.br/api/auth/google/callback'
          : 'http://localhost:3000/api/auth/google/callback'
      );

      // Configurar refresh token
      oauth2Client.setCredentials({
        refresh_token: oauthRefreshToken,
      });

      // Obter access token (será renovado automaticamente se necessário)
      const { credentials } = await oauth2Client.refreshAccessToken();
      oauth2Client.setCredentials(credentials);

      console.log('[DRIVE UPLOAD] ✅ Autenticação OAuth concluída');
      console.log('[DRIVE UPLOAD] Criando cliente do Drive...');

      // Criar cliente do Drive com OAuth
      const drive = google.drive({ version: 'v3', auth: oauth2Client });

      // Verificar acesso à pasta ANTES de tentar upload
      console.log('[DRIVE UPLOAD] Verificando acesso à pasta:', DRIVE_FOLDER_ID);
      try {
        const folderInfo = await drive.files.get({
          fileId: DRIVE_FOLDER_ID,
          fields: 'id, name, owners, permissions, shared, mimeType',
          supportsAllDrives: true,
          supportsTeamDrives: true,
        });
        
        console.log('[DRIVE UPLOAD] ✅ Pasta encontrada:', folderInfo.data.name);
        console.log('[DRIVE UPLOAD] Proprietários:', folderInfo.data.owners?.map(o => o.emailAddress).join(', ') || 'N/A');
        console.log('[DRIVE UPLOAD] Compartilhada:', folderInfo.data.shared || false);
        console.log('[DRIVE UPLOAD] ✅ Pasta configurada corretamente (OAuth usa quota do usuário real)');
      } catch (folderError: unknown) {
        const folderErrorMsg = folderError instanceof Error ? folderError.message : 'Erro desconhecido';
        console.error('[DRIVE UPLOAD ERROR] ⚠️ Não foi possível verificar a pasta:', folderErrorMsg);
        console.error('[DRIVE UPLOAD ERROR] Continuando tentativa de upload...');
      }

      console.log('[DRIVE UPLOAD] Fazendo upload do arquivo:', fileName);
      console.log('[DRIVE UPLOAD] Tamanho do buffer:', buffer.length, 'bytes');

      // Converter Buffer para Stream (googleapis requer stream para uploads)
      const bufferStream = Readable.from(Buffer.from(buffer));
      
      // Fazer upload do arquivo
      // IMPORTANTE: Service Accounts não têm quota própria
      // A pasta deve pertencer a um usuário real e estar compartilhada com a Service Account
      // Usar supportsAllDrives: true para suportar Shared Drives (se aplicável)
      const response = await drive.files.create({
        requestBody: {
          name: fileName,
          parents: [DRIVE_FOLDER_ID],
        },
        media: {
          mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          body: bufferStream,
        },
        fields: 'id, webViewLink, name, permissions',
        supportsAllDrives: true, // Suportar Shared Drives
        supportsTeamDrives: true, // Compatibilidade com Team Drives antigos
      });

      console.log('[DRIVE UPLOAD] Resposta recebida:', {
        id: response.data.id,
        name: response.data.name,
        webViewLink: response.data.webViewLink
      });

      if (response.data.id) {
        const fileId = response.data.id;
        
        // Tornar arquivo público para visualização (opcional, mas útil)
        try {
          await drive.permissions.create({
            fileId: fileId,
            requestBody: {
              role: 'reader',
              type: 'anyone',
            },
            supportsAllDrives: true,
            supportsTeamDrives: true,
          });
          console.log('[DRIVE UPLOAD] ✅ Arquivo compartilhado publicamente');
        } catch (shareError) {
          // Não é crítico se falhar - o arquivo ainda foi criado
          console.warn('[DRIVE UPLOAD] ⚠️ Não foi possível tornar arquivo público:', shareError);
        }
        
        const webViewLink = response.data.webViewLink || `https://drive.google.com/file/d/${fileId}/view`;

        console.log(`[DRIVE UPLOAD SUCCESS] ✅ DOCX enviado com sucesso: ${fileName}`);
        console.log(`[DRIVE UPLOAD SUCCESS] ✅ File ID: ${fileId}`);
        console.log(`[DRIVE UPLOAD SUCCESS] ✅ Link: ${webViewLink}`);

        return webViewLink;
      } else {
        console.error('[DRIVE UPLOAD ERROR] ❌ Upload concluído mas sem ID de arquivo');
        console.error('[DRIVE UPLOAD ERROR] Resposta completa:', JSON.stringify(response.data, null, 2));
        return null;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      const errorStack = error instanceof Error ? error.stack : undefined;
      
      let errorDetails: unknown = undefined;
      if (error instanceof Error && 'response' in error) {
        const errorWithResponse = error as { response?: { data?: unknown; status?: number; statusText?: string } };
        errorDetails = {
          status: errorWithResponse.response?.status,
          statusText: errorWithResponse.response?.statusText,
          data: errorWithResponse.response?.data
        };
      }
      
      console.error('[DRIVE UPLOAD ERROR] ❌ Erro ao fazer upload:', {
        message: errorMessage,
        stack: errorStack,
        details: errorDetails,
        fileName,
        folderId: DRIVE_FOLDER_ID,
      });
      
      // Log detalhado do erro
      if (errorDetails) {
        console.error('[DRIVE UPLOAD ERROR] Detalhes completos:', JSON.stringify(errorDetails, null, 2));
        
        // Mensagens específicas para erros comuns
        const status = (errorDetails as { status?: number })?.status;
        const errorData = (errorDetails as { 
          data?: { 
            error?: { 
              message?: string; 
              code?: number;
              errors?: Array<{ reason?: string; message?: string }>;
            } 
          } 
        })?.data;
        
        if (status === 403) {
          const errorMessage = errorData?.error?.message || '';
          const errorReason = errorData?.error?.errors?.[0]?.reason || '';
          
          if (errorReason === 'storageQuotaExceeded' || errorMessage.includes('storage quota')) {
            console.error('[DRIVE UPLOAD ERROR] ⚠️ QUOTA DE ARMAZENAMENTO EXCEDIDA:');
            console.error('[DRIVE UPLOAD ERROR] A conta do Google Drive atingiu o limite de armazenamento.');
            console.error('[DRIVE UPLOAD ERROR] SOLUÇÃO: Libere espaço no Google Drive ou faça upgrade do plano.');
          } else if (errorMessage.includes('insufficientFilePermissions') || errorMessage.includes('insufficient permissions')) {
            console.error('[DRIVE UPLOAD ERROR] ⚠️ PERMISSÃO INSUFICIENTE:');
            console.error('[DRIVE UPLOAD ERROR] A conta OAuth precisa ter acesso à pasta do Drive.');
            console.error('[DRIVE UPLOAD ERROR] SOLUÇÃO: Verifique se a pasta existe e se você tem permissão de escrita.');
          }
        }
      }
      
      return null;
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('[DRIVE UPLOAD ERROR] Erro ao criar/fazer upload do DOCX:', errorMessage);
    return null;
  }
}

/**
 * Função auxiliar para formatar tempo para exibição (HH:MM:SS)
 */
const formatTimeForDisplay = (milliseconds: number): string => {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

/**
 * Função auxiliar para parsear SRT e converter para array de objetos
 */
const parseSRTToArray = (srtContent: string): TranscriptItem[] => {
  const items: TranscriptItem[] = [];
  const blocks = srtContent.trim().split(/\n\s*\n/).filter(block => block.trim());
  
  for (const block of blocks) {
    const lines = block.trim().split('\n');
    if (lines.length < 3) continue;
    
    // Linha 1: número sequencial (ignorar)
    // Linha 2: timestamps (00:00:00,000 --> 00:00:01,000)
    const timeLine = lines[1];
    const timeMatch = timeLine.match(/(\d{2}):(\d{2}):(\d{2}),(\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2}),(\d{3})/);
    
    if (timeMatch) {
      const startHours = parseInt(timeMatch[1]);
      const startMinutes = parseInt(timeMatch[2]);
      const startSeconds = parseInt(timeMatch[3]);
      const startMs = parseInt(timeMatch[4]);
      const offset = (startHours * 3600 + startMinutes * 60 + startSeconds) * 1000 + startMs;
      
      const endHours = parseInt(timeMatch[5]);
      const endMinutes = parseInt(timeMatch[6]);
      const endSeconds = parseInt(timeMatch[7]);
      const endMs = parseInt(timeMatch[8]);
      const endOffset = (endHours * 3600 + endMinutes * 60 + endSeconds) * 1000 + endMs;
      
      const duration = endOffset - offset;
      
      // Linhas restantes: texto
      const text = lines.slice(2).join(' ').trim();
      
      if (text) {
        items.push({
          text: text,
          offset: offset,
          duration: duration
        });
      }
    }
  }
  
  return items;
};

/**
 * API Route para transcrever vídeos do YouTube usando Supadata API
 * Endpoint: POST /api/transcribe
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { videoId, videoUrl, playlistId, videoTitle } = body;

    // Validação de entrada
    if (!videoId && !videoUrl) {
      return NextResponse.json(
        { 
          success: false,
          error: 'videoId ou videoUrl é obrigatório' 
        },
        { status: 400 }
      );
    }

    // Extrair videoId da URL se necessário
    let finalVideoId = videoId;
    let finalVideoUrl = videoUrl;

    // Se o videoId contém hífen (formato playlist-id), extrair o videoId real
    if (finalVideoId && finalVideoId.includes('-')) {
      const parts = finalVideoId.split('-');
      finalVideoId = parts[parts.length - 1]; // Pegar a última parte que é o videoId
    }

    // Se não tiver videoId mas tiver URL, tentar extrair da URL
    if (!finalVideoId && finalVideoUrl) {
      // Extrair ID da URL do YouTube (apenas se for URL de vídeo, não playlist)
      if (finalVideoUrl.includes('watch?v=') || finalVideoUrl.includes('youtu.be/')) {
        const match = finalVideoUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
        if (match && match[1]) {
          finalVideoId = match[1];
        }
      }
    }

    // Se tiver videoId mas URL for de playlist ou inválida, construir URL do vídeo
    if (finalVideoId) {
      if (!finalVideoUrl || finalVideoUrl.includes('/playlist') || !finalVideoUrl.includes('watch?v=')) {
        finalVideoUrl = `https://www.youtube.com/watch?v=${finalVideoId}`;
      }
    } else if (finalVideoId && !finalVideoUrl) {
      finalVideoUrl = `https://www.youtube.com/watch?v=${finalVideoId}`;
    }

    // Validar que temos um videoId válido
    if (!finalVideoId || finalVideoId.length < 10) {
      return NextResponse.json(
        { 
          success: false,
          error: 'URL do vídeo inválida ou formato não suportado. Verifique se a URL do YouTube está correta.',
          details: { receivedVideoId: videoId, receivedVideoUrl: videoUrl }
        },
        { status: 400 }
      );
    }

    // Validar que a URL final não é de playlist
    if (finalVideoUrl && finalVideoUrl.includes('/playlist') && !finalVideoUrl.includes('watch?v=')) {
      return NextResponse.json(
        { 
          success: false,
          error: 'URL do vídeo inválida ou formato não suportado. Verifique se a URL do YouTube está correta. URL enviada: ' + finalVideoUrl
        },
        { status: 400 }
      );
    }

    // PRIMEIRO: Verificar se existe DOCX no Google Drive
    try {
      const { GET: getAutoTranscripts } = await import('../drive/auto-transcripts/route');
      const driveRequest = new NextRequest(
        new URL(`/api/drive/auto-transcripts?videoId=${finalVideoId}`, 'http://localhost:3000')
      );
      const driveResponse = await getAutoTranscripts(driveRequest);
      
      if (driveResponse.ok) {
        const driveData = await driveResponse.json();
        
        if (driveData.success && driveData.found && driveData.transcript) {
          // DOCX encontrado no Drive - retornar link do Drive e transcriptArray se disponível
          if (process.env.NODE_ENV === 'development') {
            console.log(`[DRIVE HIT] DOCX encontrado no Google Drive para videoId: ${finalVideoId}`);
            if (driveData.transcript.transcriptArray) {
              console.log(`[DRIVE HIT] ✅ transcriptArray encontrado com ${driveData.transcript.transcriptArray.length} itens`);
            } else {
              console.log(`[DRIVE HIT] ⚠️ transcriptArray não encontrado no JSON do Drive`);
            }
          }
          
          return NextResponse.json({
            success: true,
            videoId: finalVideoId,
            transcriptUrl: driveData.transcript.webViewLink,
            driveFileId: driveData.transcript.driveFileId,
            transcriptArray: driveData.transcript.transcriptArray || undefined,
            videoTitle: driveData.transcript.videoTitle || videoTitle || undefined,
            videoUrl: driveData.transcript.videoUrl || finalVideoUrl || undefined,
            lang: driveData.transcript.lang || undefined,
            fromDrive: true,
            cached: true,
            message: 'Transcrição encontrada no Google Drive'
          });
        }
      }
    } catch (driveError) {
      // Ignorar erro - continuar para verificar cache local/Hostinger ou gerar nova
      if (process.env.NODE_ENV === 'development') {
        console.log('[DRIVE CHECK] Erro ao verificar Drive, continuando...', driveError);
      }
    }
    
    // Definir estrutura de pastas: public/transcripts/{playlistId}/{videoId}.srt
    // Se não tiver playlistId, usar 'standalone' como padrão
    const playlistFolder = playlistId || 'standalone';
    const transcriptDir = path.join(process.cwd(), 'public', 'transcripts', playlistFolder);
    const transcriptFilePath = path.join(transcriptDir, `${finalVideoId}.srt`);
    
    // Tentar buscar do cache local primeiro
    let existingTranscript: string | null = null;
    
    try {
      existingTranscript = await fs.readFile(transcriptFilePath, 'utf-8');
      
      // Log informativo em desenvolvimento
      if (process.env.NODE_ENV === 'development') {
        console.log(`[CACHE HIT] Transcrição encontrada localmente para videoId: ${finalVideoId}`);
        console.log(`[CACHE] Arquivo: ${transcriptFilePath}`);
      }
    } catch {
      // Arquivo não existe localmente, tentar buscar do Hostinger
      if (process.env.HOSTINGER_API_URL || process.env.VERCEL) {
        try {
          const hostingerUrl = process.env.HOSTINGER_API_URL || 'https://acaoparamita.com.br';
          const transcriptUrl = `${hostingerUrl}/repositorio/transcripts/${playlistFolder}/${finalVideoId}.srt`;
          
          const response = await fetch(transcriptUrl);
          if (response.ok) {
            existingTranscript = await response.text();
            if (process.env.NODE_ENV === 'development') {
              console.log(`[CACHE HIT] Transcrição encontrada no Hostinger para videoId: ${finalVideoId}`);
            }
          }
        } catch {
          // Ignorar erro - transcrição não existe
        }
      }
    }
    
    if (existingTranscript) {
      console.log('[CACHE] Transcrição encontrada localmente, verificando se precisa fazer upload para o Drive...');
      
      // Criar versão formatada do cache também
      const plainTextCache = existingTranscript.split('\n')
        .filter(line => !line.includes('-->') && !/^\d+$/.test(line.trim()))
        .join('\n');
      
      // Converter SRT para array para gerar formattedContent e transcriptArray
      const transcriptArrayFromCache = parseSRTToArray(existingTranscript);
      const formattedContentFromCache = transcriptArrayFromCache.length > 0
        ? transcriptArrayFromCache.map(item => {
            const text = item.text || '';
            if (!text || text.trim().length === 0) return '';
            const timeStr = formatTimeForDisplay(item.offset || 0);
            return `[${timeStr}] ${text.trim()}`;
          }).filter(Boolean).join('\n')
        : plainTextCache;
      
      // Verificar se já existe no Drive antes de fazer upload
      let driveDocxUrl: string | null = null;
      let driveUploadError: string | null = null;
      
      try {
        const { GET: getAutoTranscripts } = await import('../drive/auto-transcripts/route');
        const driveCheckRequest = new NextRequest(
          new URL(`/api/drive/auto-transcripts?videoId=${finalVideoId}`, 'http://localhost:3000')
        );
        const driveCheckResponse = await getAutoTranscripts(driveCheckRequest);
        
        if (driveCheckResponse.ok) {
          const driveCheckData = await driveCheckResponse.json();
          
          if (driveCheckData.success && driveCheckData.found && driveCheckData.transcript) {
            // Já existe no Drive
            console.log('[CACHE] ✅ DOCX já existe no Google Drive');
            driveDocxUrl = driveCheckData.transcript.webViewLink;
          } else {
            // Não existe no Drive - fazer upload
            console.log('[CACHE] 📤 DOCX não encontrado no Drive, fazendo upload...');
            
            if (transcriptArrayFromCache.length > 0) {
              console.log(`[CACHE] 📝 Gerando DOCX a partir do cache (${transcriptArrayFromCache.length} itens)...`);
              try {
                driveDocxUrl = await createAndUploadDocx(
                  transcriptArrayFromCache,
                  finalVideoId,
                  videoTitle,
                  finalVideoUrl,
                  'pt' // Idioma padrão
                );
                
                if (driveDocxUrl) {
                  console.log(`[CACHE] ✅ DOCX enviado para o Drive com sucesso: ${driveDocxUrl}`);
                } else {
                  driveUploadError = 'Upload para o Drive falhou (verifique logs do servidor)';
                  console.error('[CACHE] ❌ Upload do DOCX retornou null - verifique logs acima para detalhes');
                }
              } catch (docxError) {
                const errorMessage = docxError instanceof Error ? docxError.message : 'Erro desconhecido';
                const errorStack = docxError instanceof Error ? docxError.stack : undefined;
                driveUploadError = `Erro ao fazer upload para o Drive: ${errorMessage}`;
                console.error('[CACHE] ❌ Erro ao criar/fazer upload do DOCX:', {
                  message: errorMessage,
                  stack: errorStack,
                  videoId: finalVideoId
                });
              }
            } else {
              console.warn('[CACHE] ⚠️ transcriptArrayFromCache está vazio, não foi possível gerar DOCX');
              console.warn('[CACHE] Tamanho do SRT:', existingTranscript.length, 'caracteres');
            }
          }
        }
      } catch (driveCheckError) {
        console.warn('[CACHE] ⚠️ Erro ao verificar Drive, continuando sem upload:', driveCheckError);
      }
      
      // Determinar a URL do transcript - usar Drive se disponível, senão Hostinger/local
      const transcriptUrl = driveDocxUrl || (() => {
        if (process.env.HOSTINGER_API_URL || process.env.VERCEL) {
          const hostingerUrl = process.env.HOSTINGER_API_URL || 'https://acaoparamita.com.br';
          return `${hostingerUrl}/repositorio/transcripts/${playlistFolder}/${finalVideoId}.srt`;
        }
        return `/transcripts/${playlistFolder}/${finalVideoId}.srt`;
      })();
      
      return NextResponse.json({
        success: true,
        videoId: finalVideoId,
        transcriptUrl: transcriptUrl,
        driveDocxUrl: driveDocxUrl || undefined,
        fromDrive: !!driveDocxUrl,
        driveUploadError: driveUploadError || undefined,
        content: plainTextCache,
        formattedContent: formattedContentFromCache,
        transcriptArray: transcriptArrayFromCache,
        srtContent: existingTranscript,
        cached: true,
        message: driveDocxUrl 
          ? 'Transcrição encontrada em cache e salva no Google Drive!' 
          : 'Transcrição encontrada em cache'
      });
    }
    
    // Arquivo não existe, continuar para gerar nova transcrição
    if (process.env.NODE_ENV === 'development') {
      console.log(`[CACHE MISS] Transcrição não encontrada para videoId: ${finalVideoId}, gerando nova...`);
    }

    // Verificar se a API key está configurada
    const apiKey = process.env.SUPADATA_API_KEY;
    
    // Log para debug (apenas em desenvolvimento)
    if (process.env.NODE_ENV === 'development') {
      console.log('API Key configurada:', apiKey ? `${apiKey.substring(0, 10)}...` : 'NÃO ENCONTRADA');
    }
    
    if (!apiKey || apiKey === 'your_supadata_api_key_here') {
      return NextResponse.json(
        { 
          success: false,
          error: 'SUPADATA_API_KEY não configurada. Configure a variável de ambiente SUPADATA_API_KEY.' 
        },
        { status: 500 }
      );
    }

    // Chamar API Supadata
    // Usar mode=auto para gerar legendas automaticamente se não estiverem disponíveis
    // Primeiro tenta com legendas existentes, depois com geração automática
    const supadataUrl = `https://api.supadata.ai/v1/transcript?url=${encodeURIComponent(finalVideoUrl)}&mode=auto`;
    
    // Log da URL de chamada (para debug)
    console.log('[Supadata API] Chamando API:', {
      url: supadataUrl,
      videoId: finalVideoId,
      videoUrl: finalVideoUrl,
      hasApiKey: !!apiKey
    });
    
    // Função para fazer requisição com retry
    const fetchWithRetry = async (url: string, options: RequestInit, maxRetries = 2): Promise<Response> => {
      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          // Criar AbortController para timeout de 60 segundos
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 60000);
          
          const response = await fetch(url, {
            ...options,
            signal: controller.signal,
          });
          
          clearTimeout(timeoutId);
          return response;
        } catch (error) {
          if (error instanceof Error && error.name === 'AbortError') {
            throw new Error('Timeout: A requisição demorou mais de 60 segundos. O vídeo pode ser muito longo ou o serviço está lento.');
          }
          
          if (attempt === maxRetries) {
            throw error;
          }
          
          // Esperar antes de tentar novamente (backoff exponencial)
          const delay = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
          console.log(`[Supadata API] Tentativa ${attempt + 1} falhou, tentando novamente em ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
      throw new Error('Todas as tentativas falharam');
    };
    
    let supadataResponse: Response;
    try {
      supadataResponse = await fetchWithRetry(supadataUrl, {
        method: 'GET',
        headers: {
          'x-api-key': apiKey,
          'Content-Type': 'application/json',
        },
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      console.error('[Supadata API] Erro na requisição:', errorMessage);
      
      if (errorMessage.includes('Timeout')) {
        return NextResponse.json(
          { 
            success: false,
            error: errorMessage + ' Tente novamente mais tarde ou use a opção via WhatsApp.',
            details: { videoId: finalVideoId, videoUrl: finalVideoUrl }
          },
          { status: 504 }
        );
      }
      
      return NextResponse.json(
        { 
          success: false,
          error: `Erro de conexão com a API Supadata: ${errorMessage}. Verifique sua conexão de internet e tente novamente.`,
          details: { videoId: finalVideoId, videoUrl: finalVideoUrl }
        },
        { status: 503 }
      );
    }

    // Tratar diferentes status de resposta
    if (!supadataResponse.ok) {
      let errorData: { message?: string; error?: string; [key: string]: unknown } = {};
      try {
        const errorText = await supadataResponse.text();
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { message: errorText || 'Erro desconhecido da API' };
        }
      } catch {
        errorData = { message: 'Erro ao processar resposta da API' };
      }
      
      // Log detalhado do erro
      console.error('[Supadata API] Erro na resposta:', {
        status: supadataResponse.status,
        statusText: supadataResponse.statusText,
        errorData,
        videoUrl: finalVideoUrl,
        videoId: finalVideoId
      });
      
      // Rate limit
      if (supadataResponse.status === 429) {
        return NextResponse.json(
          { 
            success: false,
            error: 'Limite de requisições atingido. O plano gratuito oferece 100 requisições/mês. Tente novamente mais tarde.',
            details: errorData
          },
          { status: 429 }
        );
      }

      // Transcript não disponível
      if (supadataResponse.status === 404) {
        return NextResponse.json(
          { 
            success: false,
            error: 'Este vídeo não possui transcrição disponível no YouTube. Verifique se o vídeo é público e possui legendas.',
            details: errorData
          },
          { status: 404 }
        );
      }

      // Não autorizado
      if (supadataResponse.status === 401) {
        return NextResponse.json(
          { 
            success: false,
            error: 'Chave de API inválida. Verifique se SUPADATA_API_KEY está correta.',
            details: errorData
          },
          { status: 401 }
        );
      }

      // Bad Request (400)
      if (supadataResponse.status === 400) {
        const errorMsg = errorData.message || errorData.error || 'Invalid Request';
        console.error('[Supadata API] Bad Request (400):', {
          errorMsg,
          errorData,
          videoUrl: finalVideoUrl,
          videoId: finalVideoId,
          supadataUrl
        });
        
        // Mensagens mais específicas baseadas no erro
        let userFriendlyError = errorMsg;
        if (errorMsg.toLowerCase().includes('invalid') || errorMsg.toLowerCase().includes('invalid request')) {
          userFriendlyError = `URL do vídeo inválida ou formato não suportado. Verifique se a URL do YouTube está correta. URL enviada: ${finalVideoUrl}`;
        }
        
        return NextResponse.json(
          { 
            success: false,
            error: userFriendlyError,
            details: process.env.NODE_ENV === 'development' ? {
              ...errorData,
              videoUrl: finalVideoUrl,
              videoId: finalVideoId
            } : undefined
          },
          { status: 400 }
        );
      }

      // Tratar erro específico "no available server"
      const errorMessage = errorData.message || errorData.error || '';
      const errorMessageLower = errorMessage.toLowerCase();
      
      if (errorMessageLower.includes('no available server') || 
          errorMessageLower.includes('server unavailable') ||
          errorMessageLower.includes('service unavailable')) {
        
        // Log detalhado para debug
        console.error('[Supadata API] Erro "no available server":', {
          status: supadataResponse.status,
          statusText: supadataResponse.statusText,
          errorData,
          videoId: finalVideoId,
          videoUrl: finalVideoUrl,
          timestamp: new Date().toISOString()
        });
        
        return NextResponse.json(
          { 
            success: false,
            error: 'O serviço de transcrição está temporariamente indisponível. Possíveis causas: (1) alta demanda no momento, (2) manutenção do serviço, (3) vídeo muito longo ou sem legendas disponíveis, ou (4) problemas temporários na infraestrutura. Por favor, tente novamente em alguns minutos ou use a opção via WhatsApp para solicitar a transcrição manualmente.',
            details: {
              ...errorData,
              status: supadataResponse.status,
              statusText: supadataResponse.statusText,
              videoId: finalVideoId,
              suggestion: 'Tente novamente em alguns minutos ou use a opção via WhatsApp'
            }
          },
          { status: 503 }
        );
      }
      
      // Tratar erro 503 (Service Unavailable) mesmo sem mensagem específica
      if (supadataResponse.status === 503) {
        console.error('[Supadata API] Status 503 (Service Unavailable):', {
          errorData,
          videoId: finalVideoId,
          videoUrl: finalVideoUrl,
          timestamp: new Date().toISOString()
        });
        
        return NextResponse.json(
          { 
            success: false,
            error: 'O serviço de transcrição está temporariamente indisponível (503). Isso geralmente indica: (1) servidores sobrecarregados, (2) manutenção em andamento, ou (3) problemas temporários. Tente novamente em alguns minutos.',
            details: {
              ...errorData,
              status: 503,
              videoId: finalVideoId
            }
          },
          { status: 503 }
        );
      }

      // Outros erros
      const finalErrorMessage = errorMessage || `Erro ao obter transcrição da API Supadata (Status: ${supadataResponse.status})`;
      return NextResponse.json(
        { 
          success: false,
          error: finalErrorMessage,
          details: {
            ...errorData,
            status: supadataResponse.status,
            statusText: supadataResponse.statusText
          }
        },
        { status: supadataResponse.status || 500 }
      );
    }

    let result: {
      content?: Array<{ text?: string; content?: string; offset: number; duration?: number; lang?: string }> | string;
      transcript?: string;
      lang?: string;
      language?: string;
      error?: string;
      message?: string;
      [key: string]: unknown;
    };
    try {
      result = await supadataResponse.json();
      
      // Verificar se a resposta contém erro mesmo com status OK
      if (result.error || result.message) {
        const errorMsg = (result.error || result.message || '').toString().toLowerCase();
        if (errorMsg.includes('no available server') || 
            errorMsg.includes('server unavailable') ||
            errorMsg.includes('service unavailable')) {
          return NextResponse.json(
            { 
              success: false,
              error: 'O serviço de transcrição está temporariamente indisponível. Possíveis causas: (1) alta demanda no momento, (2) manutenção do serviço, (3) vídeo muito longo ou sem legendas disponíveis, ou (4) problemas temporários na infraestrutura. Por favor, tente novamente em alguns minutos ou use a opção via WhatsApp para solicitar a transcrição manualmente.',
              details: result
            },
            { status: 503 }
          );
        }
      }
    } catch (parseError) {
      // Tentar ler como texto se JSON falhar
      try {
        const responseClone = supadataResponse.clone();
        const errorText = await responseClone.text();
        console.error('[Supadata API] Erro ao parsear JSON:', errorText);
        
        // Verificar se o texto contém o erro "no available server"
        if (errorText.toLowerCase().includes('no available server') || 
            errorText.toLowerCase().includes('server unavailable')) {
          return NextResponse.json(
            { 
              success: false,
              error: 'O serviço de transcrição está temporariamente indisponível. Possíveis causas: (1) alta demanda no momento, (2) manutenção do serviço, (3) vídeo muito longo ou sem legendas disponíveis, ou (4) problemas temporários na infraestrutura. Por favor, tente novamente em alguns minutos ou use a opção via WhatsApp para solicitar a transcrição manualmente.',
              details: { rawResponse: errorText.substring(0, 500) }
            },
            { status: 503 }
          );
        }
        
        return NextResponse.json(
          { 
            success: false,
            error: 'Erro ao processar resposta da API de transcrição. A resposta não está em formato JSON válido.',
            details: { rawResponse: errorText.substring(0, 500) }
          },
          { status: 500 }
        );
      } catch (textError) {
        console.error('[Supadata API] Erro ao ler resposta como texto:', textError);
        return NextResponse.json(
          { 
            success: false,
            error: 'Erro ao processar resposta da API de transcrição.',
            details: { parseError: parseError instanceof Error ? parseError.message : 'Erro desconhecido' }
          },
          { status: 500 }
        );
      }
    }
    
    // Log para debug (apenas em desenvolvimento)
    if (process.env.NODE_ENV === 'development') {
      console.log('Supadata API Response Status:', supadataResponse.status);
      console.log('Supadata API Response keys:', Object.keys(result));
      console.log('Content type:', Array.isArray(result.content) ? 'array' : typeof result.content);
      if (Array.isArray(result.content)) {
        console.log('Content array length:', result.content.length);
      }
    }
    
    // Função auxiliar para formatar tempo em SRT (milissegundos para HH:MM:SS,mmm)
    const formatSRTTime = (milliseconds: number): string => {
      const hours = Math.floor(milliseconds / 3600000);
      const minutes = Math.floor((milliseconds % 3600000) / 60000);
      const seconds = Math.floor((milliseconds % 60000) / 1000);
      const ms = Math.floor(milliseconds % 1000);
      
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`;
    };
    
    // Função auxiliar para converter array de objetos para SRT
    const convertToSRT = (items: TranscriptItem[]): string => {
      if (!items || items.length === 0) return '';
      
      return items.map((item, index) => {
        const text = item.text || item.content || '';
        if (!text || text.trim().length === 0) return '';
        
        // Converter offset e duration para formato SRT (HH:MM:SS,mmm)
        const startTime = formatSRTTime(item.offset || 0);
        const endTime = formatSRTTime((item.offset || 0) + (item.duration || 0));
        
        return `${index + 1}\n${startTime} --> ${endTime}\n${text.trim()}\n`;
      }).filter(Boolean).join('\n');
    };
    
    // Verificar se a resposta contém conteúdo
    // A API Supadata retorna 'content' como array de objetos com {text, duration, offset, lang}
    let transcriptContent: string = '';
    let transcriptArray: TranscriptItem[] = [];
    
    // Processar diferentes formatos de resposta
    if (Array.isArray(result.content) && result.content.length > 0) {
      // Formato: content é um array de objetos (formato padrão da Supadata)
      transcriptArray = result.content;
      // Converter para formato SRT usando os offsets e durations
      transcriptContent = convertToSRT(transcriptArray);
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`Convertido ${transcriptArray.length} itens para SRT, tamanho: ${transcriptContent.length} caracteres`);
      }
    } else if (result.content && typeof result.content === 'string') {
      const contentStr = result.content;
      if (contentStr.trim().length > 0) {
        // Formato: content é uma string
        transcriptContent = contentStr;
        // Converter string para array básico para permitir upload do Drive
        // Dividir por linhas e criar objetos com offset aproximado
        const lines = contentStr.split('\n').filter(line => line.trim().length > 0);
        transcriptArray = lines.map((line, index) => {
          // Tentar extrair timestamp se existir (formato [HH:MM:SS] ou similar)
          const timestampMatch = line.match(/\[(\d{2}):(\d{2}):(\d{2})\]/);
          let offset = index * 1000; // Aproximação: 1 segundo por linha
          
          if (timestampMatch) {
            const hours = parseInt(timestampMatch[1], 10);
            const minutes = parseInt(timestampMatch[2], 10);
            const seconds = parseInt(timestampMatch[3], 10);
            offset = (hours * 3600 + minutes * 60 + seconds) * 1000;
            // Remover timestamp do texto
            line = line.replace(/\[\d{2}:\d{2}:\d{2}\]\s*/, '').trim();
          }
          
          return {
            text: line,
            offset: offset,
            duration: 1000 // Aproximação: 1 segundo por linha
          };
        });
      }
    } else if (typeof result.transcript === 'string' && result.transcript.trim().length > 0) {
      transcriptContent = result.transcript;
      // Converter string para array básico
      const lines = result.transcript.split('\n').filter(line => line.trim().length > 0);
      transcriptArray = lines.map((line, index) => ({
        text: line,
        offset: index * 1000,
        duration: 1000
      }));
    } else if (typeof result.text === 'string' && result.text.trim().length > 0) {
      transcriptContent = result.text;
      // Converter string para array básico
      const lines = result.text.split('\n').filter(line => line.trim().length > 0);
      transcriptArray = lines.map((line, index) => ({
        text: line,
        offset: index * 1000,
        duration: 1000
      }));
    } else if (typeof result.srt === 'string' && result.srt.trim().length > 0) {
      transcriptContent = result.srt;
      // Converter SRT para array básico (parsing simples)
      const srtLines = result.srt.split('\n');
      let currentOffset = 0;
      transcriptArray = srtLines
        .filter(line => line.trim().length > 0 && !line.match(/^\d+$/) && !line.includes('-->'))
        .map((line, index) => {
          currentOffset = index * 1000;
          return {
            text: line.trim(),
            offset: currentOffset,
            duration: 1000
          };
        });
    } else if (result.data && typeof result.data === 'string' && result.data.trim().length > 0) {
      transcriptContent = result.data;
      // Converter string para array básico
      const lines = result.data.split('\n').filter(line => line.trim().length > 0);
      transcriptArray = lines.map((line, index) => ({
        text: line,
        offset: index * 1000,
        duration: 1000
      }));
    } else if (Array.isArray(result) && result.length > 0) {
      // Se result é um array diretamente
      transcriptArray = result;
      transcriptContent = convertToSRT(transcriptArray);
    }
    
    // Garantir que transcriptArray tenha conteúdo se transcriptContent existir mas array estiver vazio
    if (transcriptContent && transcriptContent.trim().length > 0 && transcriptArray.length === 0) {
      console.log('[TRANSCRIBE] Convertendo transcriptContent para transcriptArray...');
      const lines = transcriptContent.split('\n').filter(line => line.trim().length > 0);
      transcriptArray = lines.map((line, index) => ({
        text: line.trim(),
        offset: index * 1000,
        duration: 1000
      }));
      console.log(`[TRANSCRIBE] Criado transcriptArray com ${transcriptArray.length} itens`);
    }
    
    if (!transcriptContent || transcriptContent.trim().length === 0) {
      // Log mais detalhes para debug
      if (process.env.NODE_ENV === 'development') {
        console.error('Transcrição vazia após processamento. Result keys:', Object.keys(result));
        console.error('Content is array:', Array.isArray(result.content));
        console.error('Content length:', Array.isArray(result.content) ? result.content.length : 'N/A');
      }
      
      return NextResponse.json(
        { 
          success: false,
          error: 'A transcrição retornada está vazia. Este vídeo pode não ter legendas disponíveis ou a geração automática falhou. Tente novamente ou use a opção via WhatsApp.',
          details: process.env.NODE_ENV === 'development' 
            ? {
                responseStructure: Object.keys(result),
                contentType: Array.isArray(result.content) ? 'array' : typeof result.content,
                contentLength: Array.isArray(result.content) ? result.content.length : 'N/A'
              }
            : undefined
        },
        { status: 404 }
      );
    }

    // Salvar arquivo .srt
    let fileSaved = false;
    try {
      // Criar diretório se não existir
      await fs.mkdir(transcriptDir, { recursive: true });
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`[FS] Diretório criado/verificado: ${transcriptDir}`);
      }
      
      // Verificar permissões tentando criar arquivo temporário
      try {
        const testFilePath = path.join(transcriptDir, '.test-write');
        await fs.writeFile(testFilePath, 'test', 'utf-8');
        await fs.unlink(testFilePath);
        
        if (process.env.NODE_ENV === 'development') {
          console.log(`[FS] Permissões de escrita verificadas com sucesso`);
        }
      } catch (permError) {
        const errorMessage = permError instanceof Error ? permError.message : 'Erro desconhecido';
        console.error(`[FS ERROR] Erro ao verificar permissões de escrita:`, errorMessage);
        // Continuar mesmo assim, tentar salvar o arquivo real
      }
      
      // O transcriptContent já está no formato SRT se veio de um array
      // Se não estiver em formato SRT (sem -->), criar um SRT básico
      let srtContent = transcriptContent;
      
      // Verificar se já está em formato SRT
      if (!srtContent.includes('-->')) {
        // Se não estiver em formato SRT, criar um SRT básico sem timestamps precisos
        const lines = srtContent.split('\n').filter(line => line.trim());
        srtContent = lines.map((line, index) => {
          return `${index + 1}\n00:00:00,000 --> 00:00:00,000\n${line}\n`;
        }).join('\n');
      }
      
      // Salvar arquivo localmente primeiro
      await fs.writeFile(transcriptFilePath, srtContent, 'utf-8');
      fileSaved = true;
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`[FS SUCCESS] Arquivo SRT salvo com sucesso: ${transcriptFilePath}`);
        console.log(`[FS] Tamanho do arquivo: ${srtContent.length} caracteres`);
      }

      // Fazer upload para Hostinger via API HTTP se a URL estiver configurada
      if (process.env.HOSTINGER_API_URL || process.env.VERCEL) {
        try {
          await uploadToHostinger(transcriptFilePath, playlistFolder, finalVideoId, srtContent, playlistId || 'standalone');
          if (process.env.NODE_ENV === 'development') {
            console.log(`[HOSTINGER] Upload concluído com sucesso para Hostinger`);
          }
        } catch (uploadError) {
          const errorMessage = uploadError instanceof Error ? uploadError.message : 'Erro desconhecido';
          console.error('[HOSTINGER ERROR] Erro ao fazer upload para Hostinger:', errorMessage);
          // Continuar mesmo se o upload falhar - o arquivo local foi salvo
        }
      }
    } catch (fileError) {
      const errorMessage = fileError instanceof Error ? fileError.message : 'Erro desconhecido';
      const errorCode = (fileError as NodeJS.ErrnoException)?.code;
      const errorStack = fileError instanceof Error ? fileError.stack : undefined;
      console.error('[FS ERROR] Erro ao salvar arquivo de transcrição:', errorMessage);
      if (process.env.NODE_ENV === 'development') {
        console.error('[FS ERROR] Detalhes:', {
          code: errorCode,
          path: transcriptFilePath,
          dir: transcriptDir,
          stack: errorStack
        });
      }
      // Continuar mesmo se falhar ao salvar, retornar o conteúdo na resposta
      fileSaved = false;
    }

    // Função formatTimeForDisplay já está definida no topo do arquivo

    // Criar versão de texto simples para exibição (sem timestamps SRT)
    const plainText = transcriptArray.length > 0
      ? transcriptArray.map(item => (item.text || item.content || '')).filter(Boolean).join('\n')
      : transcriptContent.split('\n').filter(line => !line.includes('-->') && !/^\d+$/.test(line.trim())).join('\n');
    
    // Criar versão formatada com timestamps [HH:MM:SS] texto
    const formattedContent = transcriptArray.length > 0
      ? transcriptArray.map(item => {
          const text = (item.text || item.content || '');
          if (!text || text.trim().length === 0) return '';
          const timeStr = formatTimeForDisplay(item.offset || 0);
          return `[${timeStr}] ${text.trim()}`;
        }).filter(Boolean).join('\n')
      : plainText; // Fallback se não tiver array
    
    // Criar DOCX e fazer upload para o Drive
    let driveDocxUrl: string | null = null;
    let driveUploadError: string | null = null;
    
    console.log('[DRIVE] Verificando se deve fazer upload...', {
      transcriptArrayLength: transcriptArray.length,
      transcriptContentLength: transcriptContent?.length || 0,
      hasContent: transcriptContent && transcriptContent.trim().length > 0,
      videoId: finalVideoId,
      videoTitle: videoTitle
    });
    
    if (transcriptArray.length > 0) {
      try {
        console.log('[DRIVE] ✅ Iniciando criação e upload do DOCX...');
        console.log('[DRIVE] transcriptArray tem', transcriptArray.length, 'itens');
        console.log('[DRIVE] Primeiros itens do transcriptArray:', transcriptArray.slice(0, 3).map(item => ({
          text: (item.text || item.content || '').substring(0, 50),
          offset: item.offset
        })));
        
        driveDocxUrl = await createAndUploadDocx(
          transcriptArray,
          finalVideoId,
          videoTitle,
          finalVideoUrl,
          result.lang || result.language || 'pt'
        );
        
        if (driveDocxUrl) {
          console.log(`[DRIVE SUCCESS] ✅ DOCX salvo no Drive: ${driveDocxUrl}`);
        } else {
          driveUploadError = 'Upload para o Drive falhou (verifique logs do servidor). O arquivo foi gerado localmente.';
          console.error('[DRIVE ERROR] ❌ Upload do DOCX retornou null');
          console.error('[DRIVE ERROR] Verifique os logs acima para detalhes sobre o erro');
        }
      } catch (docxError) {
        const errorMessage = docxError instanceof Error ? docxError.message : 'Erro desconhecido';
        const errorStack = docxError instanceof Error ? docxError.stack : undefined;
        driveUploadError = `Erro ao fazer upload para o Drive: ${errorMessage}`;
        console.error('[DRIVE ERROR] ❌ Erro ao criar/fazer upload do DOCX:', {
          message: errorMessage,
          stack: errorStack,
          videoId: finalVideoId,
          videoTitle
        });
        // Continuar mesmo se falhar - não é crítico
      }
    } else {
      console.warn('[DRIVE WARNING] ⚠️ transcriptArray está vazio, não será feito upload para o Drive');
      console.warn('[DRIVE WARNING] transcriptContent length:', transcriptContent?.length || 0);
      driveUploadError = 'transcriptArray está vazio - não foi possível gerar DOCX';
    }
    
    // Retornar sucesso
    return NextResponse.json({
      success: true,
      videoId: finalVideoId,
      // URL do transcript - usar Drive DOCX se disponível, senão Hostinger SRT
      transcriptUrl: driveDocxUrl || (() => {
        if (!fileSaved) return undefined;
        if (process.env.HOSTINGER_API_URL || process.env.VERCEL) {
          const hostingerUrl = process.env.HOSTINGER_API_URL || 'https://acaoparamita.com.br';
          return `${hostingerUrl}/repositorio/transcripts/${playlistFolder}/${finalVideoId}.srt`;
        }
        return `/transcripts/${playlistFolder}/${finalVideoId}.srt`;
      })(),
      driveDocxUrl: driveDocxUrl || undefined,
      fromDrive: !!driveDocxUrl,
      driveUploadError: driveUploadError || undefined,
      content: plainText, // Texto simples para exibição
      formattedContent: formattedContent, // Texto formatado com timestamps [HH:MM:SS]
      transcriptArray: transcriptArray, // Array original para gerar DOCX
      srtContent: transcriptContent, // Formato SRT completo para download
      lang: result.lang || result.language || 'pt',
      message: driveDocxUrl 
        ? 'Transcrição gerada e salva no Google Drive!' 
        : fileSaved 
        ? 'Transcrição gerada e salva com sucesso!' 
        : 'Transcrição gerada com sucesso! (Nota: arquivo não pôde ser salvo, mas o conteúdo está disponível)',
      fileSaved: fileSaved
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    const errorStack = error instanceof Error ? error.stack : undefined;
    const isTypeError = error instanceof TypeError;
    console.error('Erro ao transcrever vídeo:', errorMessage);
    if (errorStack) {
      console.error('Stack trace:', errorStack);
    }
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Erro interno do servidor ao processar a transcrição',
        details: process.env.NODE_ENV === 'development' 
          ? {
              message: errorMessage,
              type: isTypeError ? 'TypeError' : (error?.constructor?.name || 'Unknown'),
              stack: errorStack
            }
          : undefined
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

