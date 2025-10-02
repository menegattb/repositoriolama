export default function Home() {
  return (
    <>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-50 via-white to-purple-50 min-h-[70vh] flex items-center">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-1/2 -right-1/4 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
          <div className="absolute -bottom-1/2 -left-1/4 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 mb-6 leading-tight">
              Biblioteca Digital de Mídia
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-600 mb-8 leading-relaxed">
              Uma plataforma moderna para preservar, catalogar e compartilhar coleções de áudio e vídeo
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <a 
                href="/playlists" 
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-full hover:shadow-2xl hover:scale-105 transition-all duration-300 flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
                Explorar Playlists
              </a>
              
              <a 
                href="#about" 
                className="px-8 py-4 bg-white text-gray-800 font-semibold rounded-full border-2 border-gray-200 hover:border-purple-400 hover:shadow-lg transition-all duration-300"
              >
                Saiba Mais
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Recursos da Plataforma</h2>
            <p className="text-xl text-gray-600">Tecnologia moderna para preservação digital</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
              <div className="bg-blue-600 w-14 h-14 rounded-full flex items-center justify-center mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Busca Avançada</h3>
              <p className="text-gray-700 leading-relaxed">
                Pesquise em metadados completos e transcrições para encontrar exatamente o que você precisa.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
              <div className="bg-purple-600 w-14 h-14 rounded-full flex items-center justify-center mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Player Integrado</h3>
              <p className="text-gray-700 leading-relaxed">
                Reproduza áudio e vídeo diretamente no navegador com controles intuitivos e responsivos.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-gradient-to-br from-pink-50 to-pink-100 p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
              <div className="bg-pink-600 w-14 h-14 rounded-full flex items-center justify-center mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Transcrições</h3>
              <p className="text-gray-700 leading-relaxed">
                Acesse transcrições completas com marcações de tempo sincronizadas com a mídia.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Sobre o Projeto
            </h2>
          </div>

          <div className="prose prose-lg mx-auto text-gray-700">
            <p className="text-lg leading-relaxed mb-6">
              Esta plataforma foi desenvolvida como uma réplica da &ldquo;Chögyam Trungpa Digital Library at Naropa University&rdquo;, 
              com o objetivo de criar uma biblioteca digital moderna e acessível para hospedar coleções de gravações de áudio e vídeo.
            </p>
            
            <p className="text-lg leading-relaxed mb-6">
              Nossa missão é preservar e tornar acessível conteúdo educacional e cultural valioso, 
              oferecendo uma experiência de usuário intuitiva com recursos avançados de busca e reprodução de mídia.
            </p>

            <div className="bg-blue-50 border-l-4 border-blue-600 p-6 rounded-r-lg my-8">
              <h3 className="text-xl font-bold text-blue-900 mb-2">Tecnologias Utilizadas</h3>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li><strong>Frontend:</strong> Next.js 15 com React 19 e Tailwind CSS</li>
                <li><strong>Player de Mídia:</strong> React Player com suporte para múltiplos formatos</li>
                <li><strong>Ícones:</strong> Lucide React para uma experiência visual moderna</li>
                <li><strong>Otimização:</strong> Next.js Image para carregamento eficiente de imagens</li>
              </ul>
            </div>

            <p className="text-lg leading-relaxed mb-6">
              O projeto está em constante evolução, com novos recursos sendo adicionados regularmente 
              para melhorar a experiência do usuário e expandir as capacidades da plataforma.
            </p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center text-white">
            <div className="transform hover:scale-105 transition-transform duration-300">
              <div className="text-5xl font-extrabold mb-2">306+</div>
              <div className="text-xl opacity-90">Playlists Disponíveis</div>
            </div>
            <div className="transform hover:scale-105 transition-transform duration-300">
              <div className="text-5xl font-extrabold mb-2">1000+</div>
              <div className="text-xl opacity-90">Horas de Conteúdo</div>
            </div>
            <div className="transform hover:scale-105 transition-transform duration-300">
              <div className="text-5xl font-extrabold mb-2">100%</div>
              <div className="text-xl opacity-90">Pesquisável</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">
            Comece a Explorar Agora
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Descubra nossa coleção completa de gravações de áudio e vídeo
          </p>
          <a 
            href="/playlists" 
            className="inline-flex items-center gap-2 px-10 py-5 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-lg font-semibold rounded-full hover:shadow-2xl hover:scale-105 transition-all duration-300"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
            </svg>
            Ver Todas as Playlists
          </a>
        </div>
      </section>
    </>
  );
}
