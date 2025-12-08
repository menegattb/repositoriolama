#!/usr/bin/env node

/**
 * Script para encontrar o Channel ID usando a API do YouTube
 * Uso: YOUTUBE_API_KEY=sua_chave node scripts/find-channel-id.js [username]
 */

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || 'AIzaSyDl_8EPAngkktSNXRrMMIrD7CSAF4RXXkY';
const username = process.argv[2] || 'acaoparamita'; // username padrão ou fornecido

console.log('🔍 Buscando Channel ID...');
console.log(`📋 Username: ${username}`);
console.log(`🔑 API Key: ${YOUTUBE_API_KEY.substring(0, 10)}...`);

async function findChannelId() {
  try {
    // Método 1: Buscar por username
    console.log('\n📡 Método 1: Buscando por username...');
    const url1 = `https://www.googleapis.com/youtube/v3/channels?part=id&forUsername=${username}&key=${YOUTUBE_API_KEY}`;
    const response1 = await fetch(url1);
    
    if (response1.ok) {
      const data1 = await response1.json();
      if (data1.items && data1.items.length > 0) {
        const channelId = data1.items[0].id;
        console.log(`✅ Channel ID encontrado: ${channelId}`);
        console.log(`\n💡 Adicione esta variável no Vercel:`);
        console.log(`YOUTUBE_CHANNEL_ID=${channelId}`);
        return channelId;
      }
    }
    
    // Método 2: Buscar por customUrl (se username não funcionar)
    console.log('\n📡 Método 2: Buscando por customUrl...');
    const url2 = `https://www.googleapis.com/youtube/v3/channels?part=id&forUsername=${username}&key=${YOUTUBE_API_KEY}`;
    const response2 = await fetch(url2);
    
    if (response2.ok) {
      const data2 = await response2.json();
      if (data2.items && data2.items.length > 0) {
        const channelId = data2.items[0].id;
        console.log(`✅ Channel ID encontrado: ${channelId}`);
        console.log(`\n💡 Adicione esta variável no Vercel:`);
        console.log(`YOUTUBE_CHANNEL_ID=${channelId}`);
        return channelId;
      }
    }
    
    // Método 3: Listar canais do usuário autenticado (se aplicável)
    console.log('\n📡 Método 3: Tentando buscar canais...');
    const url3 = `https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true&key=${YOUTUBE_API_KEY}`;
    const response3 = await fetch(url3);
    
    if (response3.ok) {
      const data3 = await response3.json();
      if (data3.items && data3.items.length > 0) {
        console.log('\n📋 Canais encontrados:');
        data3.items.forEach((item, index) => {
          console.log(`${index + 1}. ${item.snippet.title} - ID: ${item.id}`);
        });
        const channelId = data3.items[0].id;
        console.log(`\n✅ Usando primeiro canal: ${channelId}`);
        console.log(`\n💡 Adicione esta variável no Vercel:`);
        console.log(`YOUTUBE_CHANNEL_ID=${channelId}`);
        return channelId;
      }
    }
    
    // Método 4: Buscar por uma playlist conhecida
    console.log('\n📡 Método 4: Buscando Channel ID através de uma playlist conhecida...');
    const knownPlaylistId = 'PLO_7Zoueaxd4D5Y_fQNyKXyKy05kUaHSj'; // Uma playlist do canal
    const url4 = `https://www.googleapis.com/youtube/v3/playlists?part=snippet&id=${knownPlaylistId}&key=${YOUTUBE_API_KEY}`;
    const response4 = await fetch(url4);
    
    if (response4.ok) {
      const data4 = await response4.json();
      if (data4.items && data4.items.length > 0) {
        const channelId = data4.items[0].snippet.channelId;
        console.log(`✅ Channel ID encontrado através da playlist: ${channelId}`);
        console.log(`\n💡 Adicione esta variável no Vercel:`);
        console.log(`YOUTUBE_CHANNEL_ID=${channelId}`);
        return channelId;
      }
    }
    
    console.error('\n❌ Não foi possível encontrar o Channel ID automaticamente.');
    console.error('\n💡 Opções:');
    console.error('1. Acesse seu canal no YouTube');
    console.error('2. O Channel ID está na URL ou nas configurações do canal');
    console.error('3. Formato: UC seguido de 22 caracteres (ex: UCxxxxxxxxxxxxxxxxxxxxxx)');
    console.error('\nOu forneça o username correto:');
    console.error(`   node scripts/find-channel-id.js seu_username`);
    
  } catch (error) {
    console.error('❌ Erro ao buscar Channel ID:', error.message);
    if (error.message.includes('403')) {
      console.error('\n⚠️ Erro 403: Verifique se a API key tem permissões para YouTube Data API v3');
    }
  }
}

findChannelId();

