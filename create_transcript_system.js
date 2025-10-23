const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Função para gerar código único (similar ao YouTube)
function generateUniqueCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  let result = '';
  for (let i = 0; i < 11; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Função para limpar título removendo caracteres especiais
function cleanTitle(filename) {
  return filename
    .replace(/^#\d+\s*-\s*/, '') // Remove prefixos como "#01 - "
    .replace(/^#\d+\s*/, '') // Remove prefixos como "#01 "
    .replace(/\.pdf$/i, '') // Remove extensão .pdf
    .replace(/\s*–\s*RI\s*\d+/, '') // Remove sufixos como "– RI 2020"
    .replace(/\s*REVISADO$/, '') // Remove "REVISADO"
    .replace(/\s*JÁ\s*INSERIDO\s*OP\s*-\s*/, '') // Remove "JÁ INSERIDO OP -"
    .replace(/\s*\([^)]*\)$/, '') // Remove parênteses no final
    .replace(/\s*\[[^\]]*\]$/, '') // Remove colchetes no final
    .replace(/[^\w\s\-\.]/g, '') // Remove caracteres especiais
    .replace(/\s+/g, ' ') // Normaliza espaços
    .trim();
}

// Função para gerar slug para URL
function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^\w\s\-]/g, '') // Remove caracteres especiais
    .replace(/\s+/g, '-') // Substitui espaços por hífens
    .replace(/-+/g, '-') // Remove hífens duplicados
    .replace(/^-|-$/g, ''); // Remove hífens do início e fim
}

// Função para categorizar baseado no título limpo
function categorizeTranscript(title) {
  const titleLower = title.toLowerCase();
  const categories = [];
  
  // Quatro Nobres Verdades
  if (/(quatro|4)\s*nobres\s*verdades/i.test(titleLower) || 
      /primeira\s*nobre\s*verdade/i.test(titleLower) ||
      /segunda\s*nobre\s*verdade/i.test(titleLower) ||
      /terceira\s*nobre\s*verdade/i.test(titleLower) ||
      /quarta\s*nobre\s*verdade/i.test(titleLower) ||
      /nobre\s*caminho/i.test(titleLower) ||
      /caminho\s*octuplo/i.test(titleLower) ||
      /dukkha/i.test(titleLower)) {
    categories.push('quatro-nobres-verdades');
  }
  
  // Origem Dependente
  if (/(origem\s*dependente|doze\s*elos|12\s*elos)/i.test(titleLower) ||
      /originação\s*dependente/i.test(titleLower) ||
      /interdependência/i.test(titleLower) ||
      /liberação\s*da\s*origem/i.test(titleLower)) {
    categories.push('origem-dependente');
  }
  
  // Prajna Paramita
  if (/prajna\s*paramita/i.test(titleLower) ||
      /prajnaparamita/i.test(titleLower) ||
      /oito\s*pontos/i.test(titleLower) ||
      /8\s*pontos/i.test(titleLower) ||
      /21\s*itens/i.test(titleLower) ||
      /perfeição\s*da\s*sabedoria/i.test(titleLower)) {
    categories.push('prajna-paramita');
  }
  
  // Sutra do Diamante
  if (/sutra\s*do\s*diamante/i.test(titleLower) ||
      /vajra\s*prajna/i.test(titleLower) ||
      /diamante/i.test(titleLower)) {
    categories.push('sutra-do-diamante');
  }
  
  // Meditação e Prática
  if (/(meditação|shamata|mettabhavana|prática|contemplação)/i.test(titleLower) ||
      /dhyana/i.test(titleLower) ||
      /pensar\s*contemplar\s*repousar/i.test(titleLower)) {
    categories.push('meditacao-e-pratica');
  }
  
  // Satipathana
  if (/satipathana/i.test(titleLower) ||
      /satipatthana/i.test(titleLower) ||
      /sati/i.test(titleLower) ||
      /fundamentos\s*da\s*atenção/i.test(titleLower)) {
    categories.push('satipathana');
  }
  
  // Sabedoria Primordial
  if (/(sabedoria\s*primordial|iluminação)/i.test(titleLower) ||
      /natureza\s*da\s*mente/i.test(titleLower) ||
      /luminosidade/i.test(titleLower)) {
    categories.push('sabedoria-primordial');
  }
  
  // Mahamudra
  if (/mahamudra/i.test(titleLower) ||
      /tilopa/i.test(titleLower) ||
      /naropa/i.test(titleLower) ||
      /versos/i.test(titleLower)) {
    categories.push('mahamudra');
  }
  
  // Bardos e Morte
  if (/bardos/i.test(titleLower) ||
      /bardo/i.test(titleLower) ||
      /vida\s*e\s*morte/i.test(titleLower) ||
      /cinco\s*bardos/i.test(titleLower) ||
      /morte/i.test(titleLower)) {
    categories.push('bardos-e-morte');
  }
  
  // Bodhicitta e Motivação
  if (/(bodhicitta|bodicita|motivação)/i.test(titleLower) ||
      /compaixão/i.test(titleLower) ||
      /bom\s*coração/i.test(titleLower)) {
    categories.push('bodhicitta-e-motivacao');
  }
  
  // Mandala
  if (/mandala/i.test(titleLower) ||
      /visualização/i.test(titleLower) ||
      /método\s*da\s*mandala/i.test(titleLower)) {
    categories.push('mandala');
  }
  
  // Ensinamentos Gerais
  if (/(ensinamentos\s*gerais|contexto\s*dos\s*ensinamentos)/i.test(titleLower) ||
      /estrutura\s*dos\s*ensinamentos/i.test(titleLower) ||
      /visão\s*geral/i.test(titleLower) ||
      /abordagens\s*no\s*budismo/i.test(titleLower) ||
      /roda\s*do\s*darma/i.test(titleLower)) {
    categories.push('ensinamentos-gerais');
  }
  
  // Textos Específicos
  if (/(sutra|texto|dudjom|gampopa|tilopa|naropa)/i.test(titleLower) &&
      !categories.includes('prajna-paramita') &&
      !categories.includes('sutra-do-diamante') &&
      !categories.includes('satipathana')) {
    categories.push('textos-especificos');
  }
  
  // Materiais de Apoio
  if (/(apostila|roteiro|template|anexo|orientações|lista\s*de\s*nomes|como\s*usar)/i.test(titleLower)) {
    categories.push('materiais-de-apoio');
  }
  
  return categories.length > 0 ? categories : ['outros'];
}

