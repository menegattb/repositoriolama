'use client';

import { useState, useEffect, useRef } from 'react';
import { Play } from 'lucide-react';

interface LazyYouTubeThumbnailProps {
  playlistId: string;
  title: string;
  theme?: string;
  className?: string;
  index?: number;
}

export default function LazyYouTubeThumbnail({ 
  playlistId, 
  title, 
  theme = 'Ensinamentos Gerais', 
  className = '',
  index = 0
}: LazyYouTubeThumbnailProps) {
  const [isVisible, setIsVisible] = useState(index < 9);
  const [imageError, setImageError] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (index < 9 || !imgRef.current) return;

    const currentRef = imgRef.current;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setTimeout(() => setIsVisible(true), 100);
            observer.unobserve(entry.target);
          }
        });
      },
      {
        rootMargin: '50px',
        threshold: 0.1
      }
    );

    observer.observe(currentRef);

    return () => {
      if (currentRef) observer.unobserve(currentRef);
    };
  }, [index]);

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

  // Mostrar fallback se não está visível ou houve erro
  if (!isVisible || imageError) {
    return (
      <div 
        ref={imgRef}
        className={`w-full h-full bg-gradient-to-br ${getFallbackThumbnail(theme)} flex items-center justify-center ${className}`}
      >
        <div className="text-center">
          <div className="w-16 h-16 bg-white/30 rounded-full flex items-center justify-center mx-auto mb-2">
            <Play className="w-8 h-8 text-gray-700" />
          </div>
          <p className="text-xs text-gray-700 font-medium">YouTube</p>
        </div>
      </div>
    );
  }

  // Usar iframe do YouTube para mostrar thumbnail (mesmo método do ReactPlayer)
  return (
    <div className={`w-full h-full ${className}`}>
      <iframe
        src={`https://www.youtube.com/embed/videoseries?list=${playlistId}&autoplay=0&mute=1&controls=0&showinfo=0&rel=0&modestbranding=1`}
        className="w-full h-full"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        title={title}
        onError={() => setImageError(true)}
      />
    </div>
  );
}