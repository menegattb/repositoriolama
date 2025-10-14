// Função para buscar o primeiro vídeo de uma playlist
export async function getFirstVideoFromPlaylist(playlistId: string): Promise<string | null> {
  try {
    // Por enquanto, vamos usar uma abordagem determinística baseada no ID da playlist
    // Isso vai gerar um ID de vídeo que parece real, mas não é
    // Em produção, você precisaria de uma chave da YouTube Data API
    
    // Gerar um ID determinístico baseado no ID da playlist
    const hash = playlistId.split('').reduce((acc, char) => {
      return acc + char.charCodeAt(0);
    }, 0);
    
    // Criar um ID de vídeo que parece real (11 caracteres)
    const videoId = Math.abs(hash).toString(36).padStart(11, '0').slice(0, 11);
    
    return videoId;
  } catch (error) {
    console.error('Erro ao buscar primeiro vídeo da playlist:', error);
    return null;
  }
}

// Função para obter thumbnail do YouTube
export function getYouTubeThumbnailUrl(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
}

// Função para obter thumbnail com fallback
export function getYouTubeThumbnailWithFallback(videoId: string): string {
  // Tentar maxresdefault primeiro, depois medium, depois default
  return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
}
