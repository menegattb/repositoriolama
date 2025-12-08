'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Playlist, MediaItem, Transcript, TranscriptResponse } from '@/types';
import { Search, Clock, Download, CheckCircle2, MessageCircle, Loader2, FileText, AlertCircle } from 'lucide-react';
import { extractFileIdFromUrl } from '@/lib/driveUtils';

interface SidebarProps {
  playlist: Playlist;
  currentMediaItem: MediaItem | null;
  onMediaItemSelect?: (item: MediaItem) => void;
}

export default function Sidebar({ 
  playlist, 
  currentMediaItem, 
  onMediaItemSelect
}: SidebarProps) {
  const [activeTab, setActiveTab] = useState<'playlist' | 'transcript' | 'audio'>('playlist');
  const [searchTerm, setSearchTerm] = useState('');
  const [transcriptSearchTerm, setTranscriptSearchTerm] = useState('');
  const [playlistUrl, setPlaylistUrl] = useState('');
  
  // Estados para transcrição automática
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isLoadingTranscript, setIsLoadingTranscript] = useState(false);
  const [transcriptUrl, setTranscriptUrl] = useState<string | null>(null);
  const [transcriptContent, setTranscriptContent] = useState<string | null>(null);
  const [formattedContent, setFormattedContent] = useState<string | null>(null);
  const [transcriptArray, setTranscriptArray] = useState<Array<{ text: string; offset: number; duration?: number }> | null>(null);
  const [transcriptError, setTranscriptError] = useState<string | null>(null);
  const [transcriptLang, setTranscriptLang] = useState<string | null>(null);
  const [transcriptionLogs, setTranscriptionLogs] = useState<Array<{ type: 'info' | 'success' | 'error' | 'warning'; message: string; timestamp: Date }>>([]);
  const [driveFileId, setDriveFileId] = useState<string | null>(null);
  
  // Ref para controlar requisições em andamento e prevenir múltiplos cliques
  const abortControllerRef = useRef<AbortController | null>(null);
  const isProcessingRef = useRef<boolean>(false);

  useEffect(() => {
    setPlaylistUrl(window.location.href);
  }, []);

  // Limpar requisições em andamento quando o vídeo mudar ou componente desmontar
  useEffect(() => {
    return () => {
      // Cancelar requisição em andamento ao desmontar ou mudar vídeo
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      isProcessingRef.current = false;
    };
  }, [currentMediaItem?.id]);

  // Log quando os vídeos são atualizados (para debug)
  useEffect(() => {
    const realVideos = playlist.items?.filter(v => 
      v.id && 
      v.id.length === 11 && 
      !v.id.includes('-') && 
      /^[a-zA-Z0-9_-]{11}$/.test(v.id)
    ) || [];
    
    if (realVideos.length > 0 && !isTranscribing) {
      console.log('[Sidebar] 📹 Vídeos reais detectados:', {
        total: realVideos.length,
        firstVideoId: realVideos[0]?.id,
        currentMediaItemId: currentMediaItem?.id,
      });
    }
  }, [playlist.items, currentMediaItem?.id, isTranscribing]);

  const matchesSearch = (item: MediaItem) =>
    item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.description.toLowerCase().includes(searchTerm.toLowerCase());

  const filteredItems = playlist.items?.filter(matchesSearch) || [];
  const audioItems = playlist.items?.filter(item => item.format === 'audio') || [];
  const filteredAudioItems = audioItems.filter(matchesSearch);
  const whatsappNumber = '5548991486176';

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  // Verificar se está tudo ok para transcrever
  const canTranscribe = (): boolean => {
    // Não pode transcrever se não tiver vídeo selecionado
    if (!currentMediaItem) {
      return false;
    }

    // Verificar se o ID é um videoId válido do YouTube (11 caracteres, sem hífen/underscore)
    const isValidYouTubeVideoId = currentMediaItem.id && 
      currentMediaItem.id.length === 11 && 
      !currentMediaItem.id.includes('-') && 
      !currentMediaItem.id.includes('_') &&
      /^[a-zA-Z0-9_-]{11}$/.test(currentMediaItem.id);

    // Se já tem ID válido, pode transcrever
    if (isValidYouTubeVideoId) {
      return true;
    }

    // Se tem ID mock (formato playlist-id-numero), verificar se há vídeos reais carregados
    const hasMockId = currentMediaItem.id.includes('-') && /^\d+$/.test(currentMediaItem.id.split('-').pop() || '');
    
    if (hasMockId) {
      // Verificar se há vídeos reais carregados na playlist
      const hasRealVideos = playlist.items?.some(v => 
        v.id && 
        v.id.length === 11 && 
        !v.id.includes('-') && 
        !v.id.includes('_') &&
        /^[a-zA-Z0-9_-]{11}$/.test(v.id)
      ) || false;

      return hasRealVideos;
    }

    // Se não é mock nem válido, não pode transcrever
    return false;
  };

  const getTranscribeButtonMessage = (): string => {
    if (!currentMediaItem) {
      return 'Selecione um vídeo para gerar a transcrição';
    }

    const isValidYouTubeVideoId = currentMediaItem.id && 
      currentMediaItem.id.length === 11 && 
      !currentMediaItem.id.includes('-') && 
      !currentMediaItem.id.includes('_') &&
      /^[a-zA-Z0-9_-]{11}$/.test(currentMediaItem.id);

    if (isValidYouTubeVideoId) {
      return `Gerar transcrição automática para: "${currentMediaItem.title}"`;
    }

    const hasMockId = currentMediaItem.id.includes('-') && /^\d+$/.test(currentMediaItem.id.split('-').pop() || '');
    
    if (hasMockId) {
      const hasRealVideos = playlist.items?.some(v => 
        v.id && 
        v.id.length === 11 && 
        !v.id.includes('-') && 
        !v.id.includes('_') &&
        /^[a-zA-Z0-9_-]{11}$/.test(v.id)
      ) || false;

      if (!hasRealVideos) {
        return 'Aguardando vídeos serem carregados da API do YouTube...';
      }
    }

    return `Gerar transcrição automática para: "${currentMediaItem.title}"`;
  };

  // Função auxiliar para aguardar vídeos serem carregados
  const waitForVideosToLoad = async (maxWaitTime = 10000, checkInterval = 500): Promise<boolean> => {
    const startTime = Date.now();
    let attempt = 0;
    
    console.log('[Sidebar] ⏳ Iniciando espera por vídeos (max:', maxWaitTime, 'ms)...');
    
    while (Date.now() - startTime < maxWaitTime) {
      attempt++;
      
      // Verificar se há vídeos reais carregados (com videoIds válidos)
      const realVideos = playlist.items?.filter(v => 
        v.id && 
        v.id.length === 11 && 
        !v.id.includes('-') && 
        !v.id.includes('_') &&
        /^[a-zA-Z0-9_-]{11}$/.test(v.id)
      ) || [];
      
      const hasRealVideos = realVideos.length > 0;
      
      if (hasRealVideos) {
        console.log(`[Sidebar] ✅ Vídeos reais detectados após ${attempt * checkInterval}ms (${realVideos.length} vídeos)`);
        return true;
      }
      
      // Log a cada 2 segundos
      if (attempt % 4 === 0) {
        console.log(`[Sidebar] ⏳ Aguardando... (${Math.floor((Date.now() - startTime) / 1000)}s) - Total de itens: ${playlist.items?.length || 0}`);
        if (playlist.items && playlist.items.length > 0) {
          console.log('[Sidebar] 📹 Primeiros IDs:', playlist.items.slice(0, 3).map(v => ({ id: v.id, title: v.title?.substring(0, 30) })));
        }
      }
      
      // Aguardar antes de verificar novamente
      await new Promise(resolve => setTimeout(resolve, checkInterval));
    }
    
    console.log('[Sidebar] ⚠️ Timeout aguardando vídeos serem carregados após', maxWaitTime, 'ms');
    console.log('[Sidebar] 📊 Estado final:', {
      totalItems: playlist.items?.length || 0,
      itemsIds: playlist.items?.slice(0, 5).map(v => v.id) || [],
      currentMediaItemId: currentMediaItem?.id
    });
    return false;
  };

  // Função auxiliar para adicionar log
  const addLog = (type: 'info' | 'success' | 'error' | 'warning', message: string) => {
    setTranscriptionLogs(prev => [...prev, { type, message, timestamp: new Date() }]);
    console.log(`[TRANSCRIBE ${type.toUpperCase()}] ${message}`);
  };

  // Função para transcrever vídeo usando Supadata API
  const handleTranscribe = async () => {
    // Proteção contra múltiplos cliques simultâneos
    if (isTranscribing || isProcessingRef.current) {
      console.log('[Sidebar] ⚠️ Transcrição já em andamento, ignorando clique duplicado');
      return;
    }

    if (!currentMediaItem) {
      setTranscriptError('Nenhum vídeo selecionado');
      return;
    }

    // Cancelar requisição anterior se existir
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Criar novo AbortController para esta requisição
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    // Marcar como processando
    isProcessingRef.current = true;
    setIsTranscribing(true);
    setTranscriptError(null);
    setTranscriptUrl(null);
    setTranscriptContent(null);
    setFormattedContent(null);
    setTranscriptArray(null);
    setTranscriptLang(null);
    setTranscriptionLogs([]); // Limpar logs anteriores

    addLog('info', `Iniciando transcrição para: "${currentMediaItem.title}"`);

    try {
      // Extrair videoId do media_url ou usar o id diretamente
      let videoId = currentMediaItem.id;
      let videoUrl = currentMediaItem.media_url;

      // Se o vídeo atual tem ID mock (formato playlist-id-numero), aguardar vídeos serem carregados
      const hasMockId = videoId.includes('-') && /^\d+$/.test(videoId.split('-').pop() || '');
      
      if (hasMockId) {
        addLog('info', 'Aguardando vídeos serem carregados da API do YouTube...');
        console.log('[Sidebar] ⏳ Vídeo tem ID mock, aguardando vídeos serem carregados da API do YouTube...');
        console.log('[Sidebar] 📊 Estado inicial:', {
          currentMediaItemId: currentMediaItem.id,
          currentMediaItemTitle: currentMediaItem.title,
          playlistItemsCount: playlist.items?.length || 0,
          playlistItemsIds: playlist.items?.slice(0, 3).map(v => ({ id: v.id, title: v.title?.substring(0, 30) })) || []
        });
        
        const videosLoaded = await waitForVideosToLoad(10000); // Aguardar até 10 segundos
        
        if (videosLoaded) {
          addLog('success', 'Vídeos carregados com sucesso!');
          // Se os vídeos foram carregados, tentar atualizar o currentMediaItem
          // Procurar pelo vídeo correto usando o título ou índice
          const realVideos = playlist.items?.filter(v => 
            v.id && 
            v.id.length === 11 && 
            !v.id.includes('-') && 
            /^[a-zA-Z0-9_-]{11}$/.test(v.id)
          ) || [];
          
          if (realVideos.length > 0) {
            // Tentar encontrar pelo título primeiro
            let matchingVideo = realVideos.find(v => v.title === currentMediaItem.title);
            
            // Se não encontrar pelo título, usar o primeiro vídeo (assumindo que é o mesmo índice)
            if (!matchingVideo && realVideos[0]) {
              matchingVideo = realVideos[0];
              console.log('[Sidebar] 📹 Usando primeiro vídeo real encontrado:', matchingVideo.id);
            }
            
            if (matchingVideo) {
              addLog('success', `Vídeo identificado: ${matchingVideo.id}`);
              console.log('[Sidebar] ✅ Vídeo real encontrado após carregamento:', {
                oldId: currentMediaItem.id,
                newId: matchingVideo.id,
                title: matchingVideo.title
              });
              // Atualizar o currentMediaItem através do callback
              if (onMediaItemSelect) {
                onMediaItemSelect(matchingVideo);
              }
              // Usar o vídeo encontrado para transcrição
              videoId = matchingVideo.id;
              videoUrl = matchingVideo.media_url || `https://www.youtube.com/watch?v=${matchingVideo.id}`;
              console.log('[Sidebar] ✅ Usando vídeo real atualizado:', videoId);
            }
          }
        } else {
          addLog('warning', 'Vídeos ainda não foram carregados. Tentando continuar...');
          console.warn('[Sidebar] ⚠️ Vídeos ainda não foram carregados após espera de 10 segundos');
          console.warn('[Sidebar] 💡 Possíveis causas:');
          console.warn('[Sidebar]   1. YOUTUBE_API_KEY não configurada ou servidor não reiniciado');
          console.warn('[Sidebar]   2. API do YouTube está lenta ou com problemas');
          console.warn('[Sidebar]   3. Playlist não existe ou está privada');
          // Continuar mesmo assim - tentar encontrar o vídeo correto
        }
      }

      addLog('info', 'Extraindo informações do vídeo...');
      console.log('[Sidebar] 🔍 Iniciando transcrição:', {
        originalId: currentMediaItem.id,
        originalUrl: currentMediaItem.media_url,
        title: currentMediaItem.title,
        isPlaylistUrl: currentMediaItem.media_url?.includes('/playlist'),
        hasWatchUrl: currentMediaItem.media_url?.includes('watch?v=')
      });

      // PRIMEIRO: Sempre tentar extrair videoId da URL (como funcionava antes)
      // Tentar extrair de qualquer formato de URL do YouTube
      if (videoUrl) {
        // Formato 1: watch?v=VIDEO_ID
        let match = videoUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
        if (match && match[1]) {
          videoId = match[1];
          videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
          addLog('success', `ID do vídeo identificado: ${videoId}`);
          console.log('[Sidebar] ✅ VideoId extraído da URL (formato watch):', videoId);
        } else {
          // Formato 2: playlist com ?v=VIDEO_ID
          match = videoUrl.match(/[?&]v=([^&\n?#]+)/);
          if (match && match[1] && match[1].length === 11) {
            videoId = match[1];
            videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
            addLog('success', `ID do vídeo identificado: ${videoId}`);
            console.log('[Sidebar] ✅ VideoId extraído da URL de playlist:', videoId);
          }
        }
      }

      // Verificar se o ID já é um videoId válido do YouTube (11 caracteres, sem hífen/underscore)
      const isValidYouTubeVideoId = videoId && 
        videoId.length === 11 && 
        !videoId.includes('-') && 
        !videoId.includes('_') &&
        /^[a-zA-Z0-9_-]{11}$/.test(videoId);

      if (isValidYouTubeVideoId) {
        console.log('[Sidebar] ✅ ID já é um videoId válido do YouTube:', videoId);
        // Garantir que temos uma URL válida
        if (!videoUrl || videoUrl.includes('/playlist') || !videoUrl.includes('watch?v=')) {
          videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
        }
      } else {

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
            
            console.log('[Sidebar] 🔍 Buscando vídeo real:', {
              videoIndex,
              totalItems: playlist.items?.length || 0,
              currentMediaItemId: currentMediaItem.id,
              currentMediaItemTitle: currentMediaItem.title
            });
            
            // Tentar encontrar pelo índice primeiro
            if (playlist.items && playlist.items.length > videoIndex) {
              const candidateVideo = playlist.items[videoIndex];
              console.log('[Sidebar] 📹 Vídeo candidato no índice:', {
                index: videoIndex,
                id: candidateVideo.id,
                title: candidateVideo.title,
                isValid: candidateVideo.id && 
                  candidateVideo.id.length === 11 && 
                  !candidateVideo.id.includes('-') && 
                  /^[a-zA-Z0-9_-]{11}$/.test(candidateVideo.id)
              });
              
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
              
              console.log('[Sidebar] 📹 Vídeos reais encontrados na playlist:', {
                total: realVideosInPlaylist.length,
                ids: realVideosInPlaylist.map(v => v.id).slice(0, 5)
              });
              
              if (realVideosInPlaylist.length > videoIndex && realVideosInPlaylist[videoIndex]) {
                realVideo = realVideosInPlaylist[videoIndex];
              }
            }
            
            // ÚLTIMA TENTATIVA: Tentar encontrar pelo título do currentMediaItem
            if (!realVideo && playlist.items && currentMediaItem.title) {
              console.log('[Sidebar] 🔍 Tentando encontrar pelo título:', currentMediaItem.title);
              const videoByTitle = playlist.items.find(v => 
                v.title === currentMediaItem.title &&
                v.id && 
                v.id.length === 11 && 
                !v.id.includes('-') && 
                /^[a-zA-Z0-9_-]{11}$/.test(v.id)
              );
              
              if (videoByTitle) {
                realVideo = videoByTitle;
                console.log('[Sidebar] ✅ Vídeo encontrado pelo título!');
              }
            }
            
            if (realVideo) {
              // Encontrou vídeo real já carregado!
              addLog('success', `Vídeo identificado: ${realVideo.id}`);
              videoId = realVideo.id;
              videoUrl = realVideo.media_url || `https://www.youtube.com/watch?v=${videoId}`;
              console.log('[Sidebar] ✅ VideoId real encontrado nos vídeos já carregados:', videoId);
            } else {
              // Não encontrou nos vídeos carregados
              // ÚLTIMA TENTATIVA: Se a URL do media_url for de playlist com parâmetro ?v=, tentar extrair
              if (videoUrl && videoUrl.includes('playlist') && videoUrl.includes('?v=')) {
                const videoMatch = videoUrl.match(/[?&]v=([^&\n?#]+)/);
                if (videoMatch && videoMatch[1]) {
                  videoId = videoMatch[1];
                  videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
                  console.log('[Sidebar] ✅ VideoId extraído da URL de playlist:', videoId);
                }
              }
              
              // Se ainda não tiver videoId válido, tentar uma última vez aguardar
              if (!videoId || videoId.length !== 11 || !/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
                console.log('[Sidebar] ⚠️ Vídeo real ainda não foi carregado. Detalhes:', {
                  videoIndex,
                  totalItems: playlist.items?.length || 0,
                  itemsIds: playlist.items?.map(v => ({ id: v.id, title: v.title, media_url: v.media_url })).slice(0, 3) || [],
                  mediaUrl: currentMediaItem.media_url,
                  isPlaylistUrl: currentMediaItem.media_url?.includes('/playlist')
                });
                
                // Tentar aguardar mais um pouco (última tentativa)
                console.log('[Sidebar] ⏳ Última tentativa: aguardando mais 3 segundos...');
                const videosLoaded = await waitForVideosToLoad(3000, 300);
                
                if (videosLoaded) {
                  // Tentar encontrar novamente após aguardar
                  const realVideosAfterWait = playlist.items?.filter(v => 
                    v.id && 
                    v.id.length === 11 && 
                    !v.id.includes('-') && 
                    /^[a-zA-Z0-9_-]{11}$/.test(v.id)
                  ) || [];
                  
                  if (realVideosAfterWait.length > videoIndex && realVideosAfterWait[videoIndex]) {
                    videoId = realVideosAfterWait[videoIndex].id;
                    videoUrl = realVideosAfterWait[videoIndex].media_url || `https://www.youtube.com/watch?v=${videoId}`;
                    addLog('success', `Vídeo identificado após espera: ${videoId}`);
                    console.log('[Sidebar] ✅ VideoId encontrado após espera adicional:', videoId);
                  }
                }
                
                // Se ainda não encontrou, mostrar erro
                if (!videoId || videoId.length !== 11 || !/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
                  addLog('error', 'Não foi possível identificar o vídeo');
                  const isPlaylistUrl = currentMediaItem.media_url?.includes('/playlist') && !currentMediaItem.media_url?.includes('watch?v=');
                  if (isPlaylistUrl) {
                    throw new Error('Não foi possível identificar o vídeo. Os vídeos da playlist ainda não foram carregados da API do YouTube. Verifique se YOUTUBE_API_KEY está configurada no servidor e aguarde alguns segundos antes de tentar novamente.');
                  } else {
                    throw new Error('O vídeo ainda não foi carregado da API do YouTube. Aguarde alguns segundos e tente novamente.');
                  }
                }
              }
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
        addLog('error', 'Não foi possível identificar o ID do vídeo');
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

      addLog('info', `Enviando requisição para API de transcrição...`);
      addLog('info', `URL do vídeo: ${videoUrl}`);
      console.log('[Sidebar] ✅ Enviando para API:', { videoId, videoUrl, playlistId: playlist.id });

      // Verificar se a requisição foi cancelada antes de enviar
      if (signal.aborted) {
        console.log('[Sidebar] ⚠️ Requisição cancelada antes de enviar');
        return;
      }

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
        signal: signal, // Adicionar signal para poder cancelar
      });

      addLog('info', 'Aguardando resposta da API...');
      
      // Verificar se a requisição foi cancelada durante o processamento
      if (signal.aborted) {
        console.log('[Sidebar] ⚠️ Requisição cancelada durante processamento');
        return;
      }

      const data: TranscriptResponse = await response.json();

      // Verificar novamente após receber resposta
      if (signal.aborted) {
        console.log('[Sidebar] ⚠️ Requisição cancelada após receber resposta');
        return;
      }

      if (!response.ok || !data.success) {
        addLog('error', data.error || 'Erro ao transcrever vídeo');
        throw new Error(data.error || 'Erro ao transcrever vídeo');
      }

      addLog('success', 'Transcrição recebida com sucesso!');
      
      // Verificar se houve erro no upload do Drive
      const dataWithDrive = data as TranscriptResponse & { 
        fromDrive?: boolean; 
        driveDocxUrl?: string;
        driveFileId?: string;
        driveUploadError?: string;
        cached?: boolean;
      };
      
      // Se veio do cache, verificar se está fazendo upload para o Drive
      if (dataWithDrive.cached && !dataWithDrive.fromDrive) {
        addLog('info', 'Verificando se precisa fazer upload para o Google Drive...');
      }
      
      if (dataWithDrive.driveUploadError) {
        addLog('warning', `Transcrição gerada, mas erro ao salvar no Drive: ${dataWithDrive.driveUploadError}`);
        console.warn('[Sidebar] ⚠️ Erro no upload do Drive:', dataWithDrive.driveUploadError);
        // Mostrar aviso mas continuar - a transcrição foi gerada mesmo assim
        setTranscriptError(`⚠️ Transcrição gerada, mas erro ao salvar no Drive: ${dataWithDrive.driveUploadError}`);
      } else if (dataWithDrive.fromDrive && dataWithDrive.driveDocxUrl) {
        addLog('success', `Transcrição salva no Google Drive!`);
        addLog('info', `Link: ${dataWithDrive.driveDocxUrl}`);
      } else if (dataWithDrive.driveDocxUrl) {
        addLog('success', 'Transcrição salva no Google Drive!');
      }

      // Sucesso
      // Sempre definir conteúdo formatado e array, mesmo se vier do Drive
      setTranscriptUrl(data.transcriptUrl || null);
      setTranscriptContent(data.content || null);
      setFormattedContent(data.formattedContent || null);
      setTranscriptArray(data.transcriptArray || null);
      setTranscriptLang(data.lang || null);
      
      // Se vier do Drive e tiver URL do Drive, usar ela como transcriptUrl principal
      if (dataWithDrive.fromDrive && dataWithDrive.driveDocxUrl) {
        setTranscriptUrl(dataWithDrive.driveDocxUrl);
        // Extrair fileId da URL ou usar o driveFileId se disponível
        const fileId = dataWithDrive.driveFileId || extractFileIdFromUrl(dataWithDrive.driveDocxUrl);
        if (fileId) {
          setDriveFileId(fileId);
        }
        console.log('[Sidebar] ✅ Transcrição salva no Drive:', dataWithDrive.driveDocxUrl);
      } else if (dataWithDrive.driveDocxUrl) {
        // Upload bem-sucedido mas não veio do cache do Drive
        setTranscriptUrl(dataWithDrive.driveDocxUrl);
        const fileId = dataWithDrive.driveFileId || extractFileIdFromUrl(dataWithDrive.driveDocxUrl);
        if (fileId) {
          setDriveFileId(fileId);
        }
      } else if (!dataWithDrive.driveDocxUrl && dataWithDrive.driveUploadError) {
        console.warn('[Sidebar] ⚠️ Drive upload falhou, usando URL alternativa');
        setDriveFileId(null);
      }
      
      addLog('success', 'Processo concluído com sucesso!');
    } catch (error) {
      // Ignorar erros de cancelamento (AbortError)
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('[Sidebar] ℹ️ Requisição cancelada pelo usuário');
        return;
      }

      let errorMessage = 'Erro desconhecido ao transcrever';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      addLog('error', errorMessage);
      console.error('[Sidebar] Erro ao transcrever:', error);
      setTranscriptError(errorMessage);
    } finally {
      // Limpar flags de processamento
      isProcessingRef.current = false;
      setIsTranscribing(false);
      abortControllerRef.current = null;
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
      setIsLoadingTranscript(true); // Iniciar carregamento

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
            const dataWithDrive = data as TranscriptResponse & { 
              fromDrive?: boolean; 
              transcriptUrl?: string;
              driveFileId?: string;
            };
            if (dataWithDrive.fromDrive && dataWithDrive.transcriptUrl) {
              setTranscriptUrl(dataWithDrive.transcriptUrl);
              const fileId = dataWithDrive.driveFileId || extractFileIdFromUrl(dataWithDrive.transcriptUrl);
              if (fileId) {
                setDriveFileId(fileId);
              }
              // SEMPRE usar transcriptArray do Drive se disponível (padronização)
              if (data.transcriptArray && data.transcriptArray.length > 0) {
                console.log('[Sidebar] ✅ transcriptArray encontrado do Drive, populando estado...');
                setTranscriptArray(data.transcriptArray);
                setTranscriptLang(data.lang || null);
                // Gerar formattedContent a partir do transcriptArray
                const formatted = data.transcriptArray.map(item => {
                  const text = item.text || '';
                  if (!text || text.trim().length === 0) return '';
                  const timeStr = formatTimeForDisplay(item.offset || 0);
                  return `[${timeStr}] ${text.trim()}`;
                }).filter(Boolean).join('\n');
                setFormattedContent(formatted);
                setIsLoadingTranscript(false); // Parar carregamento
              } else {
                // Se não tiver transcriptArray no JSON, limpar estados e permitir gerar nova transcrição
                console.log('[Sidebar] ⚠️ transcriptArray não encontrado no JSON do Drive. Será necessário gerar nova transcrição.');
                setTranscriptArray(null);
                setTranscriptContent(null);
                setFormattedContent(null);
                setTranscriptUrl(null);
                setDriveFileId(null);
                setIsLoadingTranscript(false); // Parar carregamento
              }
            } else {
              // Se vier do cache local ou outra fonte, só usar se tiver transcriptArray
              if (data.transcriptArray && data.transcriptArray.length > 0) {
                setTranscriptArray(data.transcriptArray);
                setTranscriptLang(data.lang || null);
                setTranscriptUrl(data.transcriptUrl || null);
                // Gerar formattedContent a partir do transcriptArray
                const formatted = data.transcriptArray.map(item => {
                  const text = item.text || '';
                  if (!text || text.trim().length === 0) return '';
                  const timeStr = formatTimeForDisplay(item.offset || 0);
                  return `[${timeStr}] ${text.trim()}`;
                }).filter(Boolean).join('\n');
                setFormattedContent(formatted);
                setIsLoadingTranscript(false); // Parar carregamento
              } else {
                // Se não tiver transcriptArray, limpar estados
                console.log('[Sidebar] ⚠️ transcriptArray não disponível. Será necessário gerar nova transcrição.');
                setTranscriptArray(null);
                setTranscriptContent(null);
                setFormattedContent(null);
                setTranscriptUrl(null);
                setDriveFileId(null);
                setIsLoadingTranscript(false); // Parar carregamento
              }
            }
          } else {
            // Não encontrou transcrição
            setIsLoadingTranscript(false); // Parar carregamento
          }
        } catch {
          // Silenciosamente ignorar erros - a transcrição simplesmente não existe ainda
          console.log('[Sidebar] Transcrição não encontrada, será necessário gerar');
          setIsLoadingTranscript(false); // Parar carregamento mesmo em caso de erro
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
              <div className="text-center py-8 space-y-4">
                <p className="text-gray-600 text-sm">
                  Todos os audios foram baixados e estão sendo colocados na plataforma. Solicite este audio via WhatsApp
                </p>
                <button
                  onClick={() => {
                    const message = encodeURIComponent(`Olá! Gostaria de solicitar o áudio da playlist "${playlist.title}".`);
                    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${message}`;
                    window.open(whatsappUrl, '_blank');
                  }}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  Solicitar Áudio
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'transcript' && (
          <div className="space-y-4">
            {/* Mostrar carregamento enquanto busca */}
            {isLoadingTranscript ? (
              <div className="text-center py-8 space-y-3">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
                <p className="text-sm text-gray-600">Carregando transcrição...</p>
                <p className="text-xs text-gray-500">Buscando no Google Drive...</p>
              </div>
            ) : transcriptArray && transcriptArray.length > 0 ? (
              /* Mostrar transcrição quando tiver transcriptArray */
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
                
                {/* Botão para baixar .docx */}
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={handleDownloadDocx}
                    className="inline-flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-md text-xs font-medium hover:bg-green-700 transition-colors"
                  >
                    <Download className="w-3 h-3" />
                    Baixar .docx
                  </button>
                </div>

                {/* Buscador e transcrição formatada - layout padronizado */}
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
                </div>
              </div>
            ) : (
              /* Quando não tem transcriptArray - mostrar logs e botão de solicitar */
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
                      {getTranscribeButtonMessage()}
                    </p>
                    <p className="text-xs text-gray-500">
                      {canTranscribe() 
                        ? 'A transcrição será gerada automaticamente usando as legendas do YouTube.'
                        : 'Aguarde os vídeos serem carregados da API do YouTube antes de transcrever.'}
                    </p>
                  </div>
                )}
                
                {/* Área de logs durante o processo */}
                {transcriptionLogs.length > 0 && (
                  <div className="p-3 bg-gray-50 border border-gray-200 rounded-md max-h-48 overflow-y-auto">
                    <p className="text-xs font-medium text-gray-700 mb-2">Progresso:</p>
                    <div className="space-y-1">
                      {transcriptionLogs.map((log, index) => (
                        <div 
                          key={index} 
                          className={`text-xs flex items-start gap-2 ${
                            log.type === 'success' ? 'text-green-700' :
                            log.type === 'error' ? 'text-red-700' :
                            log.type === 'warning' ? 'text-yellow-700' :
                            'text-gray-600'
                          }`}
                        >
                          <span className="flex-shrink-0">
                            {log.type === 'success' && '✓'}
                            {log.type === 'error' && '✗'}
                            {log.type === 'warning' && '⚠'}
                            {log.type === 'info' && '•'}
                          </span>
                          <span className="flex-1">{log.message}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <button
                  onClick={handleTranscribe}
                  disabled={isTranscribing || !canTranscribe()}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title={!canTranscribe() ? 'Aguarde os vídeos serem carregados' : undefined}
                >
                  {isTranscribing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    <>
                      <FileText className="w-4 h-4" />
                      Solicitar Transcrição
                    </>
                  )}
                </button>

                {transcriptError && (
                  <button
                    onClick={handleTranscribe}
                    disabled={isTranscribing || !canTranscribe()}
                    className="w-full text-sm text-blue-600 hover:text-blue-800 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    title={!canTranscribe() ? 'Aguarde os vídeos serem carregados' : undefined}
                  >
                    Tentar novamente
                  </button>
                )}

                <div className="pt-3 border-t border-gray-200">
                  <p className="text-xs text-gray-500 mb-2">
                    Ou solicite uma transcrição corrigida manualmente:
                  </p>
                  <a
                    href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(`Olá! Gostaria de solicitar a transcrição do vídeo "${currentMediaItem?.title || ''}".`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center w-full px-4 py-2 bg-green-500 text-white rounded-md text-sm font-medium hover:bg-green-600 transition-colors"
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
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

