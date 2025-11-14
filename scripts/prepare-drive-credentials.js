#!/usr/bin/env node

/**
 * Script para preparar credenciais do Google Drive para uso no Vercel
 * 
 * Uso:
 *   node scripts/prepare-drive-credentials.js
 * 
 * Isso irá:
 * 1. Ler o arquivo JSON de credenciais
 * 2. Converter para uma única linha (sem quebras)
 * 3. Mostrar o valor pronto para colar no Vercel
 */

const fs = require('fs');
const path = require('path');

const credentialsPath = path.join(__dirname, '..', 'nth-record-478117-d1-f0cb80ff1823.json');

try {
  // Ler arquivo JSON
  const credentials = fs.readFileSync(credentialsPath, 'utf-8');
  
  // Parsear e re-stringify para garantir formato válido e remover espaços desnecessários
  const parsed = JSON.parse(credentials);
  const minified = JSON.stringify(parsed);
  
  console.log('\n✅ Credenciais preparadas com sucesso!\n');
  console.log('📋 Copie o valor abaixo e cole no Vercel como variável de ambiente:');
  console.log('   Nome: GOOGLE_SERVICE_ACCOUNT_CREDENTIALS\n');
  console.log('─'.repeat(80));
  console.log(minified);
  console.log('─'.repeat(80));
  console.log('\n💡 Instruções:');
  console.log('   1. Acesse: https://vercel.com/seu-projeto/settings/environment-variables');
  console.log('   2. Clique em "Add New"');
  console.log('   3. Name: GOOGLE_SERVICE_ACCOUNT_CREDENTIALS');
  console.log('   4. Value: Cole o JSON acima (sem aspas externas)');
  console.log('   5. Selecione: Production, Preview, Development');
  console.log('   6. Clique em "Save"\n');
  console.log('⚠️  IMPORTANTE: Compartilhe a pasta do Drive com:');
  console.log(`   ${parsed.client_email}\n`);
  
} catch (error) {
  console.error('❌ Erro ao processar credenciais:', error.message);
  console.error('\nVerifique se o arquivo existe em:', credentialsPath);
  process.exit(1);
}

