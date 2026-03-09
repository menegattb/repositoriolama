const DRIVE_FOLDER_ID = '1SKEAfJ8oC0dOq0LGxUt6UtxQXjuvykwg';
const GOOGLE_DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3';

export interface DriveFile {
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

export interface TranscriptJsonData {
  videoId?: string;
  videoTitle?: string;
  videoUrl?: string;
  lang?: string;
  transcriptArray?: Array<{ text?: string; content?: string; offset: number; duration?: number }>;
  createdAt?: string;
  version?: string;
}

const FILES_CACHE_TTL_MS = 5 * 60 * 1000;
const LOOKUP_CACHE_TTL_MS = 10 * 60 * 1000;
const JSON_CONTENT_CACHE_TTL_MS = 10 * 60 * 1000;

let cachedDocxFiles: { files: DriveFile[]; timestamp: number } | null = null;
let cachedJsonFiles: { files: DriveFile[]; timestamp: number } | null = null;
const transcriptLookupCache = new Map<string, { timestamp: number; result: { docxFile: DriveFile | null; jsonData: TranscriptJsonData | null } }>();
const jsonContentCache = new Map<string, { timestamp: number; data: TranscriptJsonData | null }>();

function normalizeDriveMatch(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '');
}

async function fetchFilesByMimeType(mimeQuery: string, apiKey?: string): Promise<DriveFile[]> {
  const query = `'${DRIVE_FOLDER_ID}' in parents and ${mimeQuery} and trashed=false`;
  const fields = 'files(id,name,createdTime,modifiedTime,webViewLink,webContentLink),nextPageToken';
  let url = `${GOOGLE_DRIVE_API_BASE}/files?q=${encodeURIComponent(query)}&fields=${encodeURIComponent(fields)}&orderBy=name&pageSize=1000`;

  if (apiKey) {
    url += `&key=${apiKey}`;
  }

  const allFiles: DriveFile[] = [];
  let nextPageToken: string | undefined;

  do {
    const currentUrl = nextPageToken ? `${url}&pageToken=${nextPageToken}` : url;
    const response = await fetch(currentUrl, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erro ao buscar arquivos do Drive: ${response.status} - ${errorText}`);
    }

    const data: DriveApiResponse = await response.json();
    if (data.files && Array.isArray(data.files)) {
      allFiles.push(...data.files);
    }
    nextPageToken = data.nextPageToken;
  } while (nextPageToken);

  return allFiles;
}

export async function fetchDriveDocxFiles(apiKey?: string): Promise<DriveFile[]> {
  const now = Date.now();
  if (cachedDocxFiles && now - cachedDocxFiles.timestamp < FILES_CACHE_TTL_MS) {
    return cachedDocxFiles.files;
  }

  const files = await fetchFilesByMimeType(
    "(mimeType='application/vnd.openxmlformats-officedocument.wordprocessingml.document' or mimeType='application/msword')",
    apiKey
  );
  cachedDocxFiles = { files, timestamp: now };
  return files;
}

export async function fetchDriveJsonFiles(apiKey?: string): Promise<DriveFile[]> {
  const now = Date.now();
  if (cachedJsonFiles && now - cachedJsonFiles.timestamp < FILES_CACHE_TTL_MS) {
    return cachedJsonFiles.files;
  }

  const files = await fetchFilesByMimeType("mimeType='application/json'", apiKey);
  cachedJsonFiles = { files, timestamp: now };
  return files;
}

export async function fetchDriveJsonContent(fileId: string, apiKey?: string): Promise<TranscriptJsonData | null> {
  const now = Date.now();
  const cached = jsonContentCache.get(fileId);
  if (cached && now - cached.timestamp < JSON_CONTENT_CACHE_TTL_MS) {
    return cached.data;
  }

  try {
    let url = `${GOOGLE_DRIVE_API_BASE}/files/${fileId}?alt=media`;
    if (apiKey) {
      url += `&key=${apiKey}`;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });

    if (!response.ok) {
      jsonContentCache.set(fileId, { timestamp: now, data: null });
      return null;
    }

    const data = (await response.json()) as TranscriptJsonData;
    jsonContentCache.set(fileId, { timestamp: now, data });
    return data;
  } catch {
    jsonContentCache.set(fileId, { timestamp: now, data: null });
    return null;
  }
}

export async function findTranscriptByVideoId(
  videoId: string,
  apiKey?: string
): Promise<{ docxFile: DriveFile | null; jsonData: TranscriptJsonData | null }> {
  const now = Date.now();
  const cacheKey = videoId.toLowerCase().trim();
  const cached = transcriptLookupCache.get(cacheKey);
  if (cached && now - cached.timestamp < LOOKUP_CACHE_TTL_MS) {
    return cached.result;
  }

  const normalizedVideoId = normalizeDriveMatch(videoId);
  const docxFiles = await fetchDriveDocxFiles(apiKey);

  const matchingDocxFile = docxFiles.find((file) => {
    const fileName = normalizeDriveMatch(file.name);
    return fileName.includes(normalizedVideoId) || normalizedVideoId.includes(fileName.substring(0, 11));
  }) || null;

  if (!matchingDocxFile) {
    const result = { docxFile: null, jsonData: null };
    transcriptLookupCache.set(cacheKey, { timestamp: now, result });
    return result;
  }

  const jsonFiles = await fetchDriveJsonFiles(apiKey);
  const matchingJsonFile = jsonFiles.find((file) => {
    const fileName = normalizeDriveMatch(file.name);
    return fileName.includes(normalizedVideoId) || normalizedVideoId.includes(fileName.substring(0, 11));
  }) || null;

  const jsonData = matchingJsonFile ? await fetchDriveJsonContent(matchingJsonFile.id, apiKey) : null;
  const result = { docxFile: matchingDocxFile, jsonData };
  transcriptLookupCache.set(cacheKey, { timestamp: now, result });
  return result;
}

export function getDriveFolderIdForAutoTranscripts(): string {
  return DRIVE_FOLDER_ID;
}
