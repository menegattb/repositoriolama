import { BookOpen, Download, Headphones, FileText, Video, Music } from 'lucide-react';

export default function RecursosPage() {
  const recursos = [
    {
      icon: BookOpen,
      title: 'Catálogo Completo',
      description: 'Acesse nossa biblioteca completa de recursos educacionais organizados por temas e séries.',
      color: 'blue'
    },
    {
      icon: Headphones,
      title: 'Player Integrado',
      description: 'Reproduza áudio e vídeo diretamente na plataforma com controles avançados.',
      color: 'green'
    },
    {
      icon: FileText,
      title: 'Transcrições',
      description: 'Leia transcrições completas com marcações de tempo sincronizadas com a mídia.',
      color: 'purple'
    },
    {
      icon: Download,
      title: 'Download',
      description: 'Baixe arquivos de áudio e vídeo para uso offline (quando disponível).',
      color: 'orange'
    },
    {
      icon: Video,
      title: 'Conteúdo Multimídia',
      description: 'Explore palestras, workshops e eventos em formato de áudio e vídeo.',
      color: 'red'
    },
    {
      icon: Music,
      title: 'Biblioteca de Áudio',
      description: 'Coleção especializada em gravações de áudio de alta qualidade.',
      color: 'indigo'
    }
  ];

  const getColorClasses = (color: string) => {
    const colors = {
      blue: 'bg-blue-100 text-blue-600',
      green: 'bg-green-100 text-green-600',
      purple: 'bg-purple-100 text-purple-600',
      orange: 'bg-orange-100 text-orange-600',
      red: 'bg-red-100 text-red-600',
      indigo: 'bg-indigo-100 text-indigo-600'
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Recursos Disponíveis
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Explore os recursos e funcionalidades que nossa plataforma oferece para uma experiência completa de aprendizado
          </p>
        </div>

        {/* Resources Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {recursos.map((recurso, index) => (
            <div key={index} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
              <div className={`w-12 h-12 rounded-lg ${getColorClasses(recurso.color)} flex items-center justify-center mb-4`}>
                <recurso.icon className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {recurso.title}
              </h3>
              <p className="text-gray-600">
                {recurso.description}
              </p>
            </div>
          ))}
        </div>

        {/* Additional Information */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Como Usar os Recursos
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Navegação
              </h3>
              <ul className="space-y-2 text-gray-700">
                <li>• Use o menu superior para navegar entre seções</li>
                <li>• Explore playlists organizadas por temas</li>
                <li>• Utilize a busca para encontrar conteúdo específico</li>
                <li>• Acesse transcrições sincronizadas com a mídia</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Reprodução
              </h3>
              <ul className="space-y-2 text-gray-700">
                <li>• Controles de reprodução intuitivos</li>
                <li>• Ajuste de volume e velocidade</li>
                <li>• Navegação por timestamps nas transcrições</li>
                <li>• Compartilhamento de playlists</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