// Função para gerar preview baseado no título
function generatePreview(title) {
  const commonPhrases = {
    'Estrutura dos Ensinamentos': 'Uma introdução à estrutura fundamental dos ensinamentos budistas...',
    'Perguntas e Respostas': 'Sessão de perguntas e respostas sobre os ensinamentos...',
    'Contexto dos Ensinamentos': 'Explorando o contexto histórico e filosófico dos ensinamentos...',
    'Motivação': 'Reflexões sobre motivação e intenção na prática budista...',
    'Shamata': 'Ensinamentos sobre a prática de shamata (meditação de tranquilidade)...',
    'Mettabhavana': 'Prática de mettabhavana (meditação de amor bondade)...',
    'Nobre Verdade': 'Explorando as Quatro Nobres Verdades do Budismo...',
    'Origem Dependente': 'Ensinamentos sobre a origem dependente e interdependência...',
    'Prajna Paramita': 'Sutra da Perfeição da Sabedoria - ensinamentos profundos...',
    'Sutra do Diamante': 'Comentários sobre o Sutra do Diamante...',
    'Satipathana': 'Ensinamentos sobre os fundamentos da atenção plena...',
    'Sabedoria Primordial': 'Reflexões sobre a sabedoria primordial e iluminação...',
    'Tilopa': 'Ensinamentos baseados nos versos de Tilopa a Naropa...',
    'Darma Tolo': 'Comentários sobre os ensinamentos de Dudjom Lingpa...',
    'Mandala': 'Ensinamentos sobre mandala e visualização...',
    'Contemplação': 'Práticas de contemplação e reflexão profunda...',
    'Bardo': 'Ensinamentos sobre os estados intermediários (bardos)...',
    'Mahamudra': 'Instruções diretas sobre Mahamudra...',
    'Identidade': 'Reflexões sobre identidade e não-identidade...',
    'Compaixão': 'Ensinamentos sobre compaixão e bodhicitta...'
  };

  for (const [key, phrase] of Object.entries(commonPhrases)) {
    if (title.toLowerCase().includes(key.toLowerCase())) {
      return phrase;
    }
  }

  return `Transcrição corrigida pela Sanga: ${title}`;
}

// Ler arquivos da pasta
const pdfDir = path.join(__dirname, 'public', 'pdfs_transcricoes_corrigidas');
const files = fs.readdirSync(pdfDir, { encoding: 'utf8' }).filter(file => file.endsWith('.pdf'));

console.log(`📚 Processando ${files.length} arquivos PDF...`);

