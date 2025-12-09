'use client';

import { useState, useRef } from 'react';
import { TranscriptResponse } from '@/types';
import { Download, Loader2, AlertCircle, Youtube, CheckCircle2 } from 'lucide-react';

interface TranscriptItem {
  text: string;
  offset: number;
  duration?: number;
}

export default function TranscricoesManuaisClient() {
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [videoId, setVideoId] = useState<string | null>(null);
  const [videoTitle, setVideoTitle] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcriptArray, setTranscriptArray] = useState<TranscriptItem[] | null>(null);
  const [transcriptContent, setTranscriptContent] = useState<string | null>(null);
  const [formattedContent, setFormattedContent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [transcriptLang, setTranscriptLang] = useState<string | null>(null);
  const [driveDocxUrl, setDriveDocxUrl] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Função para extrair videoId da URL do YouTube
  const extractVideoId = (url: string): string | null => {
    // Formato 1: https://www.youtube.com/watch?v=VIDEO_ID
    // Formato 2: https://youtu.be/VIDEO_ID
    // Formato 3: https://www.youtube.com/embed/VIDEO_ID
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /youtube\.com\/.*[?&]v=([^&\n?#]+)/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1] && match[1].length === 11) {
        return match[1];
      }
    }

    return null;
  };

  // Função para formatar tempo em [HH:MM:SS]
  const formatTimeForDisplay = (milliseconds: number): string => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Função para processar transcrição
  const handleTranscribe = async () => {
    if (!youtubeUrl.trim()) {
      setError('Por favor, insira um link do YouTube');
      return;
    }

    // Extrair videoId
    const extractedVideoId = extractVideoId(youtubeUrl);
    if (!extractedVideoId) {
      setError('URL inválida. Por favor, insira um link válido do YouTube (ex: https://www.youtube.com/watch?v=...)');
      return;
    }

    // Cancelar requisição anterior se existir
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Criar novo AbortController
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    // Limpar estados anteriores
    setError(null);
    setIsProcessing(true);
    setVideoId(extractedVideoId);
    setVideoTitle(null);
    setTranscriptArray(null);
    setTranscriptContent(null);
    setFormattedContent(null);
    setTranscriptLang(null);
    setDriveDocxUrl(null);

    try {
      console.log('[TranscricoesManuais] Processando vídeo:', { videoId: extractedVideoId, url: youtubeUrl });

      const response = await fetch('/api/transcribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          videoId: extractedVideoId,
          videoUrl: youtubeUrl,
          videoTitle: null, // Será obtido da API
        }),
        signal: signal,
      });

      if (signal.aborted) {
        return;
      }

      const data: TranscriptResponse = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Erro ao transcrever vídeo');
      }

      // Sucesso - atualizar estados
      setVideoId(extractedVideoId);
      
      // Tentar obter título do vídeo da resposta da API
      const responseData = data as TranscriptResponse & { videoTitle?: string };
      setVideoTitle(responseData.videoTitle || `Vídeo ${extractedVideoId}`);
      
      setTranscriptArray(data.transcriptArray || null);
      setTranscriptContent(data.content || null);
      setFormattedContent(data.formattedContent || null);
      setTranscriptLang(data.lang || null);

      // Verificar se veio do Drive
      const dataWithDrive = data as TranscriptResponse & {
        fromDrive?: boolean;
        driveDocxUrl?: string;
        driveFileId?: string;
      };

      if (dataWithDrive.driveDocxUrl) {
        setDriveDocxUrl(dataWithDrive.driveDocxUrl);
      }

      console.log('[TranscricoesManuais] ✅ Transcrição gerada com sucesso');
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('[TranscricoesManuais] Requisição cancelada');
        return;
      }

      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido ao transcrever vídeo';
      setError(errorMessage);
      console.error('[TranscricoesManuais] Erro:', error);
    } finally {
      setIsProcessing(false);
      abortControllerRef.current = null;
    }
  };

  // Função para baixar DOCX
  const handleDownloadDocx = async () => {
    if (!transcriptArray || transcriptArray.length === 0) {
      alert('Não há transcrição disponível para download');
      return;
    }

    try {
      const response = await fetch('/api/transcribe/docx', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transcriptArray: transcriptArray,
          videoTitle: videoTitle || 'Transcrição',
          videoUrl: youtubeUrl,
          lang: transcriptLang || 'pt',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao gerar DOCX');
      }

      // Obter blob do documento
      const blob = await response.blob();

      // Criar URL temporária e fazer download
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;

      // Criar nome do arquivo seguro
      const safeTitle = (videoTitle || 'transcricao')
        .replace(/[^a-z0-9\s-]/gi, '')
        .replace(/\s+/g, '-')
        .substring(0, 50);

      a.download = `transcricao-${safeTitle}-${Date.now()}.docx`;
      document.body.appendChild(a);
      a.click();

      // Limpar recursos
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      console.error('Erro ao baixar DOCX:', error);
      alert(`Erro ao baixar documento: ${errorMessage}. Tente novamente.`);
    }
  };

  // Função para agrupar transcrição por timestamps
  const groupTranscriptSegments = (items: TranscriptItem[]) => {
    const groups: Array<{ time: string; text: string }> = [];
    let currentGroup: { time: string; text: string } | null = null;

    items.forEach((item) => {
      const timeStr = formatTimeForDisplay(item.offset || 0);
      const text = item.text || '';

      if (!text || text.trim().length === 0) return;

      if (!currentGroup || currentGroup.time !== timeStr) {
        if (currentGroup) {
          groups.push(currentGroup);
        }
        currentGroup = { time: timeStr, text: text.trim() };
      } else {
        currentGroup.text += ' ' + text.trim();
      }
    });

    if (currentGroup) {
      groups.push(currentGroup);
    }

    return groups;
  };

  return (
    <div className="space-y-8">
      {/* Campo de entrada */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="space-y-4">
          <label htmlFor="youtube-url" className="block text-sm font-medium text-gray-700">
            Link do YouTube
          </label>
          <div className="flex gap-3">
            <div className="flex-1">
              <input
                id="youtube-url"
                type="text"
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !isProcessing) {
                    handleTranscribe();
                  }
                }}
                placeholder="Cole o link do vídeo do YouTube aqui (ex: https://www.youtube.com/watch?v=...)"
                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                disabled={isProcessing}
              />
            </div>
            <button
              onClick={handleTranscribe}
              disabled={isProcessing || !youtubeUrl.trim()}
              className="px-6 py-3 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <Youtube className="w-4 h-4" />
                  Transcrever
                </>
              )}
            </button>
          </div>
          {error && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Visualização do vídeo */}
      {videoId && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            {videoTitle || 'Vídeo do YouTube'}
          </h2>
          <div className="aspect-video w-full rounded-lg overflow-hidden bg-gray-100">
            <iframe
              src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`}
              title="YouTube video player"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
            />
          </div>
        </div>
      )}

      {/* Transcrição e download */}
      {transcriptArray && transcriptArray.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              Transcrição
            </h2>
            {transcriptLang && (
              <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                {transcriptLang.toUpperCase()}
              </span>
            )}
          </div>

          {/* Botão de download */}
          <div className="mb-4">
            <button
              onClick={handleDownloadDocx}
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              Baixar .docx
            </button>
            {driveDocxUrl && (
              <a
                href={driveDocxUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-3 text-sm text-blue-600 hover:text-blue-800 underline"
              >
                Ver no Google Drive
              </a>
            )}
          </div>

          {/* Transcrição formatada */}
          <div className="border border-gray-200 rounded-md p-4 bg-gray-50 max-h-[600px] overflow-y-auto">
            <div className="space-y-4">
              {groupTranscriptSegments(transcriptArray).map((group, index) => (
                <div key={index} className="flex gap-4">
                  <div className="flex-shrink-0">
                    <span className="font-bold text-gray-700 text-sm">{group.time}</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-gray-900 text-sm leading-relaxed">{group.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Mensagem quando não há transcrição */}
      {videoId && !isProcessing && !transcriptArray && !error && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800">
            Aguardando transcrição... Se o vídeo não tiver legendas disponíveis, a transcrição pode demorar alguns minutos.
          </p>
        </div>
      )}
    </div>
  );
}

