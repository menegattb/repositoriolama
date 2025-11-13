import React from "react";
import Link from "next/link";
import TranscricoesPageClient from "./TranscricoesPageClient";

export const metadata = {
  title: "Roteiros e transcrições editadas pela sanga",
  description: "Coleção completa de transcrições corrigidas (acesso por link)",
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
};

export default function TranscricoesPage() {
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="mb-4 text-sm text-gray-600" aria-label="Breadcrumb">
        <ol className="flex items-center gap-2">
          <li>
            <Link href="/" className="hover:text-gray-900">Início</Link>
          </li>
          <li className="text-gray-400">/</li>
          <li>
            <Link href="/playlists" className="hover:text-gray-900">Playlists</Link>
          </li>
          <li className="text-gray-400">/</li>
          <li className="text-gray-900 font-medium">Transcrições</li>
        </ol>
      </nav>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
        Roteiros e transcrições editadas pela sanga
        </h1>
        <p className="mt-2 text-gray-600">Acesso reservado via link. Esta página não aparece em menus nem em buscadores.</p>
      </div>

      <TranscricoesPageClient />
    </main>
  );
}


