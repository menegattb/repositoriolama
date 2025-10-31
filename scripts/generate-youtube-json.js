#!/usr/bin/env node

/**
 * Script para gerar JSON com dados do YouTube a partir do youtubeData.ts
 * Este JSON será hospedado na Hostinger e buscado pelo Vercel
 */

const fs = require('fs');
const path = require('path');

// Ler o arquivo youtubeData.ts
const youtubeDataPath = path.join(__dirname, '../src/data/youtubeData.ts');
const youtubeDataContent = fs.readFileSync(youtubeDataPath, 'utf-8');

// Extrair o array youtubePlaylistsData usando regex
const arrayMatch = youtubeDataContent.match(/const youtubePlaylistsData[^=]*=\s*(\[[\s\S]*?\]);/);

if (!arrayMatch) {
  console.error('❌ Não foi possível extrair youtubePlaylistsData do arquivo');
  process.exit(1);
}

try {
  // Avaliar o array (cuidado: isso funciona porque são dados estáticos)
  const youtubePlaylistsData = eval(arrayMatch[1]);
  
  // Criar o JSON
  const jsonData = {
    version: '1.0',
    generatedAt: new Date().toISOString(),
    playlists: youtubePlaylistsData
  };
  
  // Salvar o JSON
  const outputPath = path.join(__dirname, '../public/youtube-data.json');
  fs.writeFileSync(outputPath, JSON.stringify(jsonData, null, 2), 'utf-8');
  
  console.log('✅ JSON gerado com sucesso!');
  console.log(`📁 Arquivo: ${outputPath}`);
  console.log(`📊 Total de playlists: ${youtubePlaylistsData.length}`);
  console.log('\n📤 Próximos passos:');
  console.log('1. Faça upload do arquivo public/youtube-data.json para:');
  console.log('   https://repositorio.acaoparamita.com.br/api/youtube-data.json');
  console.log('2. Ou coloque em: public_html/repositorio/api/youtube-data.json');
  
} catch (error) {
  console.error('❌ Erro ao processar dados:', error.message);
  process.exit(1);
}