// Processar todos os arquivos
const transcripts = files.map((filename, index) => {
  const title = cleanTitle(filename);
  const code = generateUniqueCode();
  const slug = generateSlug(title);
  const categories = categorizeTranscript(title);
  const preview = generatePreview(title);
  
  // URL limpa sem caracteres especiais
  const cleanUrl = `/pdfs_transcricoes_corrigidas/${encodeURIComponent(filename)}`;

  return {
    id: code,
    code: code,
    title: title,
    slug: slug,
    filename: filename,
    url: cleanUrl,
    preview: preview,
    categories: categories,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}).sort((a, b) => a.title.localeCompare(b.title));

// Gerar estatísticas
const categoryStats = {};
transcripts.forEach(transcript => {
  transcript.categories.forEach(cat => {
    categoryStats[cat] = (categoryStats[cat] || 0) + 1;
  });
});

// Criar estrutura JSON elegante
const transcriptData = {
  metadata: {
    total: transcripts.length,
    lastUpdated: new Date().toISOString(),
    version: '2.0.0'
  },
  categories: {
    'quatro-nobres-verdades': {
      name: 'Quatro Nobres Verdades',
      description: 'Ensinamentos sobre as 4 Nobres Verdades e Nobre Caminho Óctuplo',
      count: categoryStats['quatro-nobres-verdades'] || 0
    },
    'origem-dependente': {
      name: 'Origem Dependente (12 Elos)',
      description: 'Ensinamentos sobre origem dependente, 12 elos, interdependência',
      count: categoryStats['origem-dependente'] || 0
    },
    'prajna-paramita': {
      name: 'Prajna Paramita',
      description: 'Sutra da Perfeição da Sabedoria, Roteiro 8 Pontos, Roteiro 21 itens',
      count: categoryStats['prajna-paramita'] || 0
    },
    'sutra-do-diamante': {
      name: 'Sutra do Diamante',
      description: 'Comentários específicos sobre Vajra Prajna Paramita',
      count: categoryStats['sutra-do-diamante'] || 0
    },
    'meditacao-e-pratica': {
      name: 'Meditação e Prática',
      description: 'Shamata, Mettabhavana, contemplação, práticas de meditação',
      count: categoryStats['meditacao-e-pratica'] || 0
    },
    'satipathana': {
      name: 'Satipathana',
      description: 'Fundamentos da atenção plena, Satipathana Sutta',
      count: categoryStats['satipathana'] || 0
    },
    'sabedoria-primordial': {
      name: 'Sabedoria Primordial',
      description: 'Iluminação, sabedoria primordial, natureza da mente',
      count: categoryStats['sabedoria-primordial'] || 0
    },
    'mahamudra': {
      name: 'Mahamudra',
      description: 'Ensinamentos Mahamudra, Tilopa, Naropa',
      count: categoryStats['mahamudra'] || 0
    },
    'bardos-e-morte': {
      name: 'Bardos e Morte',
      description: 'Estados intermediários, vida e morte, transição',
      count: categoryStats['bardos-e-morte'] || 0
    },
    'bodhicitta-e-motivacao': {
      name: 'Bodhicitta e Motivação',
      description: 'Motivação, bodhicitta, compaixão',
      count: categoryStats['bodhicitta-e-motivacao'] || 0
    },
    'mandala': {
      name: 'Mandala',
      description: 'Método da mandala, visualização',
      count: categoryStats['mandala'] || 0
    },
    'ensinamentos-gerais': {
      name: 'Ensinamentos Gerais',
      description: 'Contexto, estrutura dos ensinamentos, visão geral',
      count: categoryStats['ensinamentos-gerais'] || 0
    },
    'textos-especificos': {
      name: 'Textos Específicos',
      description: 'Dudjom Lingpa, Gampopa, Patrul Rinpoche, outros mestres',
      count: categoryStats['textos-especificos'] || 0
    },
    'materiais-de-apoio': {
      name: 'Materiais de Apoio',
      description: 'Compilações, roteiros, anexos, templates',
      count: categoryStats['materiais-de-apoio'] || 0
    },
    'outros': {
      name: 'Outros',
      description: 'Documentos que não se encaixam nas categorias principais',
      count: categoryStats['outros'] || 0
    }
  },
  transcripts: transcripts
};

// Salvar JSON
fs.writeFileSync(
  path.join(__dirname, 'src', 'data', 'transcripts.json'), 
  JSON.stringify(transcriptData, null, 2)
);

// Gerar arquivo TypeScript
const tsContent = `export interface Transcript {
  id: string;
  code: string;
  title: string;
  slug: string;
  filename: string;
  url: string;
  preview: string;
  categories: string[];
  createdAt: string;
  updatedAt: string;
}

export interface TranscriptCategory {
  name: string;
  description: string;
  count: number;
}

export interface TranscriptData {
  metadata: {
    total: number;
    lastUpdated: string;
    version: string;
  };
  categories: Record<string, TranscriptCategory>;
  transcripts: Transcript[];
}

import transcriptData from './transcripts.json';

export const transcripts = transcriptData.transcripts;
export const categories = transcriptData.categories;
export const transcriptMetadata = transcriptData.metadata;

export default transcriptData;
`;

fs.writeFileSync(
  path.join(__dirname, 'src', 'data', 'transcriptsData.ts'), 
  tsContent
);

console.log('✅ Sistema de transcrições criado com sucesso!');
console.log(`📊 Total de transcrições: ${transcripts.length}`);
console.log('\n📚 Estatísticas por categoria:');
Object.entries(categoryStats)
  .sort(([,a], [,b]) => b - a)
  .forEach(([category, count]) => {
    console.log(`  ${category}: ${count} arquivos`);
  });

console.log('\n🔗 Exemplos de códigos gerados:');
transcripts.slice(0, 5).forEach(transcript => {
  console.log(`  ${transcript.title}: ${transcript.code}`);
});

console.log('\n📁 Arquivos criados:');
console.log('  - src/data/transcripts.json');
console.log('  - src/data/transcriptsData.ts');
