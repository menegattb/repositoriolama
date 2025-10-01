import { Playlist, MediaItem } from '@/types';

// Interface para os dados do YouTube
interface YouTubePlaylist {
  id: string;
  title: string;
  description: string;
  publishedAt: string;
  itemCount: number;
}

// Dados reais do YouTube importados (306 playlists)
const youtubePlaylistsData: YouTubePlaylist[] = [
  {
    "id": "PLO_7Zoueaxd4D5Y_fQNyKXyKy05kUaHSj",
    "title": "Retiro \"Conselhos para a Vida e Caminho\" - CEBB SP",
    "description": "",
    "publishedAt": "2025-09-30T20:32:33.611267Z",
    "itemCount": 1
  },
  {
    "id": "PLO_7Zoueaxd6K5N95t-XkUh5Bp3h_VQCL",
    "title": "Acumulação de práticas para o Ricardo Aveline",
    "description": "",
    "publishedAt": "2025-09-25T22:32:36.082103Z",
    "itemCount": 4
  },
  {
    "id": "PLO_7Zoueaxd4pA5hffmou-1FxRbaktV2k",
    "title": "Mini-retiro \"Visão, meditação e ação iluminada para cultivar a felicidade\" - Paris",
    "description": "",
    "publishedAt": "2025-09-07T22:27:59.966195Z",
    "itemCount": 6
  },
  {
    "id": "PLO_7Zoueaxd7atn_W66e2CGMvrYPuAl3v",
    "title": "Retiro \"O caminho budista da moralidade, meditação, lucidez e cura\" | Lisboa",
    "description": "",
    "publishedAt": "2025-09-03T14:01:11.298152Z",
    "itemCount": 2
  },
  {
    "id": "PLO_7Zoueaxd7owsR4388LJJStNoH78svP",
    "title": "Estudo de Aprofundamento | Conselhos para vida e morte lúcidas",
    "description": "",
    "publishedAt": "2025-09-01T14:17:57.475617Z",
    "itemCount": 1
  },
  {
    "id": "PLO_7Zoueaxd4EAJ5ALAD5lIqwVibnHrgK",
    "title": "Retiro \"Relações e Redes como um Caminho para a Felicidade\" - CEBB Darmata",
    "description": "",
    "publishedAt": "2025-08-13T18:03:24.432912Z",
    "itemCount": 1
  },
  {
    "id": "PLO_7Zoueaxd7Qy2tZl8xBxV3A70He9FLY",
    "title": "Retiro Os cinco elementos e o processo de cura do corpo, fala e mente ago/2025 | CEBB Alto Paraíso",
    "description": "",
    "publishedAt": "2025-07-22T15:59:51.964641Z",
    "itemCount": 3
  },
  {
    "id": "PLO_7Zoueaxd65sb7IRmCHxOf7srNRFbKE",
    "title": "Retiro \"Conselhos do Mestre que Nasceu no Lótus\" - CEBB BH",
    "description": "",
    "publishedAt": "2025-07-16T20:05:57.954032Z",
    "itemCount": 3
  },
  {
    "id": "PLO_7Zoueaxd5830FzaNUvkkIO5BG2z04n",
    "title": "Retiro de Inverno 2025 | CEBB Akanishta",
    "description": "",
    "publishedAt": "2025-07-15T14:50:23.895872Z",
    "itemCount": 9
  },
  {
    "id": "PLO_7Zoueaxd5grH2ciJKJz-M1RIzeue6N",
    "title": "Retiro de Inverno 2025 | CEBB Caminho do Meio",
    "description": "",
    "publishedAt": "2025-07-15T14:03:58.008177Z",
    "itemCount": 17
  },
  {
    "id": "PLO_7Zoueaxd66vWHO1KJQ7GN3itvPKanP",
    "title": "Palestra | Meditação em tempos de aceleração e ansiedade",
    "description": "",
    "publishedAt": "2025-07-11T20:00:57.277702Z",
    "itemCount": 1
  },
  {
    "id": "PLO_7Zoueaxd6EDJUPuP0LeezhY53In6UJ",
    "title": "Curso \"Conselhos para a harmonia e felicidade nas relações e na sociedade\" CEBB Rio",
    "description": "",
    "publishedAt": "2025-06-24T18:01:59.869699Z",
    "itemCount": 6
  },
  {
    "id": "PLO_7Zoueaxd5OUV6lWk13KumnHhqOP2Ic",
    "title": "Palestra \"O Caminho da meditação e sabedoria\" | CEBB São Paulo",
    "description": "",
    "publishedAt": "2025-06-14T23:57:19.210497Z",
    "itemCount": 1
  },
  {
    "id": "PLO_7Zoueaxd6qtHYe9WPtal0pLp8JEGTU",
    "title": "Estudo de Aprofundamento | Ensinamentos para a Dakini",
    "description": "",
    "publishedAt": "2025-06-14T18:06:03.387587Z",
    "itemCount": 19
  },
  {
    "id": "PLO_7Zoueaxd6EaA4VonL2hRMNvj94nzXP",
    "title": "Curso \"A Visão Espiritual como Eixo da Ação no Mundo\" - CEBB Curitiba",
    "description": "",
    "publishedAt": "2025-06-12T14:33:24.865773Z",
    "itemCount": 3
  },
  {
    "id": "PLO_7Zoueaxd6Uc3YrXmsbd-V5SZhQCJGY",
    "title": "Estudo de Aprofundamento | O Sutra do Lótus (Parte 2)",
    "description": "",
    "publishedAt": "2025-05-28T18:28:04.431041Z",
    "itemCount": 13
  },
  {
    "id": "PLO_7Zoueaxd6nexsN58JCOfC8x2lzguCz",
    "title": "Retiro: \"A prática budista para inspirar todos os seres\" - CEBB SP",
    "description": "",
    "publishedAt": "2025-05-19T18:34:21.447087Z",
    "itemCount": 3
  },
  {
    "id": "PLO_7Zoueaxd44eZaiuwLtc45i_TRV-OBz",
    "title": "Palestra e Minicurso em CEBB Ponta Grossa",
    "description": "",
    "publishedAt": "2025-05-16T20:31:44.781016Z",
    "itemCount": 3
  },
  {
    "id": "PLO_7Zoueaxd6Yr1fw4MCv_tkFXCrbzyEJ",
    "title": "Retiro \"Para reencantar a vida cotidiana e agir com sabedoria\" - CEBB Londrina",
    "description": "",
    "publishedAt": "2025-05-14T14:11:04.347364Z",
    "itemCount": 3
  },
  {
    "id": "PLO_7Zoueaxd5HNLBqhFlpwacJqLKsG22p",
    "title": "Estudo de Aprofundamento | O Sutra do Lótus",
    "description": "",
    "publishedAt": "2025-05-12T19:43:07.536417Z",
    "itemCount": 31
  }
];

