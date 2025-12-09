import Link from 'next/link';
import TranscricoesManuaisClient from './TranscricoesManuaisClient';

export const metadata = {
  title: 'Transcrições Manuais | Repositório Ação Paramita',
  description: 'Transcreva vídeos do YouTube manualmente',
};

export default function TranscricoesManuaisPage() {
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="mb-4 text-sm text-gray-600" aria-label="Breadcrumb">
        <ol className="flex items-center gap-2">
          <li>
            <Link href="/" className="hover:text-gray-900">Início</Link>
          </li>
          <li className="text-gray-400">/</li>
          <li className="text-gray-900 font-medium">Transcrições Manuais</li>
        </ol>
      </nav>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Transcrições Manuais
        </h1>
        <p className="mt-2 text-gray-600">
          Insira o link de um vídeo do YouTube para gerar e visualizar sua transcrição automaticamente.
        </p>
      </div>

      <TranscricoesManuaisClient />
    </main>
  );
}


