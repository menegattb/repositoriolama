'use client';

import { useState, useEffect, useMemo } from 'react';
import { getYouTubePlaylists, getStandaloneVideos } from '@/data/youtubeData';
import { transcripts } from '@/data/transcriptsData';
import { Playlist, StandaloneVideo } from '@/types';
import PlaylistCard from '@/components/PlaylistCard';
import AudioFolderCard from '@/components/AudioFolderCard';
import VideoCard from '@/components/VideoCard';
import SkeletonCard from '@/components/SkeletonCard';
import { Search, Calendar, ChevronDown, FileText, Music, Loader2 } from 'lucide-react';

// Interface para pastas de áudio do Drive
interface AudioFolder {
  id: string;
  name: string;
  folderNumber?: string;
  audioCount?: number;
  source: 'youtube' | 'sanga';
  playlistTitle?: string;
}

export default function PlaylistsPage() {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [standaloneVideos, setStandaloneVideos] = useState<StandaloneVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingVideos, setLoadingVideos] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [contentFilter, setContentFilter] = useState<'audio' | 'transcript' | 'english' | 'standalone' | ''>('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [visibleCount, setVisibleCount] = useState(9);
  
  // Estados para áudios do Drive
  const [audioFolders, setAudioFolders] = useState<AudioFolder[]>([]);
  const [loadingAudios, setLoadingAudios] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [audioConfigured, setAudioConfigured] = useState<boolean | null>(null);

  // Buscar dados do YouTube da Hostinger
  useEffect(() => {
    async function loadPlaylists() {
      try {
        setLoading(true);
        console.log('[PlaylistsPage] Iniciando carregamento de playlists...');
        // Forçar refresh para garantir dados atualizados
        const data = await getYouTubePlaylists(true);
        console.log('[PlaylistsPage] Playlists recebidas:', data.length);
        setPlaylists(data);
        
        if (data.length === 0) {
          console.warn('[PlaylistsPage] ⚠️ Nenhuma playlist carregada. Verifique:');
          console.warn('  1. O arquivo JSON está acessível em: https://repositorio.acaoparamita.com.br/api/youtube-data.json');
          console.warn('  2. Não há erro de CORS no console');
          console.warn('  3. O arquivo JSON tem a estrutura correta');
        }
      } catch (error) {
        console.error('[PlaylistsPage] ❌ Erro ao carregar playlists:', error);
        // Manter array vazio em caso de erro
        setPlaylists([]);
      } finally {
        setLoading(false);
      }
    }

    loadPlaylists();
  }, []);

  // Buscar vídeos sem playlist
  useEffect(() => {
    async function loadStandaloneVideos() {
      try {
        setLoadingVideos(true);
        console.log('[PlaylistsPage] Buscando vídeos sem playlist...');
        const videos = await getStandaloneVideos();
        console.log('[PlaylistsPage] Vídeos sem playlist recebidos:', videos.length);
        setStandaloneVideos(videos);
      } catch (error) {
        console.error('[PlaylistsPage] ❌ Erro ao carregar vídeos sem playlist:', error);
        setStandaloneVideos([]);
      } finally {
        setLoadingVideos(false);
      }
    }

    loadStandaloneVideos();
  }, []);

  // Buscar pastas de áudio do Drive assim que playlists carregarem
  useEffect(() => {
    if (audioConfigured === null && !loading && playlists.length > 0) {
      fetchAudioFolders();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, playlists, audioConfigured]);

  const fetchAudioFolders = async () => {
    setLoadingAudios(true);
    setAudioError(null);

    try {
      const folders: AudioFolder[] = [];

      // Buscar catálogo de áudios para mapear pastas a playlists
      let audioCatalog: Record<string, string> = {};
      try {
        const catalogResponse = await fetch('/api/drive/audio/catalog');
        const catalogData = await catalogResponse.json();
        if (catalogData.success && catalogData.catalog) {
          // Catalog format: { "folderNumber": "playlistId", ... }
          audioCatalog = catalogData.catalog;
        }
      } catch {
        console.log('[PlaylistsPage] Catálogo de áudio não disponível, usando mapeamento por índice');
      }

      // Buscar pastas do YouTube
      const youtubeResponse = await fetch('/api/drive/audio/youtube');
      const youtubeData = await youtubeResponse.json();

      if (youtubeResponse.status === 503) {
        setAudioConfigured(false);
        setAudioError(youtubeData.error || 'Audio Drive não configurado');
        setLoadingAudios(false);
        return;
      }

      setAudioConfigured(true);

      if (youtubeData.success && youtubeData.folders) {
        youtubeData.folders.forEach((f: { id: string; name: string; audioCount?: number }) => {
          const folderName = f.name;
          let displayName = folderName;
          
          // Verificar se é numérico
          const isNumeric = /^\d+$/.test(folderName);
          
          // Tentar encontrar playlist correspondente pelo ID (cobre PL, FL, UU, etc.)
          const matchedPlaylistById = playlists.find(p => p.id === folderName);
          
          if (matchedPlaylistById) {
            displayName = matchedPlaylistById.title;
          } else if (isNumeric) {
            // Tentar encontrar playlist correspondente pelo catálogo ou índice
            const playlistId = audioCatalog[folderName];
            const matchedPlaylist = playlistId 
              ? playlists.find(p => p.id === playlistId)
              : playlists[parseInt(folderName) - 1]; // Fallback: usar índice
            
            displayName = matchedPlaylist?.title || `Playlist ${folderName}`;
          }
          
          folders.push({
            id: f.id,
            name: displayName,
            folderNumber: folderName,
            playlistTitle: displayName,
            audioCount: f.audioCount,
            source: 'youtube',
          });
        });
      }

      // Buscar pastas da Sanga
      const sangaResponse = await fetch('/api/drive/audio/sanga');
      const sangaData = await sangaResponse.json();

      if (sangaData.success && sangaData.folders) {
        sangaData.folders.forEach((f: { id: string; name: string; audioCount?: number }) => {
          folders.push({
            id: f.id,
            name: f.name,
            audioCount: f.audioCount,
            source: 'sanga',
          });
        });
      }

      console.log('[PlaylistsPage] Pastas de áudio carregadas:', folders.length);
      setAudioFolders(folders);
    } catch (error) {
      console.error('[PlaylistsPage] Erro ao carregar áudios:', error);
      setAudioError(error instanceof Error ? error.message : 'Erro ao carregar áudios');
      setAudioConfigured(true);
    } finally {
      setLoadingAudios(false);
    }
  };

  // Set de IDs de playlists que possuem áudio no Drive
  const playlistIdsWithAudio = useMemo(() => {
    const ids = new Set<string>();
    audioFolders
      .filter(f => f.source === 'youtube' && f.folderNumber)
      .forEach(f => { if (f.folderNumber) ids.add(f.folderNumber); });
    return ids;
  }, [audioFolders]);

  // Extrair anos únicos para o filtro (de playlists e vídeos standalone)
  const playlistYears = playlists.map(p => p.metadata.year);
  const videoYears = standaloneVideos.map(v => new Date(v.publishedAt).getFullYear().toString());
  const availableYears = [...new Set([...playlistYears, ...videoYears])].sort((a, b) => b.localeCompare(a));

  const filteredPlaylists = playlists.filter(playlist => {
    // Não mostrar playlists quando filtro standalone está ativo
    if (contentFilter === 'standalone') {
      return false;
    }
    
    const matchesSearch = playlist.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         playlist.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         playlist.metadata.location.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesYear = !filterYear || playlist.metadata.year === filterYear;
    const hasTranscriptContent = playlist.metadata.hasTranscription === true;
    
    // Detectar se é em inglês baseado no título
    const isEnglishContent = playlist.title.toLowerCase().includes('english') ||
                            playlist.title.toLowerCase().includes('inglês') ||
                            playlist.title.toLowerCase().includes('english teachings') ||
                            playlist.title.toLowerCase().includes('teachings in english');
    
    const matchesContent =
      contentFilter === '' ||
      (contentFilter === 'audio' ? playlistIdsWithAudio.has(playlist.id) : 
       contentFilter === 'english' ? isEnglishContent : hasTranscriptContent);

    return matchesSearch && matchesYear && matchesContent;
  });

  // Pastas Sanga filtradas (para modo áudio)
  const filteredSangaFolders = useMemo(() => {
    return audioFolders
      .filter(f => f.source === 'sanga')
      .filter(f => f.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [audioFolders, searchTerm]);

  // Combinar itens para o modo áudio: playlists com áudio + pastas Sanga
  const audioModeItems = useMemo(() => {
    if (contentFilter !== 'audio') return [];
    const items: Array<{ type: 'playlist'; playlist: Playlist } | { type: 'sanga'; folder: AudioFolder }> = [];
    
    // Playlists do YouTube com áudio
    filteredPlaylists.forEach(p => {
      items.push({ type: 'playlist', playlist: p });
    });
    
    // Pastas da Sanga
    filteredSangaFolders.forEach(f => {
      items.push({ type: 'sanga', folder: f });
    });
    
    return items;
  }, [contentFilter, filteredPlaylists, filteredSangaFolders]);

  // Filtrar vídeos standalone
  const filteredStandaloneVideos = standaloneVideos.filter(video => {
    const videoYear = new Date(video.publishedAt).getFullYear().toString();
    const matchesSearch = video.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         video.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesYear = !filterYear || videoYear === filterYear;
    
    return matchesSearch && matchesYear;
  });

  // Filtro para transcrições
  const filteredTranscripts = transcripts.filter(transcript => {
    const matchesSearch = transcript.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !categoryFilter || transcript.categories.includes(categoryFilter);
    return matchesSearch && matchesCategory;
  });

  // Reset visible count when filters change
  useEffect(() => {
    setVisibleCount(9);
  }, [searchTerm, filterYear, contentFilter, categoryFilter]);

  const clearFilters = () => {
    setSearchTerm('');
    setFilterYear('');
    setContentFilter('');
    setCategoryFilter('');
    setVisibleCount(9);
  };

  const loadMore = () => {
    let maxCount = 0;
    if (contentFilter === 'standalone') {
      maxCount = filteredStandaloneVideos.length;
    } else if (contentFilter === 'transcript') {
      maxCount = filteredTranscripts.length;
    } else if (contentFilter === 'audio') {
      maxCount = audioModeItems.length;
    } else {
      maxCount = filteredPlaylists.length;
    }
    setVisibleCount(prev => Math.min(prev + 9, maxCount));
  };

  const visiblePlaylists = filteredPlaylists.slice(0, visibleCount);
  const visibleStandaloneVideos = filteredStandaloneVideos.slice(0, visibleCount);
  const visibleAudioModeItems = audioModeItems.slice(0, visibleCount);
  
  let hasMore = false;
  if (contentFilter === 'standalone') {
    hasMore = visibleCount < filteredStandaloneVideos.length;
  } else if (contentFilter === 'transcript') {
    hasMore = visibleCount < filteredTranscripts.length;
  } else if (contentFilter === 'audio') {
    hasMore = visibleCount < audioModeItems.length;
  } else {
    hasMore = visibleCount < filteredPlaylists.length;
  }

  console.log('Renderizando - loading:', loading, 'playlists:', playlists.length, 'filtered:', filteredPlaylists.length);

  return (
    <div className="min-h-screen bg-primary-lightGray py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
               <h1 className="text-4xl md:text-5xl font-bold text-primary-charcoal mb-4">
                 Ensinamentos do Lama Padma Samten
               </h1>
               <p className="text-lg text-gray-600 mb-6 font-normal">
                 Explore a coleção de ensinamentos!
               </p>

          {/* Search and Filters */}
          <div className="space-y-4">
            {/* Search */}
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Pesquisar ensinamentos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4">
              <select
                value={filterYear}
                onChange={(e) => setFilterYear(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Todos os anos</option>
                {availableYears.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>

              {/* Filtro de categorias - apenas para transcrições */}
              {/* Temporariamente oculto */}
              {/* {contentFilter === 'transcript' && (
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  <option value="">Todas as categorias</option>
                  {availableCategories.map(categoryKey => {
                    const category = categories[categoryKey as keyof typeof categories];
                    return (
                      <option key={categoryKey} value={categoryKey}>
                        {category.name} ({category.count})
                      </option>
                    );
                  })}
                </select>
              )} */}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setContentFilter(prev => (prev === 'audio' ? '' : 'audio'))}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    contentFilter === 'audio'
                      ? 'bg-white border border-gray-400 text-gray-800 hover:bg-gray-100'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Áudios
                </button>
                <button
                  type="button"
                  onClick={() => setContentFilter(prev => (prev === 'english' ? '' : 'english'))}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    contentFilter === 'english'
                      ? 'bg-white border border-gray-400 text-gray-800 hover:bg-gray-100'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Ensinamentos em Inglês
                </button>
                <button
                  type="button"
                  onClick={() => setContentFilter(prev => (prev === 'standalone' ? '' : 'standalone'))}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    contentFilter === 'standalone'
                      ? 'bg-white border border-gray-400 text-gray-800 hover:bg-gray-100'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Videos Sem playlist
                </button>
                {/* Transcrições temporariamente ocultas */}
                {/* <button
                  type="button"
                  onClick={() => setContentFilter(prev => (prev === 'transcript' ? '' : 'transcript'))}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    contentFilter === 'transcript'
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Transcrições
                </button> */}
              </div>

              {(searchTerm || filterYear || contentFilter || categoryFilter) && (
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 text-blue-600 hover:text-blue-800 font-medium"
                >
                  Limpar filtros
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Stats - oculto quando filtro de áudio está ativo */}
        {contentFilter !== 'audio' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Calendar className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Playlists</p>
                  <p className="text-2xl font-bold text-gray-900">{playlists.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <FileText className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total de Vídeos</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {playlists.reduce((acc, p) => acc + (p.items?.length || 0), 0) + standaloneVideos.length}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-sm text-gray-600">
            {loading || loadingVideos || (loadingAudios && contentFilter === 'audio') ? 'Carregando...' : 
              contentFilter === 'standalone' 
                ? `${filteredStandaloneVideos.length} vídeo${filteredStandaloneVideos.length !== 1 ? 's' : ''} sem playlist encontrado${filteredStandaloneVideos.length !== 1 ? 's' : ''}`
                : contentFilter === 'audio'
                ? `${audioModeItems.length} item${audioModeItems.length !== 1 ? 's' : ''} com áudio encontrado${audioModeItems.length !== 1 ? 's' : ''}`
                : `${filteredPlaylists.length} playlist${filteredPlaylists.length !== 1 ? 's' : ''} encontrada${filteredPlaylists.length !== 1 ? 's' : ''}`
            }
          </p>
        </div>

        {/* Content Grid */}
        {loading || loadingVideos || (loadingAudios && contentFilter === 'audio') ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(9)].map((_, index) => (
              <SkeletonCard key={index} />
            ))}
          </div>
        ) : contentFilter === 'audio' ? (
          // Grid de cards com áudio (YouTube playlists + Sanga folders)
          audioConfigured === false ? (
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Music className="w-12 h-12 text-yellow-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Sistema de áudios não configurado
              </h3>
              <p className="text-gray-600 mb-4">
                O sistema de áudios do Google Drive ainda não foi configurado.
              </p>
            </div>
          ) : audioError ? (
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Music className="w-12 h-12 text-red-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Erro ao carregar áudios
              </h3>
              <p className="text-gray-600 mb-4">{audioError}</p>
              <button
                onClick={fetchAudioFolders}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                Tentar novamente
              </button>
            </div>
          ) : visibleAudioModeItems.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {visibleAudioModeItems.map((item, index) => {
                  if (item.type === 'playlist') {
                    return (
                      <PlaylistCard
                        key={item.playlist.id}
                        playlist={item.playlist}
                        index={index}
                        hasAudio={true}
                        audioMode={true}
                      />
                    );
                  } else {
                    return (
                      <AudioFolderCard
                        key={item.folder.id}
                        id={item.folder.id}
                        name={item.folder.name}
                        audioCount={item.folder.audioCount}
                        source="sanga"
                        href={`/audios-sanga?folder=${item.folder.id}`}
                        index={index}
                      />
                    );
                  }
                })}
              </div>

              {hasMore && (
                <div className="flex justify-center mt-12">
                  <button
                    onClick={loadMore}
                    className="inline-flex items-center gap-2 px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg"
                  >
                    <ChevronDown className="w-5 h-5" />
                    Ver mais
                    <span className="text-blue-200">
                      ({audioModeItems.length - visibleCount} restantes)
                    </span>
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12 bg-white rounded-lg shadow-sm">
              <Music className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Nenhum item com áudio disponível</p>
            </div>
          )
        ) : contentFilter === 'standalone' ? (
          // Vídeos sem playlist
          filteredStandaloneVideos.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {visibleStandaloneVideos.map((video, index) => (
                  <VideoCard 
                    key={video.id} 
                    video={video} 
                    index={index}
                  />
                ))}
              </div>

              {/* Load More Button */}
              {hasMore && (
                <div className="flex justify-center mt-12">
                  <button
                    onClick={loadMore}
                    className="inline-flex items-center gap-2 px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg"
                  >
                    <ChevronDown className="w-5 h-5" />
                    Ver mais vídeos
                    <span className="text-blue-200">
                      ({filteredStandaloneVideos.length - visibleCount} restantes)
                    </span>
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Nenhum vídeo sem playlist encontrado
              </h3>
              <p className="text-gray-600 mb-4">
                Tente ajustar seus termos de pesquisa
              </p>
              <button
                onClick={clearFilters}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                Limpar filtros
              </button>
            </div>
          )
        ) : (
          // Playlists Grid
          filteredPlaylists.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {visiblePlaylists.map((playlist, index) => (
                  <PlaylistCard 
                    key={playlist.id} 
                    playlist={playlist} 
                    index={index}
                    hasAudio={playlistIdsWithAudio.has(playlist.id)}
                  />
                ))}
              </div>

              {/* Load More Button */}
              {hasMore && (
                <div className="flex justify-center mt-12">
                  <button
                    onClick={loadMore}
                    className="inline-flex items-center gap-2 px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg"
                  >
                    <ChevronDown className="w-5 h-5" />
                    Ver mais ensinamentos
                    <span className="text-blue-200">
                      ({filteredPlaylists.length - visibleCount} restantes)
                    </span>
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Nenhuma playlist encontrada
              </h3>
              <p className="text-gray-600 mb-4">
                Tente ajustar seus termos de pesquisa
              </p>
              <button
                onClick={clearFilters}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                Limpar filtros
              </button>
            </div>
          )
        )}
      </div>
    </div>
  );
}
