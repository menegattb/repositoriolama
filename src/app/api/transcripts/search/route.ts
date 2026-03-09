import { NextRequest, NextResponse } from 'next/server';
import {
  fetchDriveJsonContent,
  fetchDriveJsonFiles,
} from '@/lib/driveAutoTranscripts';
import { getStandaloneVideos, getYouTubePlaylists } from '@/data/youtubeData';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface SearchHit {
  videoId?: string;
  playlistId: string | null;
  videoTitle: string;
  offset: number;
  snippetBefore: string;
  snippetMatch: string;
  snippetAfter: string;
  score: number;
  sourceFileId?: string;
  targetPath?: string;
  resultType?: 'title' | 'transcript';
}

const SEARCH_CACHE_TTL_MS = 60 * 1000;
const SEARCH_ALGO_VERSION = 'v3';
const searchCache = new Map<string, { timestamp: number; result: SearchHit[] }>();

function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function countExactWordOccurrences(normalizedText: string, normalizedTerm: string): number {
  if (!normalizedTerm) return 0;
  const regex = new RegExp(`(^|[^a-z0-9])${escapeRegex(normalizedTerm)}(?=$|[^a-z0-9])`, 'g');
  const matches = normalizedText.match(regex);
  return matches ? matches.length : 0;
}

function calculateRelevanceScore(normalizedText: string, normalizedTerms: string[], normalizedQuery: string): number {
  let score = 0;
  let exactTermsMatched = 0;

  for (const term of normalizedTerms) {
    const partialMatches = Math.max(0, normalizedText.split(term).length - 1);
    const exactMatches = countExactWordOccurrences(normalizedText, term);

    score += partialMatches;
    score += exactMatches * 50;

    if (exactMatches > 0) {
      exactTermsMatched += 1;
    }
  }

  if (exactTermsMatched === normalizedTerms.length) {
    score += 500;
  }

  if (normalizedQuery && normalizedText.includes(normalizedQuery)) {
    score += 120;
  }

  const exactQueryRegex = new RegExp(`(^|[^a-z0-9])${escapeRegex(normalizedQuery)}(?=$|[^a-z0-9])`);
  if (normalizedQuery && exactQueryRegex.test(normalizedText)) {
    score += 300;
  }

  return score;
}

