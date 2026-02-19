'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { Music, FolderOpen, Search, Loader2, AlertCircle, ChevronRight, ArrowLeft, Home } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { getYouTubePlaylists } from '@/data/youtubeData';
import { Playlist } from '@/types';

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
  displayName?: string;
  audioCount?: number;
}

export default function AudiosYoutubePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>}>
      <AudiosYoutubeContent />
    </Suspense>
  );
}

function AudiosYoutubeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialFolder = searchParams.get('folder');
  
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [currentFolder, setCurrentFolder] = useState<string | null>(initialFolder);
  const [currentFolderName, setCurrentFolderName] = useState<string>('');
  const [currentPlaylistId, setCurrentPlaylistId] = useState<string>(''); // ID da playlist do YouTube
  const [folderAudios, setFolderAudios] = useState<AudioFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isConfigured, setIsConfigured] = useState<boolean | null>(null);
  const [videoTitlesCache, setVideoTitlesCache] = useState<Record<string, string>>({});

  // Carregar playlists do YouTube para mapear IDs para nomes
  useEffect(() => {
    async function loadPlaylists() {
      try {
        const data = await getYouTubePlaylists();
        setPlaylists(data);
      } catch (error) {
        console.error('Erro ao carregar playlists:', error);
      }
    }
    loadPlaylists();
  }, []);

  // Carregar lista de pastas ou conteúdo da pasta inicial (após playlists carregarem)
  useEffect(() => {
    if (playlists.length === 0) return; // Aguardar playlists carregarem
    
    if (initialFolder) {
      // Se há uma pasta inicial, buscar seu conteúdo
      fetchFolderContentsByFolderId(initialFolder);
    } else {
      fetchFolders();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialFolder, playlists]);

  // Função para obter nome de exibição da pasta
  const getDisplayName = (folderName: string, playlistsList: Playlist[]): string => {
    // Tentar encontrar playlist correspondente pelo ID (cobre PL, FL, UU, etc.)
    const matchedPlaylist = playlistsList.find(p => p.id === folderName);
    if (matchedPlaylist) {
      return matchedPlaylist.title;
    }
    // Verificar se é numérico
    if (/^\d+$/.test(folderName)) {
      const indexedPlaylist = playlistsList[parseInt(folderName) - 1];
      return indexedPlaylist?.title || `Playlist ${folderName}`;
    }
    return folderName;
  };

  const fetchFolders = async () => {
    setIsLoading(true);
    setError(null);
    setCurrentFolder(null);
    setCurrentFolderName('');

    try {
      const response = await fetch('/api/drive/audio/youtube');
      const data = await response.json();

      if (response.status === 503) {
        setIsConfigured(false);
        setError(data.error || 'Audio Drive não configurado');
        return;
      }

      setIsConfigured(true);

      if (data.success) {
        // Mapear nomes de pastas para nomes de playlists
        const mappedFolders = (data.folders || []).map((f: Folder) => ({
          ...f,
          displayName: getDisplayName(f.name, playlists),
        }));
        setFolders(mappedFolders);
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

  const fetchFolderContentsByFolderId = async (folderId: string) => {
    setIsLoading(true);
    setError(null);
    setCurrentFolder(folderId);

    try {
      // Primeiro buscar as pastas para encontrar o nome da pasta
      const foldersResponse = await fetch('/api/drive/audio/youtube');
      const foldersData = await foldersResponse.json();

      if (foldersResponse.status === 503) {
        setIsConfigured(false);
        setError(foldersData.error || 'Audio Drive não configurado');
        return;
      }

      setIsConfigured(true);

      if (foldersData.success && foldersData.folders) {
        // Mapear nomes de pastas para nomes de playlists
        const mappedFolders = (foldersData.folders || []).map((f: Folder) => ({
          ...f,
          displayName: getDisplayName(f.name, playlists),
        }));
        setFolders(mappedFolders);
        
        const folder = mappedFolders.find((f: Folder) => f.id === folderId);
        if (folder) {
          setCurrentFolderName(folder.displayName || folder.name);
          setCurrentPlaylistId(folder.name); // Salvar ID da playlist (nome original da pasta)
          // Buscar áudios da pasta pelo número
          await fetchFolderContentsByNumber(folder.name);
        } else {
          setError('Pasta não encontrada');
          setIsLoading(false);
        }
      } else {
        setError(foldersData.error || 'Erro ao carregar pastas');
        setIsLoading(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro de conexão');
      setIsLoading(false);
    }
  };

  const fetchFolderContentsByNumber = async (folderNumber: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/drive/audio/youtube?folder=${encodeURIComponent(folderNumber)}`);
      const data = await response.json();

      if (data.success) {
        const audios = data.audios || [];
        setFolderAudios(audios);
        
        // Extrair IDs de vídeo dos nomes dos arquivos e buscar títulos (10-12 chars para cobrir edge cases)
        const videoIds = audios
          .map((a: AudioFile) => extractVideoIdFromFilename(a.name))
          .filter((id: string) => /^[a-zA-Z0-9_-]{10,12}$/.test(id));
        
        if (videoIds.length > 0) {
          await fetchVideoTitles(videoIds);
        }
      } else {
        setError(data.error || 'Erro ao carregar áudios');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro de conexão');
    } finally {
      setIsLoading(false);
    }
  };

  const selectFolder = async (folderId: string, displayName: string) => {
    setCurrentFolder(folderId);
    setCurrentFolderName(displayName);
    // Encontrar a pasta para obter o nome original (para a API)
    const folder = folders.find(f => f.id === folderId);
    if (folder) {
      setCurrentPlaylistId(folder.name); // Salvar ID da playlist (nome original da pasta)
      await fetchFolderContentsByNumber(folder.name); // Usar nome original para a API
    }
  };

  const goBack = () => {
    router.back();
  };

  // Extrair ID do vídeo do nome do arquivo de áudio
  const extractVideoIdFromFilename = (filename: string): string => {
    // Remover extensão (.mp3, .m4a, etc.)
    const withoutExt = filename.replace(/\.(mp3|m4a|wav|ogg|flac|aac)$/i, '');
    // Remover prefixos comuns (underscore, hífen, etc.)
    return withoutExt.replace(/^[_\-]+/, '');
  };

  // Função para extrair video ID de uma URL do YouTube
  const extractVideoIdFromUrl = (url: string): string | null => {
    if (!url) return null;
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/live\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
      /[?&]v=([a-zA-Z0-9_-]{11})/
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  // Função para buscar títulos de vídeos do YouTube
  const fetchVideoTitles = async (videoIds: string[]): Promise<void> => {
    // Aceitar IDs de 10-12 chars para cobrir possíveis edge cases na extração
    const idsToFetch = videoIds.filter(id => !videoTitlesCache[id] && /^[a-zA-Z0-9_-]{10,12}$/.test(id));
    if (idsToFetch.length === 0) return;

    try {
      const response = await fetch(`/api/youtube/videos/titles?ids=${idsToFetch.join(',')}`);
      if (response.ok) {
        const data = await response.json();
        if (data.titles) {
          setVideoTitlesCache(prev => ({ ...prev, ...data.titles }));
        }
      }
    } catch (error) {
      console.error('Erro ao buscar títulos de vídeos:', error);
    }
  };

  // Formatar nome do áudio - mapear ID do vídeo para título
  const formatAudioName = (name: string): string => {
    const filenameVideoId = extractVideoIdFromFilename(name);
    
    // 1. Primeiro, verificar no cache de títulos buscados do YouTube (match exato)
    if (videoTitlesCache[filenameVideoId]) {
      return videoTitlesCache[filenameVideoId];
    }
    
    // 1b. Verificar match parcial no cache (para IDs com 1 char a mais/menos ou truncados)
    for (const [cachedId, cachedTitle] of Object.entries(videoTitlesCache)) {
      if (cachedId.includes(filenameVideoId) && filenameVideoId.length >= 8) return cachedTitle;
      if (filenameVideoId.includes(cachedId) && cachedId.length >= 8) return cachedTitle;
      // startsWith para IDs truncados (ex: filename tem 10 chars, video ID real tem 11)
      if (cachedId.startsWith(filenameVideoId) && filenameVideoId.length >= 9) return cachedTitle;
      if (filenameVideoId.startsWith(cachedId) && cachedId.length >= 9) return cachedTitle;
    }
    
    // 2. Buscar a playlist atual
    const currentPlaylist = playlists.find(p => p.id === currentPlaylistId);
    
    if (currentPlaylist?.items) {
      // Buscar o vídeo correspondente
      const matchingVideo = currentPlaylist.items.find(item => {
        // Comparar diretamente por ID do item
        if (item.id === filenameVideoId) return true;
        
        // Verificar se o ID do item começa com o filename ID (truncado)
        if (item.id && item.id.startsWith(filenameVideoId) && filenameVideoId.length >= 9) return true;
        if (item.id && filenameVideoId.startsWith(item.id) && item.id.length >= 9) return true;
        
        // Verificar se o ID do item contém o filename ou vice-versa
        if (item.id && item.id.includes(filenameVideoId) && filenameVideoId.length >= 8) return true;
        if (item.id && filenameVideoId.includes(item.id) && item.id.length >= 8) return true;
        
        // Extrair e comparar videoId da URL do YouTube
        const urlVideoId = extractVideoIdFromUrl(item.media_url);
        if (urlVideoId && urlVideoId === filenameVideoId) return true;
        
        // Verificar se o filename contém o videoId da URL
        if (urlVideoId && filenameVideoId.includes(urlVideoId)) return true;
        
        // Verificar se o videoId da URL contém o filename (parcial/truncado)
        if (urlVideoId && urlVideoId.includes(filenameVideoId) && filenameVideoId.length >= 8) return true;
        
        // startsWith para IDs truncados
        if (urlVideoId && urlVideoId.startsWith(filenameVideoId) && filenameVideoId.length >= 9) return true;
        if (urlVideoId && filenameVideoId.startsWith(urlVideoId) && urlVideoId.length >= 9) return true;
        
        return false;
      });

      if (matchingVideo) {
        return matchingVideo.title;
      }
    }

    // Fallback: limpar o nome do arquivo
    return name.replace(/\.(mp3|m4a|wav|ogg|flac|aac)$/i, '').replace(/^[_\-]+/, '');
  };

  // Filtrar itens por termo de busca (buscar por displayName ou name)
  const filteredFolders = folders.filter(f =>
    (f.displayName || f.name).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredFolderAudios = folderAudios.filter(a => {
    const displayName = formatAudioName(a.name);
    return displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
           a.name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-gray-500 hover:text-gray-700">
                <Home size={20} />
              </Link>
              <ChevronRight size={16} className="text-gray-400" />
              <Link href="/playlists" className="text-gray-500 hover:text-gray-700 text-sm">
                Playlists
              </Link>
              <ChevronRight size={16} className="text-gray-400" />
              <h1 className="text-xl font-semibold text-gray-900">Áudios do YouTube</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Breadcrumb quando dentro de uma pasta */}
      {currentFolder && (
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <button
              onClick={goBack}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              <ArrowLeft size={16} />
              Voltar para lista de pastas
            </button>
            <p className="text-sm text-gray-600 mt-1">
              Playlist: <span className="font-medium">{currentFolderName}</span>
            </p>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar áudios ou pastas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-16">
            <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto" />
            <p className="text-gray-600 mt-4">Carregando...</p>
          </div>
        )}

        {/* Not Configured State */}
        {!isLoading && isConfigured === false && (
          <div className="text-center py-16 bg-white rounded-lg shadow-sm">
            <FolderOpen className="w-16 h-16 text-gray-400 mx-auto" />
            <h2 className="text-xl font-semibold text-gray-900 mt-4">Audio Drive não configurado</h2>
            <p className="text-gray-600 mt-2 max-w-md mx-auto">
              Para acessar os áudios, é necessário configurar o acesso ao Google Drive.
            </p>
            <div className="mt-4 p-4 bg-gray-50 rounded-lg inline-block">
              <p className="text-sm text-gray-700">
                Acesse <code className="bg-gray-200 px-2 py-1 rounded">/api/auth/audio-drive</code> para autenticar.
              </p>
            </div>
          </div>
        )}

        {/* Error State */}
        {!isLoading && isConfigured && error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-medium text-red-800">Erro ao carregar</h3>
                <p className="text-red-700 mt-1">{error}</p>
                <button
                  onClick={currentFolder ? () => fetchFolderContentsByNumber(currentFolderName) : fetchFolders}
                  className="mt-3 text-red-600 hover:text-red-800 font-medium text-sm"
                >
                  Tentar novamente
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Content - Lista de Pastas (Root) */}
        {!isLoading && isConfigured && !error && !currentFolder && (
          <div className="space-y-6">
            {/* Folders */}
            {filteredFolders.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Pastas de Playlists ({filteredFolders.length})
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredFolders.map((folder) => (
                    <button
                      key={folder.id}
                      onClick={() => selectFolder(folder.id, folder.displayName || folder.name)}
                      className="flex items-center gap-4 p-4 bg-white rounded-lg shadow-sm border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all text-left"
                    >
                      <FolderOpen className="w-10 h-10 text-red-500 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 truncate">{folder.displayName || folder.name}</h3>
                        {folder.audioCount !== undefined && (
                          <p className="text-sm text-gray-500">
                            {folder.audioCount} {folder.audioCount === 1 ? 'áudio' : 'áudios'}
                          </p>
                        )}
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {filteredFolders.length === 0 && (
              <div className="text-center py-16 bg-white rounded-lg shadow-sm">
                <Music className="w-16 h-16 text-gray-400 mx-auto" />
                <h2 className="text-xl font-semibold text-gray-900 mt-4">
                  {searchTerm ? 'Nenhum resultado encontrado' : 'Nenhuma pasta disponível'}
                </h2>
                <p className="text-gray-600 mt-2">
                  {searchTerm 
                    ? `Não encontramos resultados para "${searchTerm}"`
                    : 'As pastas de áudios do YouTube ainda não foram adicionadas.'}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Content - Dentro de uma Pasta */}
        {!isLoading && isConfigured && !error && currentFolder && (
          <div className="space-y-6">
            {/* Link para abrir na playlist */}
            {currentPlaylistId && currentPlaylistId.startsWith('PL') && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <Link
                  href={`/playlist/${currentPlaylistId}?tab=audio`}
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium"
                >
                  <Music className="w-5 h-5" />
                  Abrir playlist com aba de áudio
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            )}

            {/* Audio Files */}
            {filteredFolderAudios.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Áudios ({filteredFolderAudios.length})
                </h2>
                <div className="space-y-3">
                  {filteredFolderAudios.map((audio) => (
                    <div
                      key={audio.id}
                      className="p-4 bg-white rounded-lg shadow-sm border border-gray-200"
                    >
                      <div className="flex items-start gap-3">
                        <Music className="w-8 h-8 text-red-500 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900">{formatAudioName(audio.name)}</h3>
                          <audio controls className="w-full mt-3" preload="none">
                            <source src={audio.streamUrl} type={audio.mimeType} />
                            Seu navegador não suporta reprodução de áudio.
                          </audio>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty Folder */}
            {filteredFolderAudios.length === 0 && (
              <div className="text-center py-16 bg-white rounded-lg shadow-sm">
                <FolderOpen className="w-16 h-16 text-gray-400 mx-auto" />
                <h2 className="text-xl font-semibold text-gray-900 mt-4">
                  {searchTerm ? 'Nenhum resultado encontrado' : 'Pasta vazia'}
                </h2>
                <p className="text-gray-600 mt-2">
                  {searchTerm 
                    ? `Não encontramos resultados para "${searchTerm}"`
                    : 'Esta pasta não contém áudios.'}
                </p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
