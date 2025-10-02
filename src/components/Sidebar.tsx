'use client';

import { useState } from 'react';
import { Playlist, MediaItem, Transcript } from '@/types';
import { Search, Clock } from 'lucide-react';

interface SidebarProps {
  playlist: Playlist;
  currentMediaItem: MediaItem | null;
  transcript: Transcript | null;
}

export default function Sidebar({ 
  playlist, 
  currentMediaItem, 
  transcript
}: SidebarProps) {
  const [activeTab, setActiveTab] = useState<'playlist' | 'transcript'>('playlist');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredItems = playlist.items?.filter(item =>
    item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.description.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

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
      </div>

      {/* Content */}
      <div className="p-4">
        {activeTab === 'playlist' ? (
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
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    currentMediaItem?.id === item.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-xs font-medium text-gray-600">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900 truncate">
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
        ) : (
          <div className="space-y-4">
            {transcript ? (
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-gray-900">
                  Transcrição: {currentMediaItem?.title}
                </h3>
                <div className="text-sm text-gray-600 max-h-96 overflow-y-auto">
                  {transcript.content}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 text-sm">
                  Nenhuma transcrição disponível para este item.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
