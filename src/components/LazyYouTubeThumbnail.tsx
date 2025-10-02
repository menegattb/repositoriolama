'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Play } from 'lucide-react';

interface LazyYouTubeThumbnailProps {
  playlistId: string;
  title: string;
  theme?: string;
  className?: string;
}

export default function LazyYouTubeThumbnail({ playlistId, title, theme = 'Ensinamentos Gerais', className = '' }: LazyYouTubeThumbnailProps) {
  const [imageError, setImageError] = useState(false);
  const [currentUrlIndex, setCurrentUrlIndex] = useState(0);
  const [isClient, setIsClient] = useState(false);
  const [shouldLoad, setShouldLoad] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);

  // Garantir que só execute no cliente
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Intersection Observer para detectar quando a imagem está visível
  useEffect(() => {
    if (!isClient || !imgRef.current) return;

    const currentRef = imgRef.current;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Delay pequeno para evitar carregar muitas imagens de uma vez
            setTimeout(() => setShouldLoad(true), 100);
            observer.unobserve(entry.target);
          }
        });
      },
      {
        rootMargin: '50px', // Começar a carregar 50px antes de ficar visível
        threshold: 0.1
      }
    );

    observer.observe(currentRef);

    return () => {
      observer.unobserve(currentRef);
    };
  }, [isClient]);

  // Gerar um ID de vídeo baseado no ID da playlist (método determinístico)
  const generateVideoId = (playlistId: string) => {
    let hash = 0;
    for (let i = 0; i < playlistId.length; i++) {
      const char = playlistId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
    let result = '';
    let num = Math.abs(hash);
    
    for (let i = 0; i < 11; i++) {
      result += chars[num % chars.length];
      num = Math.floor(num / chars.length);
    }
    
    return result;
  };

  const videoId = generateVideoId(playlistId);

  // Diferentes URLs de thumbnail do YouTube para tentar
  const thumbnailUrls = [
    `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
    `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
    `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
    `https://img.youtube.com/vi/${videoId}/default.jpg`,
  ];

  const getFallbackThumbnail = (theme: string) => {
    const themeColors = {
      'Meditação': 'from-blue-100 to-blue-200',
      'Retiro': 'from-green-100 to-green-200', 
      'Estudo': 'from-purple-100 to-purple-200',
      'Palestra': 'from-orange-100 to-orange-200',
      'Curso': 'from-red-100 to-red-200',
      'Sutras': 'from-indigo-100 to-indigo-200',
      'Cinco Elementos': 'from-yellow-100 to-yellow-200',
      'Relações': 'from-pink-100 to-pink-200',
      'Budismo': 'from-gray-100 to-gray-200',
      'Educação': 'from-teal-100 to-teal-200',
      'Psicologia': 'from-cyan-100 to-cyan-200',
      'Mundo Corporativo': 'from-slate-100 to-slate-200',
    };
    return themeColors[theme as keyof typeof themeColors] || 'from-blue-100 to-purple-100';
  };

  const handleImageError = () => {
    if (currentUrlIndex < thumbnailUrls.length - 1) {
      setCurrentUrlIndex(currentUrlIndex + 1);
    } else {
      setImageError(true);
    }
  };

  // Mostrar placeholder durante SSR ou se não estiver visível
  if (!isClient || !shouldLoad) {
    return (
      <div 
        ref={imgRef}
        className={`w-full h-full bg-gradient-to-br ${getFallbackThumbnail(theme)} flex items-center justify-center ${className}`}
      >
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center mx-auto mb-2">
            <Play className="w-8 h-8 text-gray-500" />
          </div>
          <p className="text-xs text-gray-600 font-medium">YouTube</p>
        </div>
      </div>
    );
  }

  // Mostrar fallback se todas as URLs falharam
  if (imageError) {
    return (
      <div className={`w-full h-full bg-gradient-to-br ${getFallbackThumbnail(theme)} flex items-center justify-center ${className}`}>
        <div className="text-center">
          <Play className="w-16 h-16 text-gray-600 mx-auto mb-2" />
          <p className="text-xs text-gray-600 font-medium">YouTube</p>
        </div>
      </div>
    );
  }

  // Carregar imagem real
  return (
    <Image
      src={thumbnailUrls[currentUrlIndex]}
      alt={title}
      fill
      className="object-cover"
      onError={handleImageError}
      loading="lazy"
      priority={false}
    />
  );
}
