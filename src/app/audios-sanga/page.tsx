'use client';

import React, { useState, useEffect, Suspense, useRef } from 'react';
import { Music, FolderOpen, Search, Loader2, AlertCircle, ChevronRight, ArrowLeft, Home, FileText, MessageCircle, Download, RefreshCw, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

interface AudioFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  streamUrl: string;
}

interface Folder {
  id: string;
  name: string;
  audioCount?: number;
}

interface TranscriptResponse {
  success: boolean;
  error?: string;
  content?: string;
  formattedContent?: string;
  transcriptArray?: Array<{ text: string; offset: number; duration?: number }>;
  transcriptUrl?: string;
  lang?: string;
  cached?: boolean;
}

const whatsappNumber = '5551999999999';

export default function AudiosSangaPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>}>
      <AudiosSangaContent />
    </Suspense>
  );
}

function AudiosSangaContent() {
  const searchParams = useSearchParams();
  const initialFolder = searchParams.get('folder');
  
  const [folders, setFolders] = useState<Folder[]>([]);
  const [rootAudios, setRootAudios] = useState<AudioFile[]>([]);
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [currentFolderName, setCurrentFolderName] = useState<string>('');
  const [folderAudios, setFolderAudios] = useState<AudioFile[]>([]);
  const [subfolders, setSubfolders] = useState<Folder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isConfigured, setIsConfigured] = useState<boolean | null>(null);
  const [foldersLoaded, setFoldersLoaded] = useState(false);

  // Estados para o layout de detalhes (dentro de pasta)
  const [selectedAudio, setSelectedAudio] = useState<AudioFile | null>(null);
  const [activeTab, setActiveTab] = useState<'audio' | 'transcript'>('audio');
  const [audioSearchTerm, setAudioSearchTerm] = useState('');

  // Estados para transcrição
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isLoadingTranscript, setIsLoadingTranscript] = useState(false);
  const [transcriptContent, setTranscriptContent] = useState<string | null>(null);
  const [formattedContent, setFormattedContent] = useState<string | null>(null);
  const [transcriptArray, setTranscriptArray] = useState<Array<{ text: string; offset: number; duration?: number }> | null>(null);
  const [transcriptError, setTranscriptError] = useState<string | null>(null);
  const [transcriptLang, setTranscriptLang] = useState<string | null>(null);
  const [transcriptSearchTerm, setTranscriptSearchTerm] = useState('');
  const [transcriptionLogs, setTranscriptionLogs] = useState<Array<{ type: 'info' | 'success' | 'error' | 'warning'; message: string; timestamp: Date }>>([]);

  const audioPlayerRef = useRef<HTMLAudioElement>(null);

  // Carregar lista de pastas inicial
  useEffect(() => {
    fetchFolders();
  }, []);

  // Abrir pasta da URL após carregar lista de pastas
  useEffect(() => {
    if (foldersLoaded && initialFolder && !currentFolder) {
      const folder = folders.find(f => f.id === initialFolder);
      if (folder) {
        fetchFolderContents(folder.id, folder.name);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [foldersLoaded, initialFolder, folders]);

  // Resetar transcrição quando mudar de áudio
  useEffect(() => {
    if (selectedAudio) {
      setTranscriptContent(null);
      setFormattedContent(null);
      setTranscriptArray(null);
      setTranscriptError(null);
      setTranscriptLang(null);
      setTranscriptSearchTerm('');
      setTranscriptionLogs([]);
      setIsLoadingTranscript(false);
    }
  }, [selectedAudio?.id]);

  const fetchFolders = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/drive/audio/sanga');
      const data = await response.json();

      if (response.status === 503) {
        setIsConfigured(false);
        setError(data.error || 'Audio Drive não configurado');
        return;
      }

      setIsConfigured(true);

      if (data.success) {
        setFolders(data.folders || []);
        setRootAudios(data.rootAudios || []);
        setFoldersLoaded(true);
      } else {
        setError(data.error || 'Erro ao carregar pastas');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro de conexão');
      setIsConfigured(true);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFolderContents = async (folderId: string, folderName: string) => {
    setIsLoading(true);
    setError(null);
    setCurrentFolder(folderId);
    setCurrentFolderName(folderName);
    setSelectedAudio(null);
    setActiveTab('audio');

    try {
      const response = await fetch(`/api/drive/audio/sanga?folder=${encodeURIComponent(folderName)}`);
      const data = await response.json();

      if (data.success) {
        const audios = data.audios || [];
        setFolderAudios(audios);
        setSubfolders(data.subfolders || []);
        if (audios.length > 0) {
          setSelectedAudio(audios[0]);
        }
      } else {
        setError(data.error || 'Erro ao carregar pasta');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro de conexão');
    } finally {
      setIsLoading(false);
    }
  };

  const goBack = () => {
    setCurrentFolder(null);
    setCurrentFolderName('');
    setFolderAudios([]);
    setSubfolders([]);
    setSelectedAudio(null);
    setActiveTab('audio');
    window.history.pushState({}, '', '/audios-sanga');
  };

  const cleanAudioName = (name: string): string => {
    return name.replace(/\.(mp3|m4a|wav|ogg|flac|aac)$/i, '');
  };

  const addLog = (type: 'info' | 'success' | 'error' | 'warning', message: string) => {
    setTranscriptionLogs(prev => [...prev, { type, message, timestamp: new Date() }]);
  };

  // Formatar tempo
  const formatTimeForDisplay = (milliseconds: number): string => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Agrupar segmentos de transcrição
  const groupTranscriptSegments = (segments: Array<{ text: string; offset: number; duration?: number }>): Array<{ time: string; text: string }> => {
    if (!segments || segments.length === 0) return [];
    const grouped: Array<{ time: string; text: string }> = [];
    const INTERVAL_MS = 60000;
    let currentGroup: { startTime: number; texts: string[] } | null = null;
    
    for (const segment of segments) {
      const segmentTime = segment.offset;
      if (!currentGroup || segmentTime - currentGroup.startTime >= INTERVAL_MS) {
        if (currentGroup && currentGroup.texts.length > 0) {
          grouped.push({ time: formatTimeForDisplay(currentGroup.startTime), text: currentGroup.texts.join(' ') });
        }
        currentGroup = { startTime: segmentTime, texts: [segment.text] };
      } else {
        if (currentGroup) currentGroup.texts.push(segment.text);
      }
    }
    if (currentGroup && currentGroup.texts.length > 0) {
      grouped.push({ time: formatTimeForDisplay(currentGroup.startTime), text: currentGroup.texts.join(' ') });
    }
    return grouped;
  };

  const highlightSearchTerm = (text: string, term: string): React.ReactNode => {
    if (!term.trim()) return text;
    const regex = new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, index) =>
      regex.test(part) ? <mark key={index} className="bg-yellow-200 text-gray-900">{part}</mark> : part
    );
  };

  const getGroupedTranscript = () => {
    if (!transcriptArray || transcriptArray.length === 0) return [];
    const grouped = groupTranscriptSegments(transcriptArray);
    if (!transcriptSearchTerm.trim()) return grouped;
    const searchLower = transcriptSearchTerm.toLowerCase();
    return grouped.filter(group => group.text.toLowerCase().includes(searchLower));
  };

  const handleTranscribe = async () => {
    if (!selectedAudio || isTranscribing) return;

    setIsTranscribing(true);
    setTranscriptError(null);
    setTranscriptionLogs([]);

    addLog('info', `Iniciando transcrição para: "${cleanAudioName(selectedAudio.name)}"`);

    try {
      addLog('info', 'Enviando áudio para transcrição...');
      addLog('info', `Arquivo: ${selectedAudio.name}`);

      const response = await fetch('/api/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioUrl: selectedAudio.streamUrl,
          audioTitle: cleanAudioName(selectedAudio.name),
          source: 'sanga',
          folderName: currentFolderName,
        }),
      });

      const data: TranscriptResponse = await response.json();

      if (!response.ok || !data.success) {
        addLog('error', data.error || 'Erro ao gerar transcrição');
        throw new Error(data.error || 'Erro ao gerar transcrição');
      }

      addLog('success', 'Transcrição gerada com sucesso!');

      if (data.transcriptArray && data.transcriptArray.length > 0) {
        setTranscriptArray(data.transcriptArray);
        setTranscriptLang(data.lang || null);
        const formatted = data.transcriptArray.map(item => {
          const text = item.text || '';
          if (!text || text.trim().length === 0) return '';
          const timeStr = formatTimeForDisplay(item.offset || 0);
          return `[${timeStr}] ${text.trim()}`;
        }).filter(Boolean).join('\n');
        setFormattedContent(formatted);
      } else if (data.content) {
        setTranscriptContent(data.content);
        setFormattedContent(data.formattedContent || data.content);
      }
    } catch (err) {
      setTranscriptError(err instanceof Error ? err.message : 'Erro desconhecido');
      addLog('error', err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleDownloadDocx = async () => {
    if (!transcriptArray || !selectedAudio) return;
    try {
      const groupedArray = groupTranscriptSegments(transcriptArray).map(group => {
        const timeParts = group.time.split(':');
        const hours = parseInt(timeParts[0]);
        const minutes = parseInt(timeParts[1]);
        const seconds = parseInt(timeParts[2]);
        const offset = (hours * 3600 + minutes * 60 + seconds) * 1000;
        return { text: group.text, offset, duration: 0 };
      });

      const response = await fetch('/api/transcribe/docx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcriptArray: groupedArray,
          videoTitle: cleanAudioName(selectedAudio.name),
          videoUrl: '',
          lang: transcriptLang || 'pt',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao gerar DOCX');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const safeTitle = cleanAudioName(selectedAudio.name).replace(/[^a-z0-9\s-]/gi, '').replace(/\s+/g, '-').substring(0, 50);
      a.download = `transcricao-${safeTitle}-${Date.now()}.docx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      alert(`Erro ao baixar documento: ${errorMessage}`);
    }
  };

  // Filtrar
  const filteredFolders = folders.filter(f => f.name.toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredRootAudios = rootAudios.filter(a => a.name.toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredSubfolders = subfolders.filter(f => f.name.toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredFolderAudios = folderAudios.filter(a =>
    cleanAudioName(a.name).toLowerCase().includes(audioSearchTerm.toLowerCase()) ||
    a.name.toLowerCase().includes(audioSearchTerm.toLowerCase())
  );

  // ====== RENDER: Lista de Pastas (Root) ======
  if (!currentFolder) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-gray-500 hover:text-gray-700"><Home size={20} /></Link>
              <ChevronRight size={16} className="text-gray-400" />
              <Link href="/playlists" className="text-gray-500 hover:text-gray-700 text-sm">Playlists</Link>
              <ChevronRight size={16} className="text-gray-400" />
              <h1 className="text-xl font-semibold text-gray-900">Áudios da Sanga</h1>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <div className="relative max-w-md">
              <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar pastas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {isLoading && (
            <div className="text-center py-16">
              <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto" />
              <p className="text-gray-600 mt-4">Carregando...</p>
            </div>
          )}

          {!isLoading && isConfigured === false && (
            <div className="text-center py-16 bg-white rounded-lg shadow-sm">
              <FolderOpen className="w-16 h-16 text-gray-400 mx-auto" />
              <h2 className="text-xl font-semibold text-gray-900 mt-4">Audio Drive não configurado</h2>
              <p className="text-gray-600 mt-2">Configure o acesso ao Google Drive.</p>
            </div>
          )}

          {!isLoading && isConfigured && error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
                <div>
                  <h3 className="text-lg font-medium text-red-800">Erro ao carregar</h3>
                  <p className="text-red-700 mt-1">{error}</p>
                  <button onClick={fetchFolders} className="mt-3 text-red-600 hover:text-red-800 font-medium text-sm">Tentar novamente</button>
                </div>
              </div>
            </div>
          )}

          {!isLoading && isConfigured && !error && (
            <div className="space-y-6">
              {filteredFolders.length > 0 && (
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Pastas ({filteredFolders.length})</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredFolders.map((folder) => (
                      <button
                        key={folder.id}
                        onClick={() => fetchFolderContents(folder.id, folder.name)}
                        className="flex items-center gap-4 p-4 bg-white rounded-lg shadow-sm border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all text-left"
                      >
                        <FolderOpen className="w-10 h-10 text-blue-500 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 truncate">{folder.name}</h3>
                          {folder.audioCount !== undefined && (
                            <p className="text-sm text-gray-500">{folder.audioCount} {folder.audioCount === 1 ? 'áudio' : 'áudios'}</p>
                          )}
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {filteredRootAudios.length > 0 && (
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Áudios</h2>
                  <div className="space-y-3">
                    {filteredRootAudios.map((audio) => (
                      <div key={audio.id} className="p-4 bg-white rounded-lg shadow-sm border border-gray-200">
                        <div className="flex items-start gap-3">
                          <Music className="w-8 h-8 text-blue-500 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-gray-900">{cleanAudioName(audio.name)}</h3>
                            <audio controls className="w-full mt-3" preload="none">
                              <source src={audio.streamUrl} type={audio.mimeType} />
                            </audio>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {filteredFolders.length === 0 && filteredRootAudios.length === 0 && (
                <div className="text-center py-16 bg-white rounded-lg shadow-sm">
                  <Music className="w-16 h-16 text-gray-400 mx-auto" />
                  <h2 className="text-xl font-semibold text-gray-900 mt-4">
                    {searchTerm ? 'Nenhum resultado encontrado' : 'Nenhum áudio disponível'}
                  </h2>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    );
  }

  // ====== RENDER: Dentro de Pasta - Layout 2 Colunas ======
  return (
    <div className="min-h-screen bg-gray-50 py-8 pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back */}
        <div className="mb-6 flex justify-between items-center">
          <button
            onClick={goBack}
            className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors font-medium"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Voltar às Pastas
          </button>
        </div>

        {isLoading ? (
          <div className="text-center py-16">
            <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto" />
            <p className="text-gray-600 mt-4">Carregando áudios...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-medium text-red-800">Erro ao carregar</h3>
                <p className="text-red-700 mt-1">{error}</p>
                <button onClick={() => fetchFolderContents(currentFolder!, currentFolderName)} className="mt-3 text-red-600 hover:text-red-800 font-medium text-sm">Tentar novamente</button>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            {/* Left Column - Logo + Audio Player */}
            <div className="lg:col-span-3 space-y-6">
              {/* Logo / Hero Area */}
              <div className="w-full bg-gradient-to-br from-amber-600 via-orange-500 to-yellow-500 rounded-lg overflow-hidden flex items-center justify-center min-h-[400px] relative">
                <div className="text-center text-white p-8">
                  <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <Music className="w-12 h-12 text-white" />
                  </div>
                  <h2 className="text-3xl font-bold mb-2">Ação Paramita</h2>
                  <p className="text-white/80 text-lg">Áudios da Sanga</p>
                  {selectedAudio && (
                    <div className="mt-8 bg-black/20 backdrop-blur-sm rounded-xl p-4 max-w-lg mx-auto">
                      <p className="text-white/60 text-xs uppercase tracking-wide mb-1">Reproduzindo agora</p>
                      <p className="text-white font-semibold text-lg leading-tight">{cleanAudioName(selectedAudio.name)}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Audio Player */}
              {selectedAudio && (
                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex items-start gap-3 mb-4">
                    <Music className="w-6 h-6 text-orange-500 flex-shrink-0 mt-1" />
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-gray-900">{cleanAudioName(selectedAudio.name)}</h3>
                      <p className="text-sm text-gray-500 mt-1">{currentFolderName}</p>
                    </div>
                  </div>
                  <audio
                    ref={audioPlayerRef}
                    controls
                    className="w-full"
                    preload="none"
                    key={selectedAudio.id}
                  >
                    <source src={selectedAudio.streamUrl} type={selectedAudio.mimeType} />
                    Seu navegador não suporta reprodução de áudio.
                  </audio>
                </div>
              )}

              {/* Folder Info */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-3">{currentFolderName}</h2>
                <p className="text-gray-700 mb-4">Coleção de áudios exclusivos da Sanga.</p>
                <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <Music className="w-4 h-4" />
                    <span>{folderAudios.length} {folderAudios.length === 1 ? 'áudio' : 'áudios'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Sidebar */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                {/* Tabs */}
                <div className="flex border-b">
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
                </div>

                <div className="p-4">
                  {/* ===== AUDIO TAB ===== */}
                  {activeTab === 'audio' && (
                    <div className="space-y-4">
                      <div className="relative">
                        <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Buscar nos áudios..."
                          value={audioSearchTerm}
                          onChange={(e) => setAudioSearchTerm(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      {/* Subfolders */}
                      {filteredSubfolders.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Subpastas</p>
                          {filteredSubfolders.map((folder) => (
                            <button
                              key={folder.id}
                              onClick={() => fetchFolderContents(folder.id, folder.name)}
                              className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-gray-50 transition-colors text-left"
                            >
                              <FolderOpen size={16} className="text-blue-500 flex-shrink-0" />
                              <span className="text-sm font-medium text-gray-900 truncate">{folder.name}</span>
                              <ChevronRight size={14} className="text-gray-400 ml-auto" />
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Audio List */}
                      {filteredFolderAudios.length > 0 && (
                        <div className="space-y-2 max-h-[500px] overflow-y-auto">
                          {filteredFolderAudios.map((audio) => (
                            <div
                              key={audio.id}
                              onClick={() => setSelectedAudio(audio)}
                              className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                                selectedAudio?.id === audio.id
                                  ? 'border-orange-500 bg-orange-50'
                                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                              }`}
                            >
                              <div className="flex items-start gap-2">
                                <Music size={16} className={`mt-0.5 flex-shrink-0 ${selectedAudio?.id === audio.id ? 'text-orange-500' : 'text-blue-500'}`} />
                                <div className="flex-1 min-w-0">
                                  <h4 className="text-sm font-medium text-gray-900 line-clamp-2">
                                    {cleanAudioName(audio.name)}
                                  </h4>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {filteredFolderAudios.length === 0 && filteredSubfolders.length === 0 && (
                        <div className="text-center py-8">
                          <Music className="w-12 h-12 text-gray-400 mx-auto" />
                          <p className="text-gray-600 text-sm mt-2">
                            {audioSearchTerm ? 'Nenhum áudio encontrado' : 'Nenhum áudio nesta pasta'}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ===== TRANSCRIPTION TAB ===== */}
                  {activeTab === 'transcript' && (
                    <div className="space-y-4">
                      {isLoadingTranscript ? (
                        <div className="text-center py-8 space-y-3">
                          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
                          <p className="text-sm text-gray-600">Carregando transcrição...</p>
                        </div>
                      ) : transcriptArray && transcriptArray.length > 0 ? (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <h3 className="text-sm font-medium text-gray-900 flex items-center gap-2">
                              <CheckCircle2 className="w-4 h-4 text-green-600" />
                              Transcrição: {selectedAudio ? cleanAudioName(selectedAudio.name) : ''}
                            </h3>
                            {transcriptLang && (
                              <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                                {transcriptLang.toUpperCase()}
                              </span>
                            )}
                          </div>

                          <div className="flex gap-2 flex-wrap">
                            <button
                              onClick={handleDownloadDocx}
                              className="inline-flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-md text-xs font-medium hover:bg-green-700 transition-colors"
                            >
                              <Download className="w-3 h-3" />
                              Baixar .docx
                            </button>
                            <button
                              onClick={handleTranscribe}
                              disabled={isTranscribing || !selectedAudio}
                              className="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-md text-xs font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <RefreshCw className={`w-3 h-3 ${isTranscribing ? 'animate-spin' : ''}`} />
                              {isTranscribing ? 'Gerando...' : 'Gerar novamente'}
                            </button>
                          </div>

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

                          <div className="text-sm text-gray-900 max-h-[800px] overflow-y-auto bg-white p-4 rounded border leading-relaxed">
                            <div className="space-y-4">
                              {getGroupedTranscript().map((group, index) => (
                                <div key={index} className="flex gap-4">
                                  <div className="flex-shrink-0">
                                    <span className="font-bold text-gray-700">{group.time}</span>
                                  </div>
                                  <div className="flex-1">
                                    <p className="text-gray-900">{highlightSearchTerm(group.text, transcriptSearchTerm)}</p>
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
                        <div className="space-y-4">
                          {!selectedAudio ? (
                            <div className="text-center py-8">
                              <Music className="w-12 h-12 text-gray-400 mx-auto" />
                              <p className="text-sm text-gray-600 mt-2">Selecione um áudio para gerar a transcrição</p>
                            </div>
                          ) : (
                            <>
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
                                    Gerar transcrição automática para: &quot;{cleanAudioName(selectedAudio.name)}&quot;
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    A transcrição será gerada automaticamente a partir do áudio selecionado.
                                  </p>
                                </div>
                              )}

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
                                disabled={isTranscribing || !selectedAudio}
                                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                                  href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(`Olá! Gostaria de solicitar a transcrição do áudio "${cleanAudioName(selectedAudio.name)}" da pasta "${currentFolderName}".`)}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center justify-center w-full px-4 py-2 bg-green-500 text-white rounded-md text-sm font-medium hover:bg-green-600 transition-colors"
                                >
                                  <MessageCircle className="w-4 h-4 mr-2" />
                                  Solicitar via WhatsApp
                                </a>
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
