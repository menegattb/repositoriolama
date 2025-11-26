#!/usr/bin/env node

/**
 * Script para adicionar playlists e vídeos em inglês ao youtube-data.json
 * Busca os títulos via YouTube API e adiciona com tag "English"
 */

const fs = require('fs');
const path = require('path');

// IDs das playlists em inglês
const PLAYLIST_IDS = [
  'PLO_7Zoueaxd5Ogil4Zd8FdHVqweqn2rjg',
  'PLO_7Zoueaxd6dLF5wZ4Jbqcrr9SG4bOQd',
  'PLO_7Zoueaxd4FGa9a6u-fF-GF2xEUfCm4',
  'PLO_7Zoueaxd61u76fBcIZTkhRWwkvHAOr',
  'PLO_7Zoueaxd7JDdvNIc-ph2_9mslcFNWm',
  'PLO_7Zoueaxd53vRmPA1AplphnXLvLVjMV',
  'PLO_7Zoueaxd6p9rXW1N7S-1s3jgmHR1IB',
  'PLO_7Zoueaxd4u0TAbY3n9JG5tCs7p94y9',
  'PLO_7Zoueaxd611F7uaNWnTYj_vaagrSQj',
  'PLO_7Zoueaxd49U7k4kqg_MDMuaTWHntET',
  'PLO_7Zoueaxd50qOcmTH-L5YPcmWlJBOPc',
  'PLO_7Zoueaxd6CjKpkyhTGL9Nl4j1HuzBK',
  'PLO_7Zoueaxd5CkTan9CKeR6bqX4pgIHB3',
  'PLO_7Zoueaxd7U2DWVubtMYUgCYW95Vynl',
  'PLO_7Zoueaxd6u6tjQo5pRnwI5L9fC2IwG'
];

// IDs dos vídeos em inglês
const VIDEO_IDS = [
  'HcEetubCSAo',
  'vDA1XDHdNZg',
  '7BdP2MhfObY',
  'YszGpVO6tCc',
  'N3PzaVMeNjI',
  'c7J4L1tPXRQ'
];

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

if (!YOUTUBE_API_KEY) {
  console.error('❌ YOUTUBE_API_KEY não configurada!');
  console.log('💡 Configure a variável de ambiente: export YOUTUBE_API_KEY=sua_chave_aqui');
  process.exit(1);
}

/**
 * Busca informações de uma playlist via YouTube API
 */
async function fetchPlaylistInfo(playlistId) {
  try {
    const url = `https://www.googleapis.com/youtube/v3/playlists?part=snippet,contentDetails&id=${playlistId}&key=${YOUTUBE_API_KEY}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data.items || data.items.length === 0) {
      return null;
    }
    
    const item = data.items[0];
    return {
      id: playlistId,
      title: `English - ${item.snippet.title}`,
      description: item.snippet.description || '',
      publishedAt: item.snippet.publishedAt,
      itemCount: item.contentDetails.itemCount || 0
    };
  } catch (error) {
    console.error(`❌ Erro ao buscar playlist ${playlistId}:`, error.message);
    return null;
  }
}

/**
 * Busca informações de um vídeo via YouTube API
 */
async function fetchVideoInfo(videoId) {
  try {
    const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${videoId}&key=${YOUTUBE_API_KEY}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data.items || data.items.length === 0) {
      return null;
    }
    
    const item = data.items[0];
    // Converter duração ISO 8601 para segundos
    const duration = parseDuration(item.contentDetails.duration);
    
    return {
      id: videoId,
      title: `English - ${item.snippet.title}`,
      description: item.snippet.description || '',
      publishedAt: item.snippet.publishedAt,
      duration: duration,
      thumbnail: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.default?.url
    };
  } catch (error) {
    console.error(`❌ Erro ao buscar vídeo ${videoId}:`, error.message);
    return null;
  }
}

/**
 * Converte duração ISO 8601 (PT1H2M10S) para segundos
 */
function parseDuration(duration) {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  
  const hours = parseInt(match[1] || '0', 10);
  const minutes = parseInt(match[2] || '0', 10);
  const seconds = parseInt(match[3] || '0', 10);
  
  return hours * 3600 + minutes * 60 + seconds;
}

/**
 * Função principal
 */
async function main() {
  const jsonPath = path.join(__dirname, '../public/youtube-data.json');
  
  // Ler JSON existente
  let jsonData;
  try {
    const jsonContent = fs.readFileSync(jsonPath, 'utf-8');
    jsonData = JSON.parse(jsonContent);
  } catch (error) {
    console.error('❌ Erro ao ler JSON:', error.message);
    process.exit(1);
  }
  
  // Garantir que standaloneVideos existe
  if (!jsonData.standaloneVideos) {
    jsonData.standaloneVideos = [];
  }
  
  console.log('📋 Buscando informações das playlists...');
  const newPlaylists = [];
  
  for (const playlistId of PLAYLIST_IDS) {
    // Verificar se já existe
    const exists = jsonData.playlists.some(p => p.id === playlistId);
    if (exists) {
      console.log(`⏭️  Playlist ${playlistId} já existe, pulando...`);
      continue;
    }
    
    console.log(`🔍 Buscando playlist: ${playlistId}`);
    const playlistInfo = await fetchPlaylistInfo(playlistId);
    
    if (playlistInfo) {
      newPlaylists.push(playlistInfo);
      console.log(`✅ Adicionada: ${playlistInfo.title}`);
    } else {
      console.log(`⚠️  Não foi possível buscar playlist ${playlistId}`);
    }
    
    // Pequeno delay para não exceder rate limit
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log('\n📹 Buscando informações dos vídeos...');
  const newVideos = [];
  
  for (const videoId of VIDEO_IDS) {
    // Verificar se já existe
    const exists = jsonData.standaloneVideos.some(v => v.id === videoId);
    if (exists) {
      console.log(`⏭️  Vídeo ${videoId} já existe, pulando...`);
      continue;
    }
    
    console.log(`🔍 Buscando vídeo: ${videoId}`);
    const videoInfo = await fetchVideoInfo(videoId);
    
    if (videoInfo) {
      newVideos.push(videoInfo);
      console.log(`✅ Adicionado: ${videoInfo.title}`);
    } else {
      console.log(`⚠️  Não foi possível buscar vídeo ${videoId}`);
    }
    
    // Pequeno delay para não exceder rate limit
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  // Adicionar novos itens ao JSON
  if (newPlaylists.length > 0) {
    jsonData.playlists.push(...newPlaylists);
    console.log(`\n✅ ${newPlaylists.length} playlists adicionadas`);
  }
  
  if (newVideos.length > 0) {
    jsonData.standaloneVideos.push(...newVideos);
    console.log(`✅ ${newVideos.length} vídeos adicionados`);
  }
  
  // Atualizar timestamp
  jsonData.updatedAt = new Date().toISOString();
  
  // Salvar JSON atualizado
  fs.writeFileSync(jsonPath, JSON.stringify(jsonData, null, 2), 'utf-8');
  
  console.log(`\n✅ JSON atualizado com sucesso!`);
  console.log(`📁 Arquivo: ${jsonPath}`);
  console.log(`📊 Total de playlists: ${jsonData.playlists.length}`);
  console.log(`📹 Total de vídeos standalone: ${jsonData.standaloneVideos.length}`);
  
  if (newPlaylists.length === 0 && newVideos.length === 0) {
    console.log('\n💡 Todos os itens já existem no JSON.');
  }
}

main().catch(error => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});

