'use client';

import React, { useState, useEffect } from 'react';
import { Playlist, MediaItem, Transcript, TranscriptResponse } from '@/types';
import { Search, Clock, Loader2, FileText, Download, AlertCircle, CheckCircle2 } from 'lucide-react';

interface SidebarProps {
  playlist: Playlist;
  currentMediaItem: MediaItem | null;
  transcript: Transcript | null;
  onMediaItemSelect?: (item: MediaItem) => void;
}

export default function Sidebar({ 
  playlist, 
  currentMediaItem, 
  transcript,
  onMediaItemSelect
}: SidebarProps) {
  const [activeTab, setActiveTab] = useState<'playlist' | 'transcript' | 'audio'>('playlist');
  const [searchTerm, setSearchTerm] = useState('');
  const [transcriptSearchTerm, setTranscriptSearchTerm] = useState('');
  const [playlistUrl, setPlaylistUrl] = useState('');
  
  // Estados para transcrição automática
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcriptUrl, setTranscriptUrl] = useState<string | null>(null);
  const [transcriptContent, setTranscriptContent] = useState<string | null>(null);
  const [formattedContent, setFormattedContent] = useState<string | null>(null);
  const [transcriptArray, setTranscriptArray] = useState<Array<{ text: string; offset: number; duration?: number }> | null>(null);
  const [transcriptError, setTranscriptError] = useState<string | null>(null);
  const [transcriptLang, setTranscriptLang] = useState<string | null>(null);

  useEffect(() => {
    setPlaylistUrl(window.location.href);
  }, []);

  const matchesSearch = (item: MediaItem) =>
    item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.description.toLowerCase().includes(searchTerm.toLowerCase());

  const filteredItems = playlist.items?.filter(matchesSearch) || [];
  const audioItems = playlist.items?.filter(item => item.format === 'audio') || [];
  const filteredAudioItems = audioItems.filter(matchesSearch);
  const whatsappNumber = '5548991486176';
  const whatsappMessage = encodeURIComponent(
    `Olá Bruno! Gostaria de solicitar a transcrição da playlist "${playlist.title}". Link: ${playlistUrl}`
  );
  const whatsappLink = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`;

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  // Função para transcrever vídeo usando Supadata API
  const handleTranscribe = async () => {
    if (!currentMediaItem) {
      setTranscriptError('Nenhum vídeo selecionado');
      return;
    }

    setIsTranscribing(true);
    setTranscriptError(null);
    setTranscriptUrl(null);
    setTranscriptContent(null);
    setFormattedContent(null);
    setTranscriptArray(null);
    setTranscriptLang(null);

    try {
      // Extrair videoId do media_url ou usar o id diretamente
      let videoId = currentMediaItem.id;
      let videoUrl = currentMediaItem.media_url;

      console.log('[Sidebar] 🔍 Iniciando transcrição:', {
        originalId: currentMediaItem.id,
        originalUrl: currentMediaItem.media_url,
        title: currentMediaItem.title
      });

      // Verificar se o ID já é um videoId válido do YouTube (11 caracteres, sem hífen/underscore)
      const isValidYouTubeVideoId = videoId && 
        videoId.length === 11 && 
        !videoId.includes('-') && 
        !videoId.includes('_') &&
        /^[a-zA-Z0-9_-]{11}$/.test(videoId);

      if (isValidYouTubeVideoId) {
        console.log('[Sidebar] ✅ ID já é um videoId válido do YouTube:', videoId);
        // Se não tiver URL ou URL for de playlist, construir URL do vídeo
        if (!videoUrl || videoUrl.includes('/playlist') || !videoUrl.includes('watch?v=')) {
          videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
        }
      } else {
        // Tentar extrair videoId da URL primeiro
        if (videoUrl && (videoUrl.includes('watch?v=') || videoUrl.includes('youtu.be/'))) {
          const match = videoUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
          if (match && match[1]) {
            videoId = match[1];
            console.log('[Sidebar] ✅ VideoId extraído da URL:', videoId);
          }
        }

        // Se ainda não tiver videoId válido e o ID contém hífen (formato playlist-id-numero)
        if (!isValidYouTubeVideoId && videoId.includes('-')) {
          const parts = videoId.split('-');
          const lastPart = parts[parts.length - 1];
          
          // Se a última parte for um número (1, 2, 3...), não é um videoId válido
          // Nesse caso, precisamos buscar o videoId real da playlist
          if (/^\d+$/.test(lastPart)) {
            console.log('[Sidebar] ⚠️ ID é formato mock (playlist-numero), tentando encontrar videoId real...');
            const videoIndex = parseInt(lastPart, 10) - 1; // Converter para índice (0-based)
            
            // PRIMEIRO: Verificar se já temos vídeos reais carregados na playlist
            // Procurar pelo vídeo correto usando o índice ou tentando encontrar pelo título
            let realVideo = null;
            
            // Tentar encontrar pelo índice primeiro
            if (playlist.items && playlist.items.length > videoIndex) {
              const candidateVideo = playlist.items[videoIndex];
              // Verificar se é um videoId válido
              if (candidateVideo.id && 
                  candidateVideo.id.length === 11 && 
                  !candidateVideo.id.includes('-') && 
                  /^[a-zA-Z0-9_-]{11}$/.test(candidateVideo.id)) {
                realVideo = candidateVideo;
              }
            }
            
            // Se não encontrou pelo índice, procurar em todos os vídeos reais
            if (!realVideo && playlist.items) {
              const realVideosInPlaylist = playlist.items.filter(v => 
                v.id && 
                v.id.length === 11 && 
                !v.id.includes('-') && 
                /^[a-zA-Z0-9_-]{11}$/.test(v.id)
              );
              
              if (realVideosInPlaylist.length > videoIndex && realVideosInPlaylist[videoIndex]) {
                realVideo = realVideosInPlaylist[videoIndex];
              }
            }
            
            if (realVideo) {
              // Encontrou vídeo real já carregado!
              videoId = realVideo.id;
              videoUrl = realVideo.media_url || `https://www.youtube.com/watch?v=${videoId}`;
              console.log('[Sidebar] ✅ VideoId real encontrado nos vídeos já carregados:', videoId);
            } else {
              // Não encontrou nos vídeos carregados
              // Se ainda estamos usando formato mock, significa que os vídeos reais ainda não foram carregados
              console.log('[Sidebar] ⚠️ Vídeo real ainda não foi carregado. Aguardando carregamento automático...');
              throw new Error('O vídeo ainda não foi carregado da API do YouTube. Aguarde alguns segundos e tente novamente.');
            }
          } else {
            // Última parte pode ser um videoId válido
            videoId = lastPart;
            console.log('[Sidebar] ✅ Usando última parte do ID como videoId:', videoId);
          }
        }
      }

      // Validar que temos um videoId válido (11 caracteres)
      if (!videoId || videoId.length !== 11 || !/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
        console.error('[Sidebar] ❌ VideoId inválido:', {
          videoId,
          length: videoId?.length,
          originalId: currentMediaItem.id,
          originalUrl: currentMediaItem.media_url
        });
        throw new Error('Não foi possível identificar o ID do vídeo. Verifique se o vídeo está selecionado corretamente.');
      }

      // Garantir que temos uma URL válida
      if (!videoUrl || videoUrl.includes('/playlist') || !videoUrl.includes('watch?v=')) {
        videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
      }

      console.log('[Sidebar] ✅ Enviando para API:', { videoId, videoUrl, playlistId: playlist.id });

      const response = await fetch('/api/transcribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          videoId: videoId,
          videoUrl: videoUrl,
          playlistId: playlist.id,
          videoTitle: currentMediaItem?.title,
        }),
      });

      const data: TranscriptResponse = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Erro ao transcrever vídeo');
      }

      // Sucesso
      // Sempre definir conteúdo formatado e array, mesmo se vier do Drive
      setTranscriptUrl(data.transcriptUrl || null);
      setTranscriptContent(data.content || null);
      setFormattedContent(data.formattedContent || null);
      setTranscriptArray(data.transcriptArray || null);
      setTranscriptLang(data.lang || null);
      
      // Se vier do Drive e tiver URL do Drive, usar ela como transcriptUrl principal
      const dataWithDrive = data as TranscriptResponse & { fromDrive?: boolean; driveDocxUrl?: string };
      if (dataWithDrive.fromDrive && dataWithDrive.driveDocxUrl) {
        setTranscriptUrl(dataWithDrive.driveDocxUrl);
      }
    } catch (error) {
      let errorMessage = 'Erro desconhecido ao transcrever';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      console.error('[Sidebar] Erro ao transcrever:', error);
      setTranscriptError(errorMessage);
    } finally {
      setIsTranscribing(false);
    }
  };

  // Função para baixar transcrição em formato DOCX
  const handleDownloadDocx = async () => {
    if (!transcriptArray || transcriptArray.length === 0) {
      alert('Não há transcrição disponível para download');
      return;
    }

    try {
      // Agrupar os segmentos da mesma forma que é exibido na tela
      const grouped = groupTranscriptSegments(transcriptArray);
      
      // Converter grupos de volta para o formato esperado pela API
      const groupedArray = grouped.map(group => {
        // Encontrar o offset correspondente ao timestamp do grupo
        const timeParts = group.time.split(':');
        const hours = parseInt(timeParts[0]);
        const minutes = parseInt(timeParts[1]);
        const seconds = parseInt(timeParts[2]);
        const offset = (hours * 3600 + minutes * 60 + seconds) * 1000;
        
        return {
          text: group.text,
          offset: offset,
          duration: 0
        };
      });

      const response = await fetch('/api/transcribe/docx', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transcriptArray: groupedArray,
          videoTitle: currentMediaItem?.title || 'Transcrição',
          videoUrl: currentMediaItem?.media_url || '',
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
      const safeTitle = (currentMediaItem?.title || 'transcricao')
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

  // Verificar se já existe transcrição quando o item mudar
  useEffect(() => {
    if (currentMediaItem) {
      // Resetar estados quando mudar de vídeo
      setTranscriptUrl(null);
      setTranscriptContent(null);
      setFormattedContent(null);
      setTranscriptArray(null);
      setTranscriptError(null);
      setTranscriptLang(null);
      setTranscriptSearchTerm('');

      // Verificar automaticamente se a transcrição já existe
      const checkExistingTranscript = async () => {
        try {
          // Extrair videoId do media_url ou usar o id diretamente
          let videoId = currentMediaItem.id;
          let videoUrl = currentMediaItem.media_url;

          // Verificar se o ID já é um videoId válido do YouTube (11 caracteres)
          const isValidYouTubeVideoId = videoId && 
            videoId.length === 11 && 
            !videoId.includes('-') && 
            /^[a-zA-Z0-9_-]{11}$/.test(videoId);

          if (isValidYouTubeVideoId) {
            // Se não tiver URL ou URL for de playlist, construir URL do vídeo
            if (!videoUrl || videoUrl.includes('/playlist') || !videoUrl.includes('watch?v=')) {
              videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
            }
          } else {
            // Tentar extrair videoId da URL primeiro
            if (videoUrl && (videoUrl.includes('watch?v=') || videoUrl.includes('youtu.be/'))) {
              const match = videoUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
              if (match && match[1]) {
                videoId = match[1];
              }
            }

            // Se ainda não tiver videoId válido e o ID contém hífen (formato playlist-id-numero)
            if (!isValidYouTubeVideoId && videoId.includes('-')) {
              const parts = videoId.split('-');
              const lastPart = parts[parts.length - 1];
              
              // Se a última parte for um número (1, 2, 3...), não é um videoId válido
              if (/^\d+$/.test(lastPart)) {
                // Se a URL for de playlist, não podemos buscar sem a API
                if (videoUrl && videoUrl.includes('/playlist')) {
                  // Não fazer nada - aguardar que os vídeos reais sejam carregados
                  return;
                }
              } else {
                // Última parte pode ser um videoId válido
                videoId = lastPart;
              }
            }
          }

          // Validar que temos um videoId válido (11 caracteres)
          if (!videoId || videoId.length !== 11 || !/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
            // Não fazer nada se não tiver videoId válido - aguardar carregamento dos vídeos reais
            return;
          }

          // Garantir que temos uma URL válida
          if (!videoUrl || videoUrl.includes('/playlist') || !videoUrl.includes('watch?v=')) {
            videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
          }

          // Tentar buscar a transcrição existente (a API retorna do cache se existir)
          const response = await fetch('/api/transcribe', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              videoId: videoId,
              videoUrl: videoUrl,
              playlistId: playlist.id,
              videoTitle: currentMediaItem?.title,
            }),
          });

          const data: TranscriptResponse = await response.json();

          // Se a transcrição existe (cache hit), carregar automaticamente
          if (response.ok && data.success && data.cached) {
            // Verificar se vem do Drive
            const dataWithDrive = data as TranscriptResponse & { fromDrive?: boolean; transcriptUrl?: string };
            if (dataWithDrive.fromDrive && dataWithDrive.transcriptUrl) {
              setTranscriptUrl(dataWithDrive.transcriptUrl);
              // Se for do Drive, não temos conteúdo formatado, apenas link
            } else {
              setTranscriptUrl(data.transcriptUrl || null);
              setTranscriptContent(data.content || null);
              setFormattedContent(data.formattedContent || null);
              setTranscriptArray(data.transcriptArray || null);
              setTranscriptLang(data.lang || null);
            }
          }
        } catch {
          // Silenciosamente ignorar erros - a transcrição simplesmente não existe ainda
          console.log('[Sidebar] Transcrição não encontrada, será necessário gerar');
        }
      };

      checkExistingTranscript();
    }
  }, [currentMediaItem, playlist.id]);

  // Função para formatar tempo no formato HH:MM:SS
  const formatTimeForDisplay = (milliseconds: number): string => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Função para agrupar segmentos de transcrição em intervalos maiores (a cada ~1 minuto)
  const groupTranscriptSegments = (segments: Array<{ text: string; offset: number; duration?: number }>): Array<{ time: string; text: string }> => {
    if (!segments || segments.length === 0) return [];
    
    const grouped: Array<{ time: string; text: string }> = [];
    const INTERVAL_MS = 60000; // 60 segundos (1 minuto) - intervalo para agrupar
    
    let currentGroup: { startTime: number; texts: string[] } | null = null;
    
    for (const segment of segments) {
      const segmentTime = segment.offset;
      
      if (!currentGroup || segmentTime - currentGroup.startTime >= INTERVAL_MS) {
        // Iniciar novo grupo
        if (currentGroup && currentGroup.texts.length > 0) {
          grouped.push({
            time: formatTimeForDisplay(currentGroup.startTime),
            text: currentGroup.texts.join(' ')
          });
        }
        currentGroup = {
          startTime: segmentTime,
          texts: [segment.text]
        };
      } else {
        // Adicionar ao grupo atual
        if (currentGroup) {
          currentGroup.texts.push(segment.text);
        }
      }
    }
    
    // Adicionar último grupo
    if (currentGroup && currentGroup.texts.length > 0) {
      grouped.push({
        time: formatTimeForDisplay(currentGroup.startTime),
        text: currentGroup.texts.join(' ')
      });
    }
    
    return grouped;
  };

  // Função para destacar termos de busca no texto
  const highlightSearchTerm = (text: string, searchTerm: string): React.ReactNode => {
    if (!searchTerm.trim()) return text;
    
    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 text-gray-900">{part}</mark>
      ) : (
        part
      )
    );
  };

  // Obter transcrição agrupada e filtrada
  const getGroupedTranscript = () => {
    if (!transcriptArray || transcriptArray.length === 0) return [];
    
    const grouped = groupTranscriptSegments(transcriptArray);
    
    if (!transcriptSearchTerm.trim()) return grouped;
    
    // Filtrar grupos que contêm o termo de busca
    const searchLower = transcriptSearchTerm.toLowerCase();
    return grouped.filter(group => 
      group.text.toLowerCase().includes(searchLower)
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Tabs */}
      <div className="flex border-b">
        <button
          onClick={() => setActiveTab('playlist')}
          className={`flex-1 px-4 py-3 text-sm font-medium ${
            activeTab === 'playlist'
              ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Playlist
        </button>
        <button
          onClick={() => setActiveTab('transcript')}
          className={`flex-1 px-4 py-3 text-sm font-medium ${
            activeTab === 'transcript'
              ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Transcrição
        </button>
        <button
          onClick={() => setActiveTab('audio')}
          className={`flex-1 px-4 py-3 text-sm font-medium ${
            activeTab === 'audio'
              ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Áudio
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
        {activeTab === 'playlist' && (
          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar na playlist..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Playlist Items */}
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredItems.map((item, index) => (
                <div
                  key={item.id}
                  onClick={() => onMediaItemSelect?.(item)}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    currentMediaItem?.id === item.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Thumbnail */}
                    <div className="flex-shrink-0 w-16 h-12 bg-gray-200 rounded-md overflow-hidden">
                      <iframe
                        src={`https://www.youtube.com/embed/videoseries?list=${playlist.id}&autoplay=0&mute=1&controls=0&showinfo=0&rel=0&modestbranding=1&start=${index}`}
                        className="w-full h-full pointer-events-none"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        title={item.title}
                      />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900 line-clamp-2">
                        {item.title}
                      </h4>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                        {item.description}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Clock size={12} className="text-gray-400" />
                        <span className="text-xs text-gray-500">
                          {formatDuration(item.duration)}
                        </span>
                        <span className="text-xs text-gray-500">•</span>
                        <span className="text-xs text-gray-500">
                          {item.date}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'audio' && (
          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar nos áudios..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Audio Items */}
            {filteredAudioItems.length > 0 ? (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {filteredAudioItems.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => onMediaItemSelect?.(item)}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      currentMediaItem?.id === item.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="space-y-2">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 line-clamp-2">
                          {item.title}
                        </h4>
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                          {item.description}
                        </p>
                      </div>
                      <audio controls className="w-full">
                        <source src={item.media_url} />
                        Seu navegador não suporta reprodução de áudio.
                      </audio>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Clock size={12} className="text-gray-400" />
                        <span>{formatDuration(item.duration)}</span>
                        <span>•</span>
                        <span>{item.date}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 text-sm">
                  Nenhum áudio disponível para esta playlist.
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'transcript' && (
          <div className="space-y-4">
            {/* Transcrição existente (prop) - manter compatibilidade */}
            {transcript ? (
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-gray-900">
                  Transcrição: {currentMediaItem?.title}
                </h3>
                <div className="text-sm text-gray-600 max-h-96 overflow-y-auto bg-gray-50 p-3 rounded border">
                  {transcript.content}
                </div>
              </div>
            ) : transcriptUrl || transcriptContent ? (
              /* Transcrição gerada automaticamente */
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-gray-900 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    Transcrição: {currentMediaItem?.title}
                  </h3>
                  {transcriptLang && (
                    <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                      {transcriptLang.toUpperCase()}
                    </span>
                  )}
                </div>
                
                <div className="flex gap-2 flex-wrap">
                  {/* Botão para ver no Drive se tiver URL do Drive */}
                  {transcriptUrl && transcriptUrl.includes('drive.google.com') && (
                    <a
                      href={transcriptUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-md text-xs font-medium hover:bg-blue-700 transition-colors"
                    >
                      <Download className="w-3 h-3" />
                      Ver no Google Drive
                    </a>
                  )}
                  {/* Botão para baixar .srt se tiver URL e não for do Drive */}
                  {transcriptUrl && !transcriptUrl.includes('drive.google.com') && (
                    <a
                      href={transcriptUrl}
                      download
                      className="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-md text-xs font-medium hover:bg-blue-700 transition-colors"
                    >
                      <Download className="w-3 h-3" />
                      Baixar .srt
                    </a>
                  )}
                  {/* Botão para baixar .docx sempre que tiver conteúdo */}
                  {transcriptArray && transcriptArray.length > 0 && (
                    <button
                      onClick={handleDownloadDocx}
                      className="inline-flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-md text-xs font-medium hover:bg-green-700 transition-colors"
                    >
                      <Download className="w-3 h-3" />
                      Baixar .docx
                    </button>
                  )}
                </div>

                {/* Buscador de transcrição - apenas se não for do Drive */}
                {!transcriptUrl?.includes('drive.google.com') && (
                  <>
                    <div className="relative">
                      <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Busque na transcrição"
                        value={transcriptSearchTerm}
                        onChange={(e) => setTranscriptSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      />
                    </div>
                    
                    {/* Transcrição formatada com timestamps agrupados */}
                    <div className="text-sm text-gray-900 max-h-[800px] overflow-y-auto bg-white p-4 rounded border leading-relaxed">
                      {transcriptArray && transcriptArray.length > 0 ? (
                    <div className="space-y-4">
                      {getGroupedTranscript().map((group, index) => (
                        <div key={index} className="flex gap-4">
                          <div className="flex-shrink-0">
                            <span className="font-bold text-gray-700">{group.time}</span>
                          </div>
                          <div className="flex-1">
                            <p className="text-gray-900">
                              {highlightSearchTerm(group.text, transcriptSearchTerm)}
                            </p>
                          </div>
                        </div>
                      ))}
                      {transcriptSearchTerm.trim() && getGroupedTranscript().length === 0 && (
                        <p className="text-gray-500 text-center py-4">
                          Nenhum resultado encontrado para &quot;{transcriptSearchTerm}&quot;
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-500">
                      {formattedContent || transcriptContent || 'Transcrição disponível. Clique em "Baixar .srt" para visualizar.'}
                    </p>
                  )}
                    </div>
                  </>
                )}
              </div>
            ) : (
              /* Nenhuma transcrição - mostrar opções */
              <div className="space-y-4">
                {transcriptError ? (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-red-800 mb-1">Erro ao gerar transcrição</p>
                        <p className="text-xs text-red-700">{transcriptError}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm text-gray-700">
                      {currentMediaItem 
                        ? `Gerar transcrição automática para: "${currentMediaItem.title}"`
                        : 'Selecione um vídeo para gerar a transcrição'}
                    </p>
                    <p className="text-xs text-gray-500">
                      A transcrição será gerada automaticamente usando as legendas do YouTube.
                    </p>
                  </div>
                )}
                
                <button
                  onClick={handleTranscribe}
                  disabled={isTranscribing || !currentMediaItem}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isTranscribing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Gerando transcrição...
                    </>
                  ) : (
                    <>
                      <FileText className="w-4 h-4" />
                      Gerar Transcrição Automática
                    </>
                  )}
                </button>

                {transcriptError && (
                  <button
                    onClick={handleTranscribe}
                    disabled={isTranscribing}
                    className="w-full text-sm text-blue-600 hover:text-blue-800 font-medium disabled:opacity-50"
                  >
                    Tentar novamente
                  </button>
                )}

                <div className="pt-3 border-t border-gray-200">
                  <p className="text-xs text-gray-500 mb-2">
                    Ou solicite uma transcrição corrigida manualmente:
                  </p>
                  <a
                    href={whatsappLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center w-full px-4 py-2 bg-green-500 text-white rounded-md text-sm font-medium hover:bg-green-600 transition-colors"
                  >
                    Solicitar via WhatsApp
                  </a>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

