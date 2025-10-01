export default function SobrePage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8">
            Sobre a Biblioteca Digital
          </h1>
          
          <div className="prose prose-lg max-w-none text-gray-700">
            <p className="text-lg leading-relaxed mb-6">
              A Biblioteca Digital de Mídia é uma plataforma dedicada a preservar, catalogar e compartilhar 
              coleções de gravações de áudio e vídeo com metadados e transcrições pesquisáveis.
            </p>
            
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Nossa Missão</h2>
            <p className="text-lg leading-relaxed mb-6">
              Nossa missão é tornar acessível conteúdo educacional e cultural valioso, oferecendo uma 
              experiência de usuário intuitiva com recursos avançados de busca e reprodução de mídia.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Tecnologia</h2>
            <p className="text-lg leading-relaxed mb-6">
              Esta plataforma foi desenvolvida usando tecnologias modernas:
            </p>
            <ul className="list-disc list-inside space-y-2 mb-6">
              <li><strong>Next.js</strong> - Framework React para aplicações web modernas</li>
              <li><strong>TypeScript</strong> - Linguagem tipada para JavaScript</li>
              <li><strong>Tailwind CSS</strong> - Framework CSS utilitário</li>
              <li><strong>React Player</strong> - Player de mídia integrado</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Links Externos</h2>
            <div className="bg-blue-50 border-l-4 border-blue-400 p-6">
              <ul className="space-y-3">
                <li>
                  <a 
                    href="https://www.naropa.edu/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 underline font-medium"
                  >
                    Naropa University
                  </a>
                  <p className="text-sm text-gray-600 mt-1">
                    Universidade que inspirou este projeto
                  </p>
                </li>
                <li>
                  <a 
                    href="https://www.shambhala.org/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 underline font-medium"
                  >
                    Shambhala International
                  </a>
                  <p className="text-sm text-gray-600 mt-1">
                    Organização espiritual internacional
                  </p>
                </li>
                <li>
                  <a 
                    href="https://www.chogyamtrungpa.com/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 underline font-medium"
                  >
                    Chögyam Trungpa Foundation
                  </a>
                  <p className="text-sm text-gray-600 mt-1">
                    Fundação dedicada aos ensinamentos de Chögyam Trungpa
                  </p>
                </li>
              </ul>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Contato</h2>
            <p className="text-lg leading-relaxed mb-6">
              Para mais informações sobre este projeto ou para contribuir com conteúdo, 
              entre em contato através dos canais oficiais das organizações mencionadas acima.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
