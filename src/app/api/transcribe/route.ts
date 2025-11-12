import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

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
    const { videoId, videoUrl, playlistId } = body;

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

    if (!finalVideoId && finalVideoUrl) {
      // Extrair ID da URL do YouTube
      const match = finalVideoUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
      if (match && match[1]) {
        finalVideoId = match[1];
      }
    } else if (finalVideoId && !finalVideoUrl) {
      finalVideoUrl = `https://www.youtube.com/watch?v=${finalVideoId}`;
    }

    if (!finalVideoId) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Não foi possível extrair o ID do vídeo da URL fornecida' 
        },
        { status: 400 }
      );
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
        } catch (fetchError) {
          // Ignorar erro - transcrição não existe
        }
      }
    }
    
    if (existingTranscript) {
      
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
      
      // Determinar a URL do transcript - usar Hostinger se disponível, senão local
      let transcriptUrl = `/transcripts/${playlistFolder}/${finalVideoId}.srt`;
      if (process.env.HOSTINGER_API_URL || process.env.VERCEL) {
        const hostingerUrl = process.env.HOSTINGER_API_URL || 'https://acaoparamita.com.br';
        transcriptUrl = `${hostingerUrl}/repositorio/transcripts/${playlistFolder}/${finalVideoId}.srt`;
      }
      
      return NextResponse.json({
        success: true,
        videoId: finalVideoId,
        transcriptUrl: transcriptUrl,
        content: plainTextCache,
        formattedContent: formattedContentFromCache,
        transcriptArray: transcriptArrayFromCache,
        srtContent: existingTranscript,
        cached: true,
        message: 'Transcrição encontrada em cache'
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
        return NextResponse.json(
          { 
            success: false,
            error: errorData.message || errorData.error || 'URL do vídeo inválida ou formato não suportado.',
            details: errorData
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

    let result: any;
    try {
      // Clonar a resposta antes de ler para evitar problemas se precisarmos ler novamente
      const responseClone = supadataResponse.clone();
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
    } else if (typeof result.content === 'string' && result.content.trim().length > 0) {
      // Formato: content é uma string
      transcriptContent = result.content;
    } else if (typeof result.transcript === 'string' && result.transcript.trim().length > 0) {
      transcriptContent = result.transcript;
    } else if (typeof result.text === 'string' && result.text.trim().length > 0) {
      transcriptContent = result.text;
    } else if (typeof result.srt === 'string' && result.srt.trim().length > 0) {
      transcriptContent = result.srt;
    } else if (result.data && typeof result.data === 'string' && result.data.trim().length > 0) {
      transcriptContent = result.data;
    } else if (Array.isArray(result) && result.length > 0) {
      // Se result é um array diretamente
      transcriptArray = result;
      transcriptContent = convertToSRT(transcriptArray);
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
    
    // Retornar sucesso
    return NextResponse.json({
      success: true,
      videoId: finalVideoId,
      // URL do transcript - usar Hostinger se disponível
      transcriptUrl: (() => {
        if (!fileSaved) return undefined;
        if (process.env.HOSTINGER_API_URL || process.env.VERCEL) {
          const hostingerUrl = process.env.HOSTINGER_API_URL || 'https://acaoparamita.com.br';
          return `${hostingerUrl}/repositorio/transcripts/${playlistFolder}/${finalVideoId}.srt`;
        }
        return `/transcripts/${playlistFolder}/${finalVideoId}.srt`;
      })(),
      content: plainText, // Texto simples para exibição
      formattedContent: formattedContent, // Texto formatado com timestamps [HH:MM:SS]
      transcriptArray: transcriptArray, // Array original para gerar DOCX
      srtContent: transcriptContent, // Formato SRT completo para download
      lang: result.lang || result.language || 'pt',
      message: fileSaved 
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

