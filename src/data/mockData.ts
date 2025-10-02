import { Playlist, Transcript } from '@/types';

export const mockPlaylists: Playlist[] = [
  {
    id: '1',
    title: 'Fundamentos do Budismo Tibetano',
    description: 'Uma série introdutória sobre os princípios fundamentais do budismo tibetano, explorando conceitos básicos e práticas essenciais.',
    thumbnail_url: '/api/placeholder/400/300',
    featured: true,
    metadata: {
      total_talks: 8,
      year: '1971',
      location: 'Boston',
      format: 'Audio'
    },
    items: [
      {
        id: '1-1',
        title: 'Introdução ao Dharma',
        description: 'Uma introdução aos ensinamentos fundamentais do Dharma.',
        summary: 'Esta palestra apresenta os conceitos básicos do Dharma e sua aplicação na vida cotidiana.',
        date: '1971-03-15',
        location: 'Boston',
        format: 'audio',
        media_url: '/api/placeholder/audio1.mp3',
        duration: 3600, // 1 hora
        theme: 'Fundamentos',
        event_type: 'Palestra',
        series_title: 'Fundamentos do Budismo Tibetano',
        track_title: 'Introdução ao Dharma'
      },
      {
        id: '1-2',
        title: 'Os Quatro Nobres Verdades',
        description: 'Exploração profunda das Quatro Nobres Verdades do budismo.',
        summary: 'Uma análise detalhada das Quatro Nobres Verdades e sua relevância prática.',
        date: '1971-03-22',
        location: 'Boston',
        format: 'audio',
        media_url: '/api/placeholder/audio2.mp3',
        duration: 4200, // 1h 10min
        theme: 'Fundamentos',
        event_type: 'Palestra',
        series_title: 'Fundamentos do Budismo Tibetano',
        track_title: 'Os Quatro Nobres Verdades'
      }
    ]
  },
  {
    id: '2',
    title: 'Meditação e Mindfulness',
    description: 'Técnicas práticas de meditação e desenvolvimento da atenção plena.',
    thumbnail_url: '/api/placeholder/400/300',
    featured: false,
    metadata: {
      total_talks: 6,
      year: '1972',
      location: 'Nova York',
      format: 'Audio'
    },
    items: [
      {
        id: '2-1',
        title: 'Técnicas Básicas de Meditação',
        description: 'Aprenda as técnicas fundamentais de meditação.',
        summary: 'Instruções práticas para iniciantes na meditação.',
        date: '1972-01-10',
        location: 'Nova York',
        format: 'audio',
        media_url: '/api/placeholder/audio3.mp3',
        duration: 3000, // 50 min
        theme: 'Meditação',
        event_type: 'Workshop',
        series_title: 'Meditação e Mindfulness',
        track_title: 'Técnicas Básicas de Meditação'
      }
    ]
  }
];

export const mockTranscripts: Transcript[] = [
  {
    id: '1',
    media_item_id: '1-1',
    content: 'Bem-vindos a esta série de palestras sobre os fundamentos do budismo tibetano. Hoje vamos explorar o conceito de Dharma...',
    timestamps: [
      { time: 0, text: 'Bem-vindos a esta série de palestras sobre os fundamentos do budismo tibetano.' },
      { time: 30, text: 'Hoje vamos explorar o conceito de Dharma e sua aplicação na vida cotidiana.' },
      { time: 120, text: 'O Dharma não é apenas uma filosofia, mas uma prática viva que transforma nossa percepção da realidade.' },
      { time: 300, text: 'Vamos começar com os conceitos básicos que fundamentam toda a tradição budista.' }
    ]
  },
  {
    id: '2',
    media_item_id: '1-2',
    content: 'As Quatro Nobres Verdades são o fundamento de todo o ensinamento budista. A primeira verdade é sobre o sofrimento...',
    timestamps: [
      { time: 0, text: 'As Quatro Nobres Verdades são o fundamento de todo o ensinamento budista.' },
      { time: 45, text: 'A primeira verdade é sobre o sofrimento e sua natureza universal.' },
      { time: 180, text: 'A segunda verdade explora as causas do sofrimento.' },
      { time: 360, text: 'A terceira verdade oferece a possibilidade de cessação do sofrimento.' },
      { time: 540, text: 'A quarta verdade apresenta o caminho óctuplo como solução.' }
    ]
  }
];
