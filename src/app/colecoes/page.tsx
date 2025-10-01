import { Star, Clock, MapPin, Headphones } from 'lucide-react';
import Link from 'next/link';

export default function ColecoesPage() {
  const colecoes = [
    {
      id: 'fundamentos',
      title: 'Fundamentos do Budismo',
      description: 'Séries introdutórias sobre os princípios fundamentais do budismo tibetano',
      thumbnail: '/api/placeholder/400/300',
      featured: true,
      stats: {
        playlists: 12,
        totalDuration: '24h 30m',
        year: '1970-1975',
        location: 'Boston, MA'
      }
    },
    {
      id: 'meditacao',
      title: 'Meditação e Mindfulness',
      description: 'Técnicas práticas de meditação e desenvolvimento da atenção plena',
      thumbnail: '/api/placeholder/400/300',
      featured: true,
      stats: {
        playlists: 8,
        totalDuration: '18h 15m',
        year: '1972-1978',
        location: 'Nova York, NY'
      }
    },
    {
      id: 'filosofia',
      title: 'Filosofia Budista',
      description: 'Exploração profunda dos conceitos filosóficos e metafísicos do budismo',
      thumbnail: '/api/placeholder/400/300',
      featured: false,
      stats: {
        playlists: 15,
        totalDuration: '32h 45m',
        year: '1975-1980',
        location: 'Boulder, CO'
      }
    },
    {
      id: 'praticas',
      title: 'Práticas Espirituais',
      description: 'Instruções detalhadas sobre práticas espirituais e rituais',
      thumbnail: '/api/placeholder/400/300',
      featured: false,
      stats: {
        playlists: 10,
        totalDuration: '20h 20m',
        year: '1978-1985',
        location: 'Halifax, NS'
      }
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Coleções
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Explore nossas coleções temáticas organizadas por assunto e período
          </p>
        </div>

        {/* Collections Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {colecoes.map((colecao) => (
            <div key={colecao.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              {/* Thumbnail */}
              <div className="relative">
                <div className="w-full h-48 bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                  <Headphones className="w-16 h-16 text-blue-600" />
                </div>
                {colecao.featured && (
                  <div className="absolute top-3 left-3">
                    <div className="flex items-center space-x-1 bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                      <Star className="w-3 h-3" />
                      <span>Destaque</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-6">
                {/* Title */}
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {colecao.title}
                </h3>

                {/* Description */}
                <p className="text-gray-700 mb-4">
                  {colecao.description}
                </p>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {colecao.stats.playlists}
                    </div>
                    <div className="text-sm text-gray-600">Playlists</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {colecao.stats.totalDuration}
                    </div>
                    <div className="text-sm text-gray-600">Duração</div>
                  </div>
                </div>

                {/* Additional Info */}
                <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                  <div className="flex items-center space-x-1">
                    <Clock className="w-4 h-4" />
                    <span>{colecao.stats.year}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <MapPin className="w-4 h-4" />
                    <span>{colecao.stats.location}</span>
                  </div>
                </div>

                {/* Action Button */}
                <Link 
                  href={`/playlists?colecao=${colecao.id}`}
                  className="block w-full bg-blue-600 text-white text-center px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Explorar Coleção
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Additional Information */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Sobre as Coleções
          </h2>
          
          <div className="prose prose-lg max-w-none text-gray-700">
            <p className="text-lg leading-relaxed mb-6">
              Nossas coleções são organizadas tematicamente para facilitar a navegação e descoberta de conteúdo. 
              Cada coleção representa um conjunto de playlists relacionadas por assunto, período ou localização.
            </p>
            
            <div className="grid md:grid-cols-2 gap-8 mt-8">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Organização Temática
                </h3>
                <ul className="space-y-2 text-gray-700">
                  <li>• Fundamentos e conceitos básicos</li>
                  <li>• Práticas meditativas</li>
                  <li>• Filosofia e metafísica</li>
                  <li>• Rituais e cerimônias</li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Cronologia
                </h3>
                <ul className="space-y-2 text-gray-700">
                  <li>• Gravações dos anos 1970-1980</li>
                  <li>• Desenvolvimento histórico dos ensinamentos</li>
                  <li>• Evolução das práticas ao longo do tempo</li>
                  <li>• Contexto histórico e cultural</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
