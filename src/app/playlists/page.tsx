'use client';

import { useState, useEffect } from 'react';
import { youtubePlaylists } from '@/data/youtubeData';
import { transcripts } from '@/data/transcriptsData';
import PlaylistCard from '@/components/PlaylistCard';
import SkeletonCard from '@/components/SkeletonCard';
import { Search, Calendar, ChevronDown, FileText } from 'lucide-react';

export default function PlaylistsPage() {
  const [playlists] = useState(youtubePlaylists);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [contentFilter, setContentFilter] = useState<'audio' | 'transcript' | 'english' | ''>('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [visibleCount, setVisibleCount] = useState(9);

  useEffect(() => {
    // Debug: verificar se os dados estão carregando
    console.log('Playlists carregadas:', playlists.length);
    
    // Timer mais curto para debug
    const timer = setTimeout(() => {
      console.log('Timer executado, setLoading(false)');
      setLoading(false);
    }, 500); // Reduzido para 500ms

    return () => clearTimeout(timer);
  }, [playlists.length]);

  // Extrair anos únicos para o filtro
  const availableYears = [...new Set(playlists.map(p => p.metadata.year))].sort((a, b) => b.localeCompare(a));

  const filteredPlaylists = playlists.filter(playlist => {
    const matchesSearch = playlist.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         playlist.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         playlist.metadata.location.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesYear = !filterYear || playlist.metadata.year === filterYear;
    const hasAudioContent =
      playlist.metadata.hasAudio === true ||
      playlist.items?.some(item => item.format === 'audio');
    const hasTranscriptContent = playlist.metadata.hasTranscription === true;
    
    // Detectar se é em inglês baseado no título
    const isEnglishContent = playlist.title.toLowerCase().includes('english') ||
                            playlist.title.toLowerCase().includes('inglês') ||
                            playlist.title.toLowerCase().includes('english teachings') ||
                            playlist.title.toLowerCase().includes('teachings in english');
    
    const matchesContent =
      contentFilter === '' ||
      (contentFilter === 'audio' ? hasAudioContent : 
       contentFilter === 'english' ? isEnglishContent : hasTranscriptContent);

    return matchesSearch && matchesYear && matchesContent;
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
    const maxCount = contentFilter === 'transcript' ? filteredTranscripts.length : filteredPlaylists.length;
    setVisibleCount(prev => Math.min(prev + 9, maxCount));
  };

  const visiblePlaylists = filteredPlaylists.slice(0, visibleCount);
  const hasMore = contentFilter === 'transcript' 
    ? visibleCount < filteredTranscripts.length 
    : visibleCount < filteredPlaylists.length;

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

        {/* Stats */}
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
                <p className="text-2xl font-bold text-gray-900">{playlists.reduce((acc, p) => acc + p.metadata.total_talks, 0)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-sm text-gray-600">
            {loading ? 'Carregando...' : `${filteredPlaylists.length} playlist${filteredPlaylists.length !== 1 ? 's' : ''} encontrada${filteredPlaylists.length !== 1 ? 's' : ''}`}
            {!loading && hasMore && (
              <span className="ml-2 text-blue-600">
                (mostrando {visibleCount} de {filteredPlaylists.length})
              </span>
            )}
          </p>
        </div>

        {/* Content Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(9)].map((_, index) => (
              <SkeletonCard key={index} />
            ))}
          </div>
        ) : (
          // Transcrições temporariamente ocultas
          // contentFilter === 'transcript' ? (
          //   // Transcrições Grid
          //   filteredTranscripts.length > 0 ? (
          //     <>
          //       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          //         {visibleTranscripts.map((transcript) => (
          //           <TranscriptCard 
          //             key={transcript.id} 
          //             transcript={transcript}
          //           />
          //         ))}
          //       </div>
          //       {/* Load More Button */}
          //       {hasMore && (
          //         <div className="flex justify-center mt-12">
          //           <button
          //             onClick={loadMore}
          //             className="inline-flex items-center gap-2 px-8 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg"
          //           >
          //             <ChevronDown className="w-5 h-5" />
          //             Ver mais transcrições
          //             <span className="text-red-200">
          //               ({filteredTranscripts.length - visibleCount} restantes)
          //             </span>
          //           </button>
          //         </div>
          //       )}
          //     </>
          //   ) : (
          //     <div className="text-center py-12">
          //       <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
          //         <FileText className="w-12 h-12 text-gray-400" />
          //       </div>
          //       <h3 className="text-xl font-semibold text-gray-900 mb-2">
          //         Nenhuma transcrição encontrada
          //       </h3>
          //       <p className="text-gray-600 mb-4">
          //         Tente ajustar seus termos de pesquisa
          //       </p>
          //       <button
          //         onClick={clearFilters}
          //         className="text-red-600 hover:text-red-800 font-medium"
          //       >
          //         Limpar filtros
          //       </button>
          //     </div>
          //   )
          // ) : (
          // Playlists Grid (código existente)
          filteredPlaylists.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {visiblePlaylists.map((playlist, index) => (
                  <PlaylistCard 
                    key={playlist.id} 
                    playlist={playlist} 
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
                Em breve os áudios dos ensinamentos estarão disponíveis.
              </h3>
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
