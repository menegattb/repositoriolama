'use client';

import { useState } from 'react';
import { Playlist, MediaItem, Transcript } from '@/types';
import { Search, Clock, Play } from 'lucide-react';

interface SidebarProps {
  playlist: Playlist;
  currentMediaItem: MediaItem | null;
  transcript: Transcript | null;
  onMediaItemSelect: (item: MediaItem) => void;
  onTimeUpdate?: (time: number) => void;
}

export default function Sidebar({ 
  playlist, 
  currentMediaItem, 
  transcript, 
  onMediaItemSelect,
  onTimeUpdate 
}: SidebarProps) {
  const [activeTab, setActiveTab] = useState<'playlist' | 'now-playing'>('playlist');
  const [playlistSearch, setPlaylistSearch] = useState('');
  const [transcriptSearch, setTranscriptSearch] = useState('');
  const [autoScroll, setAutoScroll] = useState(true);

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  const filteredItems = playlist.items.filter(item =>
    item.title.toLowerCase().includes(playlistSearch.toLowerCase()) ||
    item.description.toLowerCase().includes(playlistSearch.toLowerCase())
  );

  const filteredTranscript = transcript?.timestamps.filter(timestamp =>
    timestamp.text.toLowerCase().includes(transcriptSearch.toLowerCase())
  ) || [];

  const handleTimestampClick = (time: number) => {
    if (onTimeUpdate) {
      onTimeUpdate(time);
    }
  };

  const totalDuration = playlist.items.reduce((acc, item) => acc + item.duration, 0);

  return (
    <div className="bg-white rounded-lg shadow-md h-full">
      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('playlist')}
          className={`flex-1 px-4 py-3 text-sm font-medium ${
            activeTab === 'playlist'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Playlist
        </button>
        <button
          onClick={() => setActiveTab('now-playing')}
          className={`flex-1 px-4 py-3 text-sm font-medium ${
            activeTab === 'now-playing'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Ouvindo Agora
        </button>
      </div>

      <div className="p-4">
        {activeTab === 'playlist' ? (
          <div>
            {/* Playlist Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Pesquisar na playlist..."
                value={playlistSearch}
                onChange={(e) => setPlaylistSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Playlist Duration */}
            <div className="flex items-center space-x-2 text-sm text-gray-600 mb-4">
              <Clock className="w-4 h-4" />
              <span>Duração total: {formatDuration(totalDuration)}</span>
            </div>

            {/* Playlist Items */}
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => onMediaItemSelect(item)}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    currentMediaItem?.id === item.id
                      ? 'bg-blue-50 border border-blue-200'
                      : 'hover:bg-gray-50 border border-transparent'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        currentMediaItem?.id === item.id
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-600'
                      }`}>
                        <Play className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900 truncate">
                        {item.track_title}
                      </h4>
                      <p className="text-xs text-gray-600 truncate">
                        {item.event_type}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDuration(item.duration)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div>
            {currentMediaItem ? (
              <>
                {/* Sub-tabs for Now Playing */}
                <div className="flex border-b border-gray-200 mb-4">
                  <button className="flex-1 px-3 py-2 text-sm font-medium text-blue-600 border-b-2 border-blue-600">
                    Descrição
                  </button>
                  <button className="flex-1 px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900">
                    Transcrição
                  </button>
                </div>

                {/* Description Tab Content */}
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Título do Recurso</h4>
                    <p className="text-sm text-gray-700">{currentMediaItem.title}</p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Data</h4>
                    <p className="text-sm text-gray-700">{new Date(currentMediaItem.date).toLocaleDateString('pt-BR')}</p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Formato</h4>
                    <p className="text-sm text-gray-700 capitalize">{currentMediaItem.format}</p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Local</h4>
                    <p className="text-sm text-gray-700">{currentMediaItem.location}</p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Tipo de Evento</h4>
                    <p className="text-sm text-gray-700">{currentMediaItem.event_type}</p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Título da Série</h4>
                    <p className="text-sm text-gray-700">{currentMediaItem.series_title}</p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Tema</h4>
                    <p className="text-sm text-gray-700">{currentMediaItem.theme}</p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Resumo</h4>
                    <p className="text-sm text-gray-700">{currentMediaItem.summary}</p>
                  </div>
                </div>

                {/* Transcript Tab Content */}
                {transcript && (
                  <div className="mt-6">
                    <div className="flex items-center space-x-2 mb-4">
                      <input
                        type="checkbox"
                        id="auto-scroll"
                        checked={autoScroll}
                        onChange={(e) => setAutoScroll(e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label htmlFor="auto-scroll" className="text-sm text-gray-700">
                        Rolagem automática com a mídia
                      </label>
                    </div>

                    <div className="relative mb-4">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="text"
                        placeholder="Pesquisar na transcrição..."
                        value={transcriptSearch}
                        onChange={(e) => setTranscriptSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div className="max-h-64 overflow-y-auto space-y-2">
                      {(transcriptSearch ? filteredTranscript : transcript.timestamps).map((timestamp, index) => (
                        <div
                          key={index}
                          className="p-2 rounded hover:bg-gray-50 cursor-pointer"
                          onClick={() => handleTimestampClick(timestamp.time)}
                        >
                          <div className="text-xs text-blue-600 font-mono mb-1">
                            {Math.floor(timestamp.time / 60)}:{(timestamp.time % 60).toString().padStart(2, '0')}
                          </div>
                          <div className="text-sm text-gray-700">{timestamp.text}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center text-gray-500 py-8">
                <p>Selecione uma faixa para ver os detalhes</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
