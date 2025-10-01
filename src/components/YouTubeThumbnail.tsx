'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Play } from 'lucide-react';
import { useYouTubeThumbnail } from '@/hooks/useYouTubeThumbnail';

interface YouTubeThumbnailProps {
  playlistId: string;
  title: string;
  theme?: string;
  className?: string;
}

export default function YouTubeThumbnail({ playlistId, title, theme = 'Ensinamentos Gerais', className = '' }: YouTubeThumbnailProps) {
  const [imageError, setImageError] = useState(false);
  const [currentUrlIndex, setCurrentUrlIndex] = useState(0);
  const [isClient, setIsClient] = useState(false);

  const { videoData, loading, error } = useYouTubeThumbnail(playlistId);

  // Garantir que só execute no cliente
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Diferentes URLs de thumbnail do YouTube para tentar
  const thumbnailUrls = videoData ? [
    videoData.thumbnail,
    `https://img.youtube.com/vi/${videoData.videoId}/hqdefault.jpg`,
    `https://img.youtube.com/vi/${videoData.videoId}/mqdefault.jpg`,
    `https://img.youtube.com/vi/${videoData.videoId}/default.jpg`,
  ] : [];

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
      // Tentar próxima URL
      setCurrentUrlIndex(currentUrlIndex + 1);
    } else {
      // Todas as URLs falharam, usar fallback
      setImageError(true);
    }
  };

  // Mostrar loading durante busca dos dados
  if (!isClient || loading) {
    return (
      <div className={`w-full h-full bg-gradient-to-br ${getFallbackThumbnail(theme)} flex items-center justify-center ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600 mx-auto mb-2"></div>
          <p className="text-xs text-gray-600 font-medium">Carregando...</p>
        </div>
      </div>
    );
  }

  // Mostrar fallback durante SSR ou se não estiver no cliente
  if (error || imageError || !videoData || thumbnailUrls.length === 0) {
    return (
      <div className={`w-full h-full bg-gradient-to-br ${getFallbackThumbnail(theme)} flex items-center justify-center ${className}`}>
        <div className="text-center">
          <Play className="w-16 h-16 text-gray-600 mx-auto mb-2" />
          <p className="text-xs text-gray-600 font-medium">YouTube</p>
        </div>
      </div>
    );
  }

  return (
    <Image
      src={thumbnailUrls[currentUrlIndex]}
      alt={videoData.title || title}
      fill
      className="object-cover"
      onError={handleImageError}
      priority={currentUrlIndex === 0}
    />
  );
}
