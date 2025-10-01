'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Play } from 'lucide-react';

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

  // Garantir que só execute no cliente
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Gerar um ID de vídeo baseado no ID da playlist (método determinístico)
  const generateVideoId = (playlistId: string) => {
    // Usar hash simples para gerar um ID consistente
    let hash = 0;
    for (let i = 0; i < playlistId.length; i++) {
      const char = playlistId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    
    // Gerar um ID de 11 caracteres baseado no hash
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
      // Tentar próxima URL
      setCurrentUrlIndex(currentUrlIndex + 1);
    } else {
      // Todas as URLs falharam, usar fallback
      setImageError(true);
    }
  };

  // Mostrar fallback durante SSR ou se não estiver no cliente
  if (!isClient || imageError) {
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
      alt={title}
      fill
      className="object-cover"
      onError={handleImageError}
      priority={currentUrlIndex === 0}
    />
  );
}