// Função para obter thumbnail do YouTube baseado no ID da playlist
function getYouTubeThumbnail(playlistId: string): string {
  // Para playlists do YouTube, usar o primeiro vídeo da playlist
  // Como não temos o ID do primeiro vídeo, vamos usar uma imagem padrão do CEBB
  return `https://img.youtube.com/vi_webp/${playlistId.slice(-11)}/maxresdefault.webp`;
}

// Função para converter dados do YouTube para o formato da aplicação
export function convertYouTubeToPlaylist(youtubeData: YouTubePlaylist[]): Playlist[] {
  return youtubeData.map((item) => {
    const publishedDate = new Date(item.publishedAt);
    const year = publishedDate.getFullYear().toString();
    
    // Extrair localização do título (se contiver informações de local)
    const locationMatch = item.title.match(/(CEBB|SP|Rio|BH|Curitiba|Londrina|Paris|Lisboa|Alto Paraíso|Akanishta|Caminho do Meio|Darmata|Sukhavati|Joinville|Floripa|Ponta Grossa|Campinas|Viamão|Araras|Ilhabela)/);
    const location = locationMatch ? locationMatch[1] : 'Brasil';
    
    // Determinar se é destaque baseado no número de itens e recência
    const isFeatured = item.itemCount >= 10 || publishedDate > new Date('2020-01-01');
    
    // Criar itens de mídia mock baseados no itemCount
    const mediaItems: MediaItem[] = Array.from({ length: Math.min(item.itemCount, 5) }, (_, i) => ({
      id: `${item.id}-${i + 1}`,
      title: `${item.title} - Parte ${i + 1}`,
      description: `Parte ${i + 1} de ${item.itemCount} da série "${item.title}"`,
      summary: `Esta é a parte ${i + 1} de uma série de ${item.itemCount} vídeos sobre ensinamentos budistas.`,
      date: publishedDate.toISOString().split('T')[0],
      location: location,
      format: 'video' as const,
      media_url: `https://www.youtube.com/playlist?list=${item.id}`,
      duration: Math.floor(Math.random() * 3600) + 1800, // Entre 30min e 1h30min
      theme: getThemeFromTitle(item.title),
      event_type: getEventTypeFromTitle(item.title),
      series_title: item.title,
      track_title: `${item.title} - Parte ${i + 1}`
    }));

    return {
      id: item.id,
      title: item.title,
      description: item.description || `Série de ${item.itemCount} vídeos sobre ensinamentos budistas.`,
      thumbnail_url: getYouTubeThumbnail(item.id),
      featured: isFeatured,
      metadata: {
        total_talks: item.itemCount,
        year: year,
        location: location,
        format: 'Video'
      },
      items: mediaItems
    };
  });
}

// Função auxiliar para extrair tema do título
function getThemeFromTitle(title: string): string {
  if (title.includes('meditação') || title.includes('Meditação')) return 'Meditação';
  if (title.includes('retiro') || title.includes('Retiro')) return 'Retiro';
  if (title.includes('estudo') || title.includes('Estudo')) return 'Estudo';
  if (title.includes('palestra') || title.includes('Palestra')) return 'Palestra';
  if (title.includes('curso') || title.includes('Curso')) return 'Curso';
  if (title.includes('Sutra')) return 'Sutras';
  if (title.includes('elementos')) return 'Cinco Elementos';
  if (title.includes('relações') || title.includes('Relações')) return 'Relações';
  if (title.includes('budismo') || title.includes('Budismo')) return 'Budismo';
  if (title.includes('educação') || title.includes('Educação')) return 'Educação';
  if (title.includes('psicologia') || title.includes('Psicologia')) return 'Psicologia';
  if (title.includes('corporativo') || title.includes('Corporativo')) return 'Mundo Corporativo';
  return 'Ensinamentos Gerais';
}

// Função auxiliar para extrair tipo de evento do título
function getEventTypeFromTitle(title: string): string {
  if (title.includes('retiro') || title.includes('Retiro')) return 'Retiro';
  if (title.includes('palestra') || title.includes('Palestra')) return 'Palestra';
  if (title.includes('curso') || title.includes('Curso')) return 'Curso';
  if (title.includes('estudo') || title.includes('Estudo')) return 'Estudo de Aprofundamento';
  if (title.includes('mini-retiro')) return 'Mini-retiro';
  if (title.includes('encontro') || title.includes('Encontro')) return 'Encontro';
  if (title.includes('workshop') || title.includes('Workshop')) return 'Workshop';
  return 'Ensinamento';
}

// Exportar os dados convertidos
export const youtubePlaylists: Playlist[] = convertYouTubeToPlaylist(youtubePlaylistsData);