function extractPlaylistIdFromUrl(url?: string): string | null {
  if (!url) return null;
  const match = url.match(/[?&]list=([^&\n?#]+)/);
  return match?.[1] || null;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function createSnippet(text: string, terms: string[]): { before: string; match: string; after: string; score: number } {
  const normalizedText = normalizeText(text);
  const firstTerm = terms[0] || '';
  const firstIndex = normalizedText.indexOf(firstTerm);
  const centerIndex = firstIndex >= 0 ? firstIndex : 0;

  const windowStart = clamp(centerIndex - 70, 0, text.length);
  const windowEnd = clamp(centerIndex + 140, 0, text.length);
  const windowText = text.slice(windowStart, windowEnd);
  const normalizedWindow = normalizeText(windowText);

  let matchStart = Number.MAX_SAFE_INTEGER;
  let matchEnd = 0;
  let score = 0;

  for (const term of terms) {
    const idx = normalizedWindow.indexOf(term);
    if (idx >= 0) {
      matchStart = Math.min(matchStart, idx);
      matchEnd = Math.max(matchEnd, idx + term.length);
      score += 10;
      // ganho adicional para múltiplas ocorrências do mesmo termo
      score += Math.max(0, normalizedWindow.split(term).length - 2);
    }
  }

  if (matchStart === Number.MAX_SAFE_INTEGER) {
    const pivot = Math.min(60, windowText.length);
    return {
      before: windowText.slice(0, Math.max(0, pivot - 25)).trim(),
      match: windowText.slice(Math.max(0, pivot - 25), Math.min(windowText.length, pivot + 25)).trim(),
      after: windowText.slice(Math.min(windowText.length, pivot + 25)).trim(),
      score: 0,
    };
  }

  const before = windowText.slice(0, matchStart).trim();
  const match = windowText.slice(matchStart, Math.min(windowText.length, matchEnd)).trim();
  const after = windowText.slice(Math.min(windowText.length, matchEnd)).trim();

  return { before, match, after, score };
}

function mixTitleAndTranscriptResults(hits: SearchHit[]): SearchHit[] {
  const titleHits = hits.filter((hit) => hit.resultType === 'title').sort((a, b) => b.score - a.score);
  const transcriptHits = hits.filter((hit) => hit.resultType !== 'title').sort((a, b) => b.score - a.score);

  // Mostrar alguns títulos no topo, mas manter transcrição visível cedo.
  const mixed: SearchHit[] = [];
  const initialTitleCount = Math.min(3, titleHits.length);
  for (let i = 0; i < initialTitleCount; i++) {
    mixed.push(titleHits[i]);
  }

  let titleIndex = initialTitleCount;
  let transcriptIndex = 0;

  while (transcriptIndex < transcriptHits.length || titleIndex < titleHits.length) {
    // Prioridade para conteúdo de transcrição sem esconder títulos.
    if (transcriptIndex < transcriptHits.length) mixed.push(transcriptHits[transcriptIndex++]);
    if (transcriptIndex < transcriptHits.length) mixed.push(transcriptHits[transcriptIndex++]);
    if (titleIndex < titleHits.length) mixed.push(titleHits[titleIndex++]);
  }

  return mixed;
}

export async function GET(request: NextRequest) {
  try {
    const apiKey = process.env.GOOGLE_DRIVE_API_KEY;
    const q = (request.nextUrl.searchParams.get('q') || '').trim();
    const limit = clamp(Number.parseInt(request.nextUrl.searchParams.get('limit') || '20', 10), 1, 100);
    const cursor = Math.max(0, Number.parseInt(request.nextUrl.searchParams.get('cursor') || '0', 10));
    const batchFiles = clamp(Number.parseInt(request.nextUrl.searchParams.get('batchFiles') || '5', 10), 1, 50);

    if (!q) {
      return NextResponse.json({
        success: true,
        query: '',
        cursor: 0,
        nextCursor: null,
        batchFiles,
        scannedFiles: 0,
        totalFiles: 0,
        done: true,
        total: 0,
        results: [],
      });
    }

    const normalizedQuery = normalizeText(q);
    const terms = normalizedQuery.split(/\s+/).filter(Boolean);
    if (terms.length === 0) {
      return NextResponse.json({
        success: true,
        query: q,
        cursor: 0,
        nextCursor: null,
        batchFiles,
        scannedFiles: 0,
        totalFiles: 0,
        done: true,
        total: 0,
        results: [],
      });
    }

    const cacheKey = `${SEARCH_ALGO_VERSION}:${terms.join('|')}`;
    const now = Date.now();
    const cached = searchCache.get(cacheKey);
    let allHits: SearchHit[];
    const jsonFiles = await fetchDriveJsonFiles(apiKey);
    const totalFiles = jsonFiles.length;
    const startCursor = clamp(cursor, 0, totalFiles);
    const endCursor = clamp(startCursor + batchFiles, 0, totalFiles);
    const filesBatch = jsonFiles.slice(startCursor, endCursor);
    const done = endCursor >= totalFiles;
    const nextCursor = done ? null : endCursor;

    if (cached && now - cached.timestamp < SEARCH_CACHE_TTL_MS) {
      // Em cache, filtrar somente pelos arquivos já varridos até endCursor
      allHits = cached.result.filter((hit) => {
        // Cache antigo não tinha sourceFileId; manter compatibilidade retornando tudo
        const sourceFileId = hit.sourceFileId;
        if (!sourceFileId) return true;
        return filesBatch.some((f) => f.id === sourceFileId);
      });
    } else {
      const hitsPerFile = await Promise.all(
        filesBatch.map(async (file): Promise<SearchHit[]> => {
          const jsonData = await fetchDriveJsonContent(file.id, apiKey);
          if (!jsonData) return [];

          const playlistId = extractPlaylistIdFromUrl(jsonData.videoUrl);
          const videoId = jsonData.videoId || '';
          const videoTitle = jsonData.videoTitle || file.name;
          if (!videoId) return [];
          const transcriptArray = jsonData?.transcriptArray || [];
          const normalizedTitle = normalizeText(videoTitle);
          const titleMatchesAllTerms = terms.every((term) => normalizedTitle.includes(term));
          const titleRelevance = calculateRelevanceScore(normalizedTitle, terms, normalizedQuery);

          const fileHits: SearchHit[] = [];
          if (titleMatchesAllTerms) {
            const titleSnippet = createSnippet(videoTitle, terms);
            fileHits.push({
              videoId,
              playlistId,
              videoTitle,
              offset: 0,
              snippetBefore: titleSnippet.before,
              snippetMatch: titleSnippet.match,
              snippetAfter: titleSnippet.after,
              // Prioridade alta, mas sem esconder conteúdo da transcrição.
              score: 1200 + titleRelevance + titleSnippet.score,
              sourceFileId: file.id,
              targetPath: playlistId ? `/playlist/${playlistId}` : `/video/${videoId}`,
              resultType: 'title',
            });
          }

          if (transcriptArray.length === 0) {
            return fileHits;
          }
          for (const segment of transcriptArray) {
            const rawText = (segment.text || segment.content || '').trim();
            if (!rawText) continue;

            const normalizedSegment = normalizeText(rawText);
            const matchesAllTerms = terms.every((term) => normalizedSegment.includes(term));
            if (!matchesAllTerms) continue;

            const snippet = createSnippet(rawText, terms);
            const relevanceScore = calculateRelevanceScore(normalizedSegment, terms, normalizedQuery);
            fileHits.push({
              videoId,
              playlistId,
              videoTitle,
              offset: segment.offset || 0,
              snippetBefore: snippet.before,
              snippetMatch: snippet.match,
              snippetAfter: snippet.after,
              score: relevanceScore + snippet.score + (titleRelevance * 0.25) + Math.max(0, 100000 - (segment.offset || 0)) / 100000,
              sourceFileId: file.id,
              targetPath: playlistId ? `/playlist/${playlistId}` : `/video/${videoId}`,
              resultType: 'transcript',
            });
          }
          return fileHits;
        })
      );

      const hits = hitsPerFile.flat();

      // Busca adicional em títulos globais do repositório (rápida e com alta prioridade)
      // Útil quando o termo ainda não existe no corpo das transcrições, mas existe no título.
      if (startCursor === 0) {
        const [playlists, standaloneVideos] = await Promise.all([
          getYouTubePlaylists(true),
          getStandaloneVideos(),
        ]);

        for (const playlist of playlists) {
          const normalizedTitle = normalizeText(playlist.title || '');
          const titleMatchesAllTerms = terms.every((term) => normalizedTitle.includes(term));
          if (!titleMatchesAllTerms) continue;

          const titleScore = calculateRelevanceScore(normalizedTitle, terms, normalizedQuery);
          hits.push({
            playlistId: playlist.id,
            videoTitle: playlist.title,
            offset: 0,
            snippetBefore: '',
            snippetMatch: playlist.title,
            snippetAfter: '',
            score: 1600 + titleScore,
            targetPath: `/playlist/${playlist.id}`,
            resultType: 'title',
          });
        }

        for (const video of standaloneVideos) {
          const normalizedTitle = normalizeText(video.title || '');
          const titleMatchesAllTerms = terms.every((term) => normalizedTitle.includes(term));
          if (!titleMatchesAllTerms) continue;

          const titleScore = calculateRelevanceScore(normalizedTitle, terms, normalizedQuery);
          hits.push({
            videoId: video.id,
            playlistId: null,
            videoTitle: video.title,
            offset: 0,
            snippetBefore: '',
            snippetMatch: video.title,
            snippetAfter: '',
            score: 1500 + titleScore,
            targetPath: `/video/${video.id}`,
            resultType: 'title',
          });
        }
      }

      hits.sort((a, b) => b.score - a.score);
      allHits = mixTitleAndTranscriptResults(hits);
      // Só cachear conjunto completo quando terminar varredura total
      if (done) {
        if (allHits.length > 0) {
          searchCache.set(cacheKey, { timestamp: now, result: allHits });
        } else {
          searchCache.delete(cacheKey);
        }
      }
    }

    const results = allHits.slice(0, limit);

    return NextResponse.json({
      success: true,
      query: q,
      cursor: startCursor,
      nextCursor,
      batchFiles,
      scannedFiles: endCursor,
      totalFiles,
      done,
      limit,
      total: allHits.length,
      hasMore: !done,
      results,
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    return NextResponse.json({
      success: false,
      error: message,
      results: [],
      total: 0,
    }, { status: 500 });
  }
}
