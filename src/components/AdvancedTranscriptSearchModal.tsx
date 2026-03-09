'use client';

import { useEffect, useMemo, useState } from 'react';
import { Loader2, Search, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface TranscriptSearchResult {
  videoId?: string;
  playlistId: string | null;
  videoTitle: string;
  offset: number;
  snippetBefore: string;
  snippetMatch: string;
  snippetAfter: string;
  score: number;
  targetPath?: string;
  resultType?: 'title' | 'transcript';
}

interface SearchResponse {
  success: boolean;
  query?: string;
  cursor?: number;
  nextCursor?: number | null;
  scannedFiles?: number;
  totalFiles?: number;
  done?: boolean;
  limit?: number;
  total?: number;
  hasMore?: boolean;
  results?: TranscriptSearchResult[];
  error?: string;
}

interface AdvancedTranscriptSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function formatTime(offsetMs: number): string {
  const totalSeconds = Math.floor(offsetMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export default function AdvancedTranscriptSearchModal({
  isOpen,
  onClose,
}: AdvancedTranscriptSearchModalProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [results, setResults] = useState<TranscriptSearchResult[]>([]);
  const [scannedFiles, setScannedFiles] = useState(0);
  const [totalFiles, setTotalFiles] = useState(0);
  const [total, setTotal] = useState(0);
  const [isDone, setIsDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query.trim()), 350);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (!isOpen) return;
    if (!debouncedQuery) {
      setResults([]);
      setScannedFiles(0);
      setTotalFiles(0);
      setTotal(0);
      setIsDone(false);
      setError(null);
      return;
    }

    const controller = new AbortController();
    const fetchResultsProgressively = async () => {
      try {
        setLoading(true);
        setError(null);
        setResults([]);
        setScannedFiles(0);
        setTotalFiles(0);
        setTotal(0);
        setIsDone(false);

        let cursor = 0;
        let keepGoing = true;
        let aggregated: TranscriptSearchResult[] = [];

        while (keepGoing && !controller.signal.aborted) {
          const response = await fetch(
            `/api/transcripts/search?q=${encodeURIComponent(debouncedQuery)}&cursor=${cursor}&batchFiles=5&limit=60`,
            { signal: controller.signal, cache: 'no-store' }
          );
          const data = (await response.json()) as SearchResponse;

          if (!response.ok || !data.success) {
            throw new Error(data.error || 'Erro ao buscar transcrições');
          }

          const batchResults = data.results || [];
          if (batchResults.length > 0) {
            aggregated = [...aggregated, ...batchResults]
              .sort((a, b) => b.score - a.score)
              .slice(0, 400);
            setResults(aggregated);
            setTotal(aggregated.length);
          }

          setScannedFiles(data.scannedFiles || 0);
          setTotalFiles(data.totalFiles || 0);
          setIsDone(Boolean(data.done));

          if (data.done || data.nextCursor === null || data.nextCursor === undefined) {
            keepGoing = false;
          } else {
            cursor = data.nextCursor;
          }

          // ceder o loop para a UI ir renderizando parcial
          await new Promise((resolve) => setTimeout(resolve, 10));
        }
      } catch (err) {
        if ((err as Error).name === 'AbortError') return;
        setError(err instanceof Error ? err.message : 'Erro ao buscar transcrições');
      } finally {
        setLoading(false);
      }
    };

    fetchResultsProgressively();
    return () => controller.abort();
  }, [debouncedQuery, isOpen]);

  const subtitle = useMemo(() => {
    if (!debouncedQuery) return 'Digite termos para buscar em todas as transcrições.';
    if (loading) {
      if (totalFiles > 0) {
        return `Buscando em todas as transcrições... (${scannedFiles}/${totalFiles})`;
      }
      return 'Buscando em todas as transcrições...';
    }
    return `${total} ocorrência${total === 1 ? '' : 's'} encontrada${total === 1 ? '' : 's'}.`;
  }, [debouncedQuery, loading, total, scannedFiles, totalFiles]);

  const handleResultClick = (result: TranscriptSearchResult) => {
    const params = new URLSearchParams({
      tab: 'transcript',
      q: debouncedQuery,
      t: String(result.offset || 0),
    });

    if (result.videoId) {
      params.set('videoId', result.videoId);
    }

    const fallbackPath = result.playlistId
      ? `/playlist/${result.playlistId}`
      : result.videoId
        ? `/video/${result.videoId}`
        : '/playlists';
    const basePath = result.targetPath || fallbackPath;
    const targetPath = `${basePath}?${params.toString()}`;

    onClose();
    router.push(targetPath);
  };

  const highlightOnlyTerms = (text: string) => {
    if (!debouncedQuery.trim() || !text) return [text];
    const terms = debouncedQuery
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map((term) => escapeRegex(term));

    if (!terms.length) return [text];
    const regex = new RegExp(`(${terms.join('|')})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, idx) => {
      const isMatch = terms.some((term) => new RegExp(`^${term}$`, 'i').test(part));
      return isMatch ? (
        <mark key={`${part}-${idx}`} className="bg-yellow-200 text-gray-900 px-0.5 rounded">{part}</mark>
      ) : (
        part
      );
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center p-4 sm:p-8">
      <div className="w-full max-w-4xl bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Busca avançada</h2>
            <p className="text-sm text-gray-600">{subtitle}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            aria-label="Fechar busca avançada"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ex.: lucidez rigpa sati"
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="max-h-[60vh] overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100">
            {!debouncedQuery && (
              <p className="text-sm text-gray-500 p-4">
                A busca considera todos os termos digitados e retorna trechos com contexto.
              </p>
            )}

            {loading && (
              <div className="p-8 flex items-center justify-center gap-3 text-gray-600">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-sm">Buscando e atualizando resultados...</span>
              </div>
            )}

            {!loading && error && (
              <p className="text-sm text-red-600 p-4">{error}</p>
            )}

            {!loading && !error && debouncedQuery && results.length === 0 && (
              <p className="text-sm text-gray-500 p-4">Nenhum trecho encontrado.</p>
            )}

            {!loading && !error && results.map((result, index) => (
              <button
                key={`${result.videoId}-${result.offset}-${index}`}
                onClick={() => handleResultClick(result)}
                className="w-full text-left p-4 hover:bg-blue-50 transition-colors"
              >
                <p className="text-sm font-semibold text-gray-900 line-clamp-1">{highlightOnlyTerms(result.videoTitle)}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {result.resultType === 'title' ? 'Título' : `Trecho em ${formatTime(result.offset)}`}
                </p>
                <p className="text-sm text-gray-700 mt-2 leading-relaxed">
                  {highlightOnlyTerms(`${result.snippetBefore ? `${result.snippetBefore} ` : ''}${result.snippetMatch || ''}${result.snippetAfter ? ` ${result.snippetAfter}` : ''}`)}
                </p>
              </button>
            ))}
          </div>

          {debouncedQuery && (
            <p className="text-xs text-gray-500">
              {loading
                ? 'Mostrando resultados parciais enquanto a busca continua.'
                : isDone
                  ? 'Busca concluída.'
                  : ''}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
