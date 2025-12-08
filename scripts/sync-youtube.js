#!/usr/bin/env node

/**
 * Script para executar sincronização manual com YouTube
 * Uso: node scripts/sync-youtube.js
 */

const https = require('https');
const http = require('http');

const SYNC_URL = process.env.SYNC_URL || 'https://repositorio.acaoparamita.com.br/api/youtube/sync';

console.log('🚀 Iniciando sincronização manual com YouTube...');
console.log(`📍 URL: ${SYNC_URL}`);

const url = new URL(SYNC_URL);
const client = url.protocol === 'https:' ? https : http;

const options = {
  hostname: url.hostname,
  port: url.port || (url.protocol === 'https:' ? 443 : 80),
  path: url.pathname,
  method: 'GET',
  headers: {
    'User-Agent': 'YouTube-Sync-Script/1.0',
  },
};

const req = client.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const result = JSON.parse(data);
      
      if (res.statusCode === 200 && result.success) {
        console.log('✅ Sincronização concluída com sucesso!');
        console.log(`📊 Playlists: ${result.data.playlists}`);
        console.log(`📹 Vídeos standalone: ${result.data.standaloneVideos}`);
        console.log(`⏱️  Duração: ${result.data.duration}`);
        if (result.data.driveUrl) {
          console.log(`🔗 Drive URL: ${result.data.driveUrl}`);
        }
        process.exit(0);
      } else {
        console.error('❌ Erro na sincronização:');
        console.error(JSON.stringify(result, null, 2));
        process.exit(1);
      }
    } catch (error) {
      console.error('❌ Erro ao processar resposta:', error.message);
      console.error('Resposta:', data);
      process.exit(1);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Erro na requisição:', error.message);
  process.exit(1);
});

req.setTimeout(300000, () => {
  console.error('❌ Timeout: A sincronização demorou mais de 5 minutos');
  req.destroy();
  process.exit(1);
});

req.end();

