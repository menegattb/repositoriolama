#!/usr/bin/env node

/**
 * Script para atualizar títulos das playlists em inglês para garantir que sejam detectadas pelo filtro
 */

const fs = require('fs');
const path = require('path');

// IDs das playlists em inglês que devem ter tag "English"
const ENGLISH_PLAYLIST_IDS = [
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

function main() {
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
  
  let updatedCount = 0;
  
  // Atualizar playlists
  jsonData.playlists = jsonData.playlists.map(playlist => {
    if (ENGLISH_PLAYLIST_IDS.includes(playlist.id)) {
      const titleLower = playlist.title.toLowerCase();
      
      // Verificar se já tem alguma tag de inglês
      const hasEnglishTag = titleLower.includes('english') || 
                           titleLower.includes('inglês') ||
                           titleLower.includes('[inglês]');
      
      if (!hasEnglishTag) {
        // Adicionar prefixo "English - " se não tiver
        playlist.title = `English - ${playlist.title}`;
        updatedCount++;
        console.log(`✅ Atualizada playlist: ${playlist.id}`);
        console.log(`   Novo título: ${playlist.title}`);
      } else if (titleLower.includes('[inglês]')) {
        // Substituir [Inglês] por English -
        playlist.title = playlist.title.replace(/\[Inglês\]\s*/i, 'English - ');
        updatedCount++;
        console.log(`✅ Atualizada playlist: ${playlist.id}`);
        console.log(`   Novo título: ${playlist.title}`);
      }
    }
    return playlist;
  });
  
  // Atualizar timestamp
  jsonData.updatedAt = new Date().toISOString();
  
  // Salvar JSON atualizado
  fs.writeFileSync(jsonPath, JSON.stringify(jsonData, null, 2), 'utf-8');
  
  console.log(`\n✅ JSON atualizado com sucesso!`);
  console.log(`📊 ${updatedCount} playlists atualizadas`);
  console.log(`📁 Arquivo: ${jsonPath}`);
}

main();




