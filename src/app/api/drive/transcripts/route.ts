import { NextRequest, NextResponse } from 'next/server';
import { Transcript } from '@/data/transcriptsData';
import { generateSlug } from '@/lib/driveUtils';

/**
 * API Route para buscar transcrições corrigidas do Google Drive
 * Endpoint: GET /api/drive/transcripts
 * 
 * Busca todos os arquivos PDF da pasta compartilhada do Google Drive
 * e retorna no formato compatível com a interface Transcript
 */

const DRIVE_FOLDER_ID = '1tNoQ2HAgyzj_NIGejiEr4lMS2p8XRneW';
const GOOGLE_DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3';

// Mapeamento de categorias baseado em palavras-chave no título
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  'quatro-nobres-verdades': ['nobre verdade', 'nobres verdades', 'nobre caminho', 'dukkha', 'samsara'],
  'origem-dependente': ['origem dependente', '12 elos', 'doze elos', 'interdependência'],
  'prajna-paramita': ['prajna paramita', 'perfeição da sabedoria', 'roteiro 8 pontos', 'roteiro 21'],
  'sutra-do-diamante': ['sutra do diamante', 'vajra', 'diamante'],
  'meditacao-e-pratica': ['meditação', 'shamata', 'mettabhavana', 'contemplação', 'prática'],
  'satipathana': ['satipathana', 'atenção plena', 'mindfulness'],
  'sabedoria-primordial': ['sabedoria primordial', 'iluminação', 'natureza da mente'],
  'mahamudra': ['mahamudra', 'tilopa', 'naropa'],
  'bardos-e-morte': ['bardo', 'morte', 'transição'],
  'bodhicitta-e-motivacao': ['bodhicitta', 'motivação', 'compaixão'],
  'mandala': ['mandala'],
  'ensinamentos-gerais': ['contexto', 'estrutura', 'visão geral'],
  'textos-especificos': ['dudjom', 'gampopa', 'patrul', 'rinpoche'],
  'materiais-de-apoio': ['roteiro', 'compilação', 'template', 'anexo'],
};

/**
 * Detecta categorias baseado no título do arquivo
 */
function detectCategories(title: string): string[] {
  const titleLower = title.toLowerCase();
  const categories: string[] = [];

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some(keyword => titleLower.includes(keyword))) {
      categories.push(category);
    }
  }

  // Se não encontrou nenhuma categoria, adiciona "outros"
  if (categories.length === 0) {
    categories.push('outros');
  }

  return categories;
}

/**
 * Busca arquivos do Google Drive usando a API v3
 */
interface DriveFile {
  id: string;
  name: string;
  createdTime?: string;
  modifiedTime?: string;
  webViewLink?: string;
  webContentLink?: string;
}

interface DriveApiResponse {
  files?: DriveFile[];
  nextPageToken?: string;
}

async function fetchDriveFiles(folderId: string, apiKey?: string): Promise<DriveFile[]> {
  const query = `'${folderId}' in parents and mimeType='application/pdf' and trashed=false`;
  const fields = 'files(id,name,createdTime,modifiedTime,webViewLink,webContentLink)';
  
  // Usar pageSize=1000 para buscar mais arquivos por página (máximo permitido)
  let url = `${GOOGLE_DRIVE_API_BASE}/files?q=${encodeURIComponent(query)}&fields=${fields}&orderBy=name&pageSize=1000`;
  
  if (apiKey) {
    url += `&key=${apiKey}`;
  }

  const allFiles: DriveFile[] = [];
  let nextPageToken: string | undefined;

  do {
    const currentUrl = nextPageToken ? `${url}&pageToken=${nextPageToken}` : url;
    
    const response = await fetch(currentUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Drive API] Erro na resposta:', response.status, errorText);
      
      if (response.status === 403) {
        throw new Error('Acesso negado à API do Google Drive. Verifique se a pasta é pública ou configure GOOGLE_DRIVE_API_KEY.');
      }
      
      throw new Error(`Erro ao buscar arquivos do Drive: ${response.status} - ${errorText}`);
    }

    const data: DriveApiResponse = await response.json();
    
    if (data.files && Array.isArray(data.files)) {
      allFiles.push(...data.files);
      console.log(`[Drive API] Página processada: ${data.files.length} arquivos (Total acumulado: ${allFiles.length})`);
    }

    nextPageToken = data.nextPageToken;
    if (nextPageToken) {
      console.log('[Drive API] Mais páginas disponíveis, buscando próxima página...');
    }
  } while (nextPageToken);

  console.log(`[Drive API] ✅ Busca concluída. Total de arquivos encontrados: ${allFiles.length}`);
  return allFiles;
}

/**
 * Converte arquivo do Google Drive para formato Transcript
 */
function mapDriveFileToTranscript(file: DriveFile): Transcript {
  const fileId = file.id;
  const title = file.name.replace(/\.pdf$/i, '').trim();
  const slug = generateSlug(title);
  
  // Extrair preview do título (primeiras palavras)
  const preview = `Transcrição corrigida pela Sanga: ${title}`;
  
  // Detectar categorias baseado no título
  const categories = detectCategories(title);

  return {
    id: fileId,
    code: fileId.substring(0, 11), // Primeiros 11 caracteres como código
    title: title,
    slug: slug,
    filename: file.name,
    url: file.webViewLink || `https://drive.google.com/file/d/${fileId}/view`,
    preview: preview,
    categories: categories,
    createdAt: file.createdTime || new Date().toISOString(),
    updatedAt: file.modifiedTime || new Date().toISOString(),
    driveFileId: fileId, // Campo adicional para integração com Drive
  };
}

export async function GET(request: NextRequest) {
  try {
    const apiKey = process.env.GOOGLE_DRIVE_API_KEY;
    
    console.log('[Drive API] Buscando arquivos da pasta:', DRIVE_FOLDER_ID);
    console.log('[Drive API] API Key configurada:', apiKey ? 'Sim' : 'Não (usando limite público)');

    // Buscar arquivos do Drive
    const driveFiles = await fetchDriveFiles(DRIVE_FOLDER_ID, apiKey);
    
    console.log(`[Drive API] ✅ ${driveFiles.length} arquivos encontrados`);

    // Converter para formato Transcript
    const transcripts: Transcript[] = driveFiles.map(mapDriveFileToTranscript);

    // Ordenar por título
    transcripts.sort((a, b) => a.title.localeCompare(b.title, 'pt-BR'));

    // Calcular categorias e contagens
    const categoryCounts: Record<string, number> = {};
    transcripts.forEach(transcript => {
      transcript.categories.forEach(cat => {
        categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
      });
    });

    // Retornar resposta no formato esperado
    return NextResponse.json({
      success: true,
      transcripts: transcripts,
      metadata: {
        total: transcripts.length,
        lastUpdated: new Date().toISOString(),
        version: '3.0.0',
        source: 'google-drive',
      },
      categories: categoryCounts,
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('[Drive API] Erro:', errorMessage);

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        transcripts: [],
        metadata: {
          total: 0,
          lastUpdated: new Date().toISOString(),
          version: '3.0.0',
          source: 'google-drive',
        },
        categories: {},
      },
      { status: 500 }
    );
  }
}

