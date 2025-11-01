'use client';

import { useState, useEffect } from 'react';
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
      const videoUrl = currentMediaItem.media_url;

      // Se o ID contém hífen (formato playlist-id), extrair o videoId real da URL
      if (videoUrl && videoUrl.includes('youtube.com')) {
        const match = videoUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
        if (match && match[1]) {
          videoId = match[1];
        }
      }

      const response = await fetch('/api/transcribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          videoId: videoId,
          videoUrl: videoUrl,
        }),
      });

      const data: TranscriptResponse = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Erro ao transcrever vídeo');
      }

      // Sucesso
      setTranscriptUrl(data.transcriptUrl || null);
      setTranscriptContent(data.content || null);
      setFormattedContent(data.formattedContent || null);
      setTranscriptArray(data.transcriptArray || null);
      setTranscriptLang(data.lang || null);
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
      const response = await fetch('/api/transcribe/docx', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transcriptArray: transcriptArray,
          videoTitle: currentMediaItem?.title || 'Transcrição',
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

      // Verificar se o arquivo existe (opcional - pode fazer uma chamada leve)
      // Por enquanto, vamos deixar o usuário clicar no botão
    }
  }, [currentMediaItem]);

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
                  {transcriptUrl && (
                    <a
                      href={transcriptUrl}
                      download
                      className="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-md text-xs font-medium hover:bg-blue-700 transition-colors"
                    >
                      <Download className="w-3 h-3" />
                      Baixar .srt
                    </a>
                  )}
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
                
                <div className="text-xs text-gray-600 max-h-96 overflow-y-auto bg-gray-50 p-3 rounded border whitespace-pre-wrap font-mono leading-relaxed">
                  {formattedContent || transcriptContent || 'Transcrição disponível. Clique em "Baixar .srt" para visualizar.'}
                </div>
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

