import { FileText, ExternalLink } from 'lucide-react';
import { Transcript } from '@/data/transcriptsData';

interface TranscriptCardProps {
  transcript: Transcript;
}

export default function TranscriptCard({ transcript }: TranscriptCardProps) {
  const handleOpenPDF = () => {
    window.open(transcript.url, '_blank');
  };

  // Cores para diferentes categorias
  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'quatro-nobres-verdades': 'bg-blue-100 text-blue-700',
      'origem-dependente': 'bg-green-100 text-green-700',
      'prajna-paramita': 'bg-purple-100 text-purple-700',
      'sutra-do-diamante': 'bg-yellow-100 text-yellow-700',
      'meditacao-e-pratica': 'bg-pink-100 text-pink-700',
      'satipathana': 'bg-indigo-100 text-indigo-700',
      'sabedoria-primordial': 'bg-orange-100 text-orange-700',
      'mahamudra': 'bg-teal-100 text-teal-700',
      'bardos-e-morte': 'bg-gray-100 text-gray-700',
      'bodhicitta-e-motivacao': 'bg-red-100 text-red-700',
      'mandala': 'bg-cyan-100 text-cyan-700',
      'ensinamentos-gerais': 'bg-slate-100 text-slate-700',
      'textos-especificos': 'bg-emerald-100 text-emerald-700',
      'materiais-de-apoio': 'bg-amber-100 text-amber-700',
      'outros': 'bg-neutral-100 text-neutral-700'
    };
    return colors[category] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden">
      {/* Header com ícone */}
      <div className="p-4 pb-2">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
            <FileText className="w-5 h-5 text-red-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 leading-tight">
              {transcript.title}
            </h3>
          </div>
        </div>
      </div>

      {/* Preview do conteúdo */}
      <div className="px-4 pb-3">
        <p className="text-sm text-gray-600 line-clamp-3 leading-relaxed">
          {transcript.preview}
        </p>
      </div>

      {/* Categorias */}
      <div className="px-4 pb-3">
        <div className="flex flex-wrap gap-1">
          {transcript.categories.map((category, index) => {
            const categoryName = category
              .split('-')
              .map(word => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' ');
            
            return (
              <span 
                key={index}
                className={`px-2 py-1 text-xs rounded-full font-medium ${getCategoryColor(category)}`}
              >
                {categoryName}
              </span>
            );
          })}
        </div>
      </div>

      {/* Footer com botão */}
      <div className="px-4 pb-4">
        <button
          onClick={handleOpenPDF}
          className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
        >
          <FileText className="w-4 h-4" />
          Ver Transcrição
          <ExternalLink className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
