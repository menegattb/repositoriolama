import Link from 'next/link';
import { ArrowRight, BookOpen, Headphones, Search, Users } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Biblioteca Digital de Mídia
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Uma plataforma dedicada a preservar, catalogar e compartilhar coleções de gravações de áudio e vídeo com metadados e transcrições pesquisáveis.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/playlists"
                className="inline-flex items-center justify-center px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Explorar Playlists
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
              <Link 
                href="/sobre"
                className="inline-flex items-center justify-center px-8 py-3 bg-white text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Saiba Mais
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Recursos da Plataforma
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Descubra as funcionalidades que tornam nossa biblioteca digital única
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Catálogo Organizado</h3>
              <p className="text-gray-600">
                Coleções cuidadosamente organizadas por temas, séries e playlists para fácil navegação.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Headphones className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Player Integrado</h3>
              <p className="text-gray-600">
                Player de áudio e vídeo integrado com controles avançados e sincronização de transcrições.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Busca Avançada</h3>
              <p className="text-gray-600">
                Pesquise em transcrições, metadados e conteúdo para encontrar exatamente o que procura.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Acesso Gratuito</h3>
              <p className="text-gray-600">
                Todo o conteúdo disponível gratuitamente para estudantes, pesquisadores e interessados.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Sobre o Projeto
            </h2>
          </div>

          <div className="prose prose-lg mx-auto text-gray-700">
            <p className="text-lg leading-relaxed mb-6">
              Esta plataforma foi desenvolvida como uma réplica da "Chögyam Trungpa Digital Library at Naropa University", 
              com o objetivo de criar uma biblioteca digital moderna e acessível para hospedar coleções de gravações de áudio e vídeo.
            </p>
            
            <p className="text-lg leading-relaxed mb-6">
              Nossa missão é preservar e tornar acessível conteúdo educacional e cultural valioso, 
              oferecendo uma experiência de usuário intuitiva com recursos avançados de busca e reprodução de mídia.
            </p>

            <div className="bg-blue-50 border-l-4 border-blue-400 p-6 my-8">
              <h3 className="text-xl font-semibold text-blue-900 mb-2">Links Externos</h3>
              <ul className="space-y-2">
                <li>
                  <a 
                    href="https://www.naropa.edu/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 underline"
                  >
                    Naropa University
                  </a>
                </li>
                <li>
                  <a 
                    href="https://www.shambhala.org/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 underline"
                  >
                    Shambhala International
                  </a>
                </li>
                <li>
                  <a 
                    href="https://www.chogyamtrungpa.com/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 underline"
                  >
                    Chögyam Trungpa Foundation
                  </a>
                </li>
              </ul>
            </div>

            <p className="text-lg leading-relaxed">
              Esta plataforma é desenvolvida usando tecnologias modernas como Next.js, TypeScript e Tailwind CSS, 
              garantindo uma experiência rápida, responsiva e acessível em todos os dispositivos.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-blue-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Comece a Explorar Hoje
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Descubra nossa coleção de playlists e comece sua jornada de aprendizado
          </p>
          <Link 
            href="/playlists"
            className="inline-flex items-center justify-center px-8 py-3 bg-white text-blue-600 rounded-lg hover:bg-gray-100 transition-colors font-medium"
          >
            Ver Todas as Playlists
            <ArrowRight className="ml-2 w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
