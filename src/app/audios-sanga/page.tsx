'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { Music, FolderOpen, Search, Loader2, AlertCircle, ChevronRight, ArrowLeft, Home } from 'lucide-react';
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

  // Carregar lista de pastas inicial
  useEffect(() => {
    fetchFolders();
  }, []);

  // Abrir pasta da URL após carregar lista de pastas
  useEffect(() => {
    if (foldersLoaded && initialFolder && !currentFolder) {
      // Buscar a pasta pelo ID
      const folder = folders.find(f => f.id === initialFolder);
      if (folder) {
        fetchFolderContents(folder.id, folder.name);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [foldersLoaded, initialFolder, folders]);

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

    try {
      const response = await fetch(`/api/drive/audio/sanga?folder=${encodeURIComponent(folderName)}`);
      const data = await response.json();

      if (data.success) {
        setFolderAudios(data.audios || []);
        setSubfolders(data.subfolders || []);
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
    // Atualizar URL removendo o parâmetro folder
    window.history.pushState({}, '', '/audios-sanga');
  };

  // Limpar nome do áudio removendo extensão
  const cleanAudioName = (name: string): string => {
    return name.replace(/\.(mp3|m4a|wav|ogg|flac|aac)$/i, '');
  };

  // Filtrar itens por termo de busca
  const filteredFolders = folders.filter(f =>
    f.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredRootAudios = rootAudios.filter(a =>
    a.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredFolderAudios = folderAudios.filter(a =>
    a.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredSubfolders = subfolders.filter(f =>
    f.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
              <h1 className="text-xl font-semibold text-gray-900">Áudios da Sanga</h1>
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
              Pasta atual: <span className="font-medium">{currentFolderName}</span>
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
                  onClick={currentFolder ? () => fetchFolderContents(currentFolder, currentFolderName) : fetchFolders}
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
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Pastas</h2>
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

            {/* Root Audio Files */}
            {filteredRootAudios.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Áudios</h2>
                <div className="space-y-3">
                  {filteredRootAudios.map((audio) => (
                    <div
                      key={audio.id}
                      className="p-4 bg-white rounded-lg shadow-sm border border-gray-200"
                    >
                      <div className="flex items-start gap-3">
                        <Music className="w-8 h-8 text-blue-500 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900">{cleanAudioName(audio.name)}</h3>
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

            {/* Empty State */}
            {filteredFolders.length === 0 && filteredRootAudios.length === 0 && (
              <div className="text-center py-16 bg-white rounded-lg shadow-sm">
                <Music className="w-16 h-16 text-gray-400 mx-auto" />
                <h2 className="text-xl font-semibold text-gray-900 mt-4">
                  {searchTerm ? 'Nenhum resultado encontrado' : 'Nenhum áudio disponível'}
                </h2>
                <p className="text-gray-600 mt-2">
                  {searchTerm 
                    ? `Não encontramos resultados para "${searchTerm}"`
                    : 'Os áudios da Sanga ainda não foram adicionados.'}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Content - Dentro de uma Pasta */}
        {!isLoading && isConfigured && !error && currentFolder && (
          <div className="space-y-6">
            {/* Subfolders */}
            {filteredSubfolders.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Subpastas</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredSubfolders.map((folder) => (
                    <button
                      key={folder.id}
                      onClick={() => fetchFolderContents(folder.id, folder.name)}
                      className="flex items-center gap-4 p-4 bg-white rounded-lg shadow-sm border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all text-left"
                    >
                      <FolderOpen className="w-10 h-10 text-blue-500 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 truncate">{folder.name}</h3>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </button>
                  ))}
                </div>
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
                        <Music className="w-8 h-8 text-blue-500 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900">{cleanAudioName(audio.name)}</h3>
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
            {filteredSubfolders.length === 0 && filteredFolderAudios.length === 0 && (
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
