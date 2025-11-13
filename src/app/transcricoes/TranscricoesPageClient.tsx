'use client';

import React, { useEffect, useState } from 'react';
import { Transcript } from '@/data/transcriptsData';
import TranscricoesClient from './TranscricoesClient';
import { Loader2, AlertCircle } from 'lucide-react';

export default function TranscricoesPageClient() {
  const [transcripts, setTranscripts] = useState<Transcript[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTranscripts() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('/api/drive/transcripts', {
          cache: 'no-store', // Sempre buscar dados atualizados
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Erro ${response.status} ao buscar transcrições`);
        }

        const data = await response.json();

        if (data.success && Array.isArray(data.transcripts)) {
          setTranscripts(data.transcripts);
          console.log(`[Transcrições] ✅ ${data.transcripts.length} transcrições carregadas do Google Drive`);
        } else {
          throw new Error('Formato de resposta inválido da API');
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido ao buscar transcrições';
        console.error('[Transcrições] Erro:', errorMessage);
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    }

    fetchTranscripts();
  }, []);

  if (loading) {
    return (
      <div className="text-center py-12">
        <Loader2 className="w-12 h-12 animate-spin text-red-600 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Carregando transcrições...
        </h3>
        <p className="text-gray-600">Buscando arquivos do Google Drive...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-12 h-12 text-red-600" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Erro ao carregar transcrições
        </h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  if (transcripts.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Nenhuma transcrição disponível
        </h3>
        <p className="text-gray-600">Não foram encontrados arquivos PDF na pasta do Google Drive.</p>
      </div>
    );
  }

  return <TranscricoesClient transcripts={transcripts} />;
}

