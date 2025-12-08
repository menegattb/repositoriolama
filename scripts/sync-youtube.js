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
  // Seguir redirecionamentos
  if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
    console.log(`🔄 Redirecionando para: ${res.headers.location}`);
    const redirectUrl = new URL(res.headers.location);
    const redirectClient = redirectUrl.protocol === 'https:' ? https : http;
    const redirectOptions = {
      hostname: redirectUrl.hostname,
      port: redirectUrl.port || (redirectUrl.protocol === 'https:' ? 443 : 80),
      path: redirectUrl.pathname + redirectUrl.search,
      method: 'GET',
      headers: {
        'User-Agent': 'YouTube-Sync-Script/1.0',
      },
    };
    const redirectReq = redirectClient.request(redirectOptions, (redirectRes) => {
      handleResponse(redirectRes);
    });
    redirectReq.on('error', (error) => {
      console.error('❌ Erro na requisição de redirecionamento:', error.message);
      process.exit(1);
    });
    redirectReq.end();
    return;
  }

  handleResponse(res);
});

function handleResponse(res) {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      // Verificar se é HTML (redirecionamento ou erro)
      if (data.trim().startsWith('<') || data.trim().startsWith('Redirecting')) {
        console.error('❌ Resposta não é JSON. Pode ser que o endpoint ainda não esteja disponível.');
        console.error('💡 Aguarde o deploy no Vercel ou execute localmente com: npm run dev');
        console.error(`📄 Resposta recebida: ${data.substring(0, 200)}...`);
        process.exit(1);
        return;
      }

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
      console.error('Status:', res.statusCode);
      console.error('Resposta:', data.substring(0, 500));
      process.exit(1);
    }
  });
}

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

