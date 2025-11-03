'use client';

import { MediaItem } from '@/types';
import { FileText, X, Headphones } from 'lucide-react';
import { useRef, useEffect } from 'react';

interface AudioPlayerBottomBarProps {
  currentMediaItem: MediaItem | null;
  onClose: () => void;
  onSwitchToTranscript: () => void;
}

export default function AudioPlayerBottomBar({ 
  currentMediaItem, 
  onClose,
  onSwitchToTranscript 
}: AudioPlayerBottomBarProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const previousMediaUrl = useRef<string | null>(null);
  const wasPlaying = useRef<boolean>(false);
  const currentTime = useRef<number>(0);

  // Salvar estado quando o áudio está tocando
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentMediaItem) return;

    const handlePlay = () => {
      wasPlaying.current = true;
    };

    const handlePause = () => {
      wasPlaying.current = false;
      if (audio) {
        currentTime.current = audio.currentTime;
      }
    };

    const handleTimeUpdate = () => {
      if (audio && !audio.paused) {
        currentTime.current = audio.currentTime;
      }
    };

    // Se é o mesmo áudio, restaurar estado
    if (previousMediaUrl.current === currentMediaItem.media_url) {
      // Restaurar posição
      if (currentTime.current > 0 && Math.abs(audio.currentTime - currentTime.current) > 1) {
        audio.currentTime = currentTime.current;
      }
      // Restaurar reprodução se estava tocando
      if (wasPlaying.current && audio.paused) {
        // Pequeno delay para garantir que o elemento está pronto
        setTimeout(() => {
          if (audioRef.current && audioRef.current.paused && wasPlaying.current) {
            audioRef.current.play().catch(console.error);
          }
        }, 100);
      }
    } else {
      // Novo áudio - resetar
      wasPlaying.current = false;
      currentTime.current = 0;
      previousMediaUrl.current = currentMediaItem.media_url;
    }

    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('timeupdate', handleTimeUpdate);

    return () => {
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, [currentMediaItem]);

  // Debug: log para verificar o que está acontecendo
  console.log('[AudioPlayerBottomBar] Renderizando:', {
    hasCurrentMediaItem: !!currentMediaItem,
    format: currentMediaItem?.format,
    title: currentMediaItem?.title,
    media_url: currentMediaItem?.media_url,
    isAudio: currentMediaItem?.format === 'audio',
    startsWithApi: currentMediaItem?.media_url?.startsWith('/api/audio')
  });

  // Só mostrar se for áudio (verificar format ou URL)
  const isAudio = currentMediaItem?.format === 'audio' || currentMediaItem?.media_url?.startsWith('/api/audio');
  
  if (!currentMediaItem || !isAudio) {
    console.log('[AudioPlayerBottomBar] Não mostrando - condição não atendida', {
      hasCurrentMediaItem: !!currentMediaItem,
      format: currentMediaItem?.format,
      isAudio
    });
    return null;
  }

  console.log('[AudioPlayerBottomBar] ✅ Mostrando player fixo!');

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-gray-900 border-t border-gray-700 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center gap-4">
          {/* Área do Player */}
          <div className="flex-1 flex items-center gap-4">
            {/* Ícone ou Thumbnail */}
            <div className="flex-shrink-0 w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
              <Headphones className="w-6 h-6 text-white" />
            </div>

            {/* Informações e Player */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <h4 className="text-sm font-medium text-white truncate">
                  {currentMediaItem.title}
                </h4>
                <button
                  onClick={onClose}
                  className="flex-shrink-0 text-gray-400 hover:text-white transition-colors ml-2"
                  aria-label="Fechar player"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <audio
                ref={audioRef}
                controls
                className="w-full h-8"
                src={currentMediaItem.media_url}
                preload="metadata"
              >
                Seu navegador não suporta reprodução de áudio.
              </audio>
            </div>
          </div>

          {/* Botão para Transcrição */}
          <button
            onClick={onSwitchToTranscript}
            className="flex-shrink-0 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <FileText className="w-4 h-4" />
            Ver Transcrição
          </button>
        </div>
      </div>
    </div>
  );
}

