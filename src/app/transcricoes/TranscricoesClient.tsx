"use client";

import React from "react";
import TranscriptCard from "@/components/TranscriptCard";
import { Transcript } from "@/data/transcriptsData";

interface TranscricoesClientProps {
  transcripts: Transcript[];
}

export default function TranscricoesClient({ transcripts }: TranscricoesClientProps) {
  const [query, setQuery] = React.useState("");
  const [categoryFilter, setCategoryFilter] = React.useState("");

  const categories = React.useMemo(() => {
    const counter = new Map<string, number>();
    for (const t of transcripts) {
      for (const c of t.categories || []) {
        counter.set(c, (counter.get(c) || 0) + 1);
      }
    }
    return Array.from(counter.entries())
      .map(([slug, count]) => ({ slug, count, name: slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [transcripts]);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return transcripts.filter(t => {
      const matchesCategory = !categoryFilter || (t.categories || []).includes(categoryFilter);
      if (!q) return matchesCategory;
      const inTitle = t.title.toLowerCase().includes(q);
      const inPreview = (t.preview || "").toLowerCase().includes(q);
      const inCategories = (t.categories || []).some(c => c.toLowerCase().includes(q));
      const matchesQuery = inTitle || inPreview || inCategories;
      return matchesQuery && matchesCategory;
    });
  }, [query, categoryFilter, transcripts]);

  return (
    <div>
      {/* Category chips */}
      {categories.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setCategoryFilter("")}
            className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
              categoryFilter === "" ? "bg-red-600 text-white border-red-600" : "bg-white text-gray-800 border-gray-300 hover:bg-gray-100"
            }`}
          >
            Todas ({transcripts.length})
          </button>
          {categories.map(cat => (
            <button
              key={cat.slug}
              type="button"
              onClick={() => setCategoryFilter(prev => prev === cat.slug ? "" : cat.slug)}
              className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                categoryFilter === cat.slug ? "bg-red-600 text-white border-red-600" : "bg-white text-gray-800 border-gray-300 hover:bg-gray-100"
              }`}
              title={`${cat.name}`}
            >
              {cat.name} ({cat.count})
            </button>
          ))}
        </div>
      )}

      <div className="mb-6 flex items-center gap-3">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por título, tema ou categoria..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100"
          >
            Limpar
          </button>
        )}
      </div>

      <p className="text-sm text-gray-600 mb-4">
        {filtered.length} {filtered.length === 1 ? "transcrição" : "transcrições"}
      </p>

      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((transcript) => (
            <TranscriptCard key={transcript.id} transcript={transcript} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Nenhuma transcrição encontrada
          </h3>
          <p className="text-gray-600">Tente ajustar seus termos de busca.</p>
        </div>
      )}
    </div>
  );
}


