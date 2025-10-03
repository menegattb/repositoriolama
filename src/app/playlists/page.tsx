'use client';

import { useState, useEffect } from 'react';
import { youtubePlaylists } from '@/data/youtubeData';
import PlaylistCard from '@/components/PlaylistCard';
import SkeletonCard from '@/components/SkeletonCard';
import { Search, Calendar, MapPin, Video, ChevronDown } from 'lucide-react';

export default function PlaylistsPage() {
  const [playlists] = useState(youtubePlaylists);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [filterLocation, setFilterLocation] = useState('');
  const [filterType, setFilterType] = useState('');
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
  
  // Extrair localizações únicas para o filtro
  const availableLocations = [...new Set(playlists.map(p => p.metadata.location))].sort();

  const filteredPlaylists = playlists.filter(playlist => {
    const matchesSearch = playlist.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         playlist.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         playlist.metadata.location.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesYear = !filterYear || playlist.metadata.year === filterYear;
    const matchesLocation = !filterLocation || playlist.metadata.location === filterLocation;
    const matchesType = !filterType || playlist.metadata.format === filterType;

    return matchesSearch && matchesYear && matchesLocation && matchesType;
  });

  // Reset visible count when filters change
  useEffect(() => {
    setVisibleCount(9);
  }, [searchTerm, filterYear, filterLocation, filterType]);

  const clearFilters = () => {
    setSearchTerm('');
    setFilterYear('');
    setFilterLocation('');
    setFilterType('');
    setVisibleCount(9);
  };

  const loadMore = () => {
    setVisibleCount(prev => Math.min(prev + 9, filteredPlaylists.length));
  };

  const visiblePlaylists = filteredPlaylists.slice(0, visibleCount);
  const hasMore = visibleCount < filteredPlaylists.length;

  console.log('Renderizando - loading:', loading, 'playlists:', playlists.length, 'filtered:', filteredPlaylists.length);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Playlists do YouTube
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            Explore nossa coleção de playlists do YouTube com ensinamentos budistas do CEBB
          </p>

          {/* Search and Filters */}
          <div className="space-y-4">
            {/* Search */}
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Pesquisar playlists..."
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

              <select
                value={filterLocation}
                onChange={(e) => setFilterLocation(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Todas as localizações</option>
                {availableLocations.map(location => (
                  <option key={location} value={location}>{location}</option>
                ))}
              </select>

              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Todos os formatos</option>
                <option value="Video">Vídeo</option>
                <option value="Audio">Áudio</option>
              </select>

              {(searchTerm || filterYear || filterLocation || filterType) && (
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center">
              <Video className="w-8 h-8 text-blue-600 mr-3" />
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {loading ? '...' : playlists.length}
                </div>
                <div className="text-sm text-gray-600">Total de Playlists</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center">
              <Calendar className="w-8 h-8 text-green-600 mr-3" />
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {loading ? '...' : availableYears.length}
                </div>
                <div className="text-sm text-gray-600">Anos Diferentes</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center">
              <MapPin className="w-8 h-8 text-purple-600 mr-3" />
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {loading ? '...' : availableLocations.length}
                </div>
                <div className="text-sm text-gray-600">Localizações</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center">
              <Search className="w-8 h-8 text-orange-600 mr-3" />
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {loading ? '...' : playlists.reduce((acc, p) => acc + p.metadata.total_talks, 0)}
                </div>
                <div className="text-sm text-gray-600">Total de Vídeos</div>
              </div>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-sm text-gray-600">
            {loading ? 'Carregando...' : `${filteredPlaylists.length} playlist${filteredPlaylists.length !== 1 ? 's' : ''} encontrada${filteredPlaylists.length !== 1 ? 's' : ''}`}
            {!loading && visibleCount < filteredPlaylists.length && (
              <span className="ml-2 text-blue-600">
                (mostrando {visibleCount} de {filteredPlaylists.length})
              </span>
            )}
          </p>
        </div>

        {/* Playlists Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(9)].map((_, index) => (
              <SkeletonCard key={index} />
            ))}
          </div>
        ) : filteredPlaylists.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {visiblePlaylists.map((playlist, index) => (
                <PlaylistCard 
                  key={playlist.id} 
                  playlist={playlist} 
                  index={index} // Passar o índice para controle de carregamento
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
                  Ver mais playlists
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
              Tente ajustar seus termos de pesquisa ou filtros
            </p>
            <button
              onClick={clearFilters}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              Limpar filtros
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
