export interface AudioFile {
  videoId: string;
  filename: string;
  url: string;
  size: number;
  exists: boolean;
}

class AudioService {
  private audioSource: 'local' | 'google_drive';

  constructor() {
    // Em client-side, usar 'local' por padrão
    // Em server-side, ler de process.env
    if (typeof window === 'undefined') {
      this.audioSource = (process.env.AUDIO_SOURCE as 'local' | 'google_drive') || 'local';
    } else {
      // Client-side sempre usa API routes (que são local por enquanto)
      this.audioSource = 'local';
    }
  }

  /**
   * Buscar lista de áudios disponíveis para uma playlist
   */
  async getAudioFiles(playlistId: string): Promise<AudioFile[]> {
    if (this.audioSource === 'local') {
      return this.getLocalAudioFiles(playlistId);
    } else {
      // TODO: Implementar para Google Drive na Fase 2
      return this.getGoogleDriveAudioFiles(playlistId);
    }
  }

  /**
   * Buscar áudios locais via API route
   */
  private async getLocalAudioFiles(playlistId: string): Promise<AudioFile[]> {
    try {
      console.log(`[AudioService] 🌐 Buscando áudios para playlist: ${playlistId}`);
      const url = `/api/audio/list/${encodeURIComponent(playlistId)}`;
      console.log(`[AudioService] 📡 URL da requisição: ${url}`);
      
      const response = await fetch(url);
      console.log(`[AudioService] 📊 Status da resposta: ${response.status} ${response.statusText}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[AudioService] ❌ Erro ao buscar áudios: ${response.status} - ${errorText}`);
        return [];
      }
      
      const data = await response.json();
      console.log(`[AudioService] ✅ Dados recebidos:`, data);
      return data.audioFiles || [];
    } catch (error) {
      console.error('[AudioService] ❌ Erro ao buscar áudios locais:', error);
      return [];
    }
  }

  /**
   * Buscar áudios do Google Drive (futuro - Fase 2)
   */
  private async getGoogleDriveAudioFiles(playlistId: string): Promise<AudioFile[]> {
    // TODO: Implementar integração com Google Drive API na Fase 2
    console.warn('[AudioService] Google Drive não implementado ainda');
    return [];
  }

  /**
   * Verificar se um vídeo tem áudio disponível
   */
  async hasAudio(playlistId: string, videoId: string): Promise<boolean> {
    const audioFiles = await this.getAudioFiles(playlistId);
    return audioFiles.some(file => file.videoId === videoId);
  }

  /**
   * Obter URL do áudio para um vídeo específico
   */
  getAudioUrl(playlistId: string, videoId: string): string {
    if (this.audioSource === 'local') {
      return `/api/audio/${playlistId}/${videoId}`;
    } else {
      // TODO: Retornar URL do Google Drive na Fase 2
      return '';
    }
  }
}

export const audioService = new AudioService();

