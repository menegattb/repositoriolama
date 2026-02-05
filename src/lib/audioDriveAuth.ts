/**
 * Autenticação para Google Drive de Áudios
 * Usa OAuth 2.0 para acessar arquivos de outra conta Google (acaoparamita@gmail.com)
 * 
 * Configuração necessária no .env.local:
 * - AUDIO_DRIVE_CLIENT_ID: Client ID do OAuth
 * - AUDIO_DRIVE_CLIENT_SECRET: Client Secret do OAuth
 * - AUDIO_DRIVE_REFRESH_TOKEN: Refresh Token (obter via /api/auth/audio-drive)
 * - AUDIO_DRIVE_ROOT_FOLDER_ID: ID da pasta raiz "repositorio"
 * - AUDIO_DRIVE_YOUTUBE_FOLDER_ID: ID da pasta "audios-youtube"
 * - AUDIO_DRIVE_SANGA_FOLDER_ID: ID da pasta "audios-sanga"
 */

import { google, drive_v3 } from 'googleapis';

// Cache do cliente autenticado
let cachedDriveClient: drive_v3.Drive | null = null;
let cachedOAuth2Client: InstanceType<typeof google.auth.OAuth2> | null = null;

/**
 * Verifica se as credenciais OAuth estão configuradas
 */
export function isAudioDriveConfigured(): boolean {
  return !!(
    process.env.AUDIO_DRIVE_CLIENT_ID &&
    process.env.AUDIO_DRIVE_CLIENT_SECRET &&
    process.env.AUDIO_DRIVE_REFRESH_TOKEN
  );
}

/**
 * Retorna o cliente OAuth2 configurado
 */
export function getAudioOAuth2Client(): InstanceType<typeof google.auth.OAuth2> {
  if (cachedOAuth2Client) {
    return cachedOAuth2Client;
  }

  const clientId = process.env.AUDIO_DRIVE_CLIENT_ID;
  const clientSecret = process.env.AUDIO_DRIVE_CLIENT_SECRET;
  const refreshToken = process.env.AUDIO_DRIVE_REFRESH_TOKEN;

  if (!clientId || !clientSecret) {
    throw new Error(
      'Credenciais OAuth do Audio Drive não configuradas. ' +
      'Configure AUDIO_DRIVE_CLIENT_ID e AUDIO_DRIVE_CLIENT_SECRET no .env.local'
    );
  }

  cachedOAuth2Client = new google.auth.OAuth2(clientId, clientSecret);

  if (refreshToken) {
    cachedOAuth2Client.setCredentials({
      refresh_token: refreshToken,
    });
  }

  return cachedOAuth2Client;
}

/**
 * Retorna cliente Google Drive autenticado com OAuth 2.0
 * Usa cache para evitar criar múltiplas instâncias
 */
export function getAudioDriveClient(): drive_v3.Drive {
  if (cachedDriveClient) {
    return cachedDriveClient;
  }

  const oauth2Client = getAudioOAuth2Client();

  if (!process.env.AUDIO_DRIVE_REFRESH_TOKEN) {
    throw new Error(
      'Refresh Token do Audio Drive não configurado. ' +
      'Acesse /api/auth/audio-drive para obter o token.'
    );
  }

  cachedDriveClient = google.drive({ version: 'v3', auth: oauth2Client });
  return cachedDriveClient;
}

/**
 * Limpa o cache dos clientes (útil para testes ou reautenticação)
 */
export function clearAudioDriveCache(): void {
  cachedDriveClient = null;
  cachedOAuth2Client = null;
}

/**
 * IDs das pastas de áudio no Drive
 */
export function getAudioFolderIds() {
  return {
    root: process.env.AUDIO_DRIVE_ROOT_FOLDER_ID || '',
    youtube: process.env.AUDIO_DRIVE_YOUTUBE_FOLDER_ID || '',
    sanga: process.env.AUDIO_DRIVE_SANGA_FOLDER_ID || '',
  };
}

/**
 * Interface para arquivo de áudio do Drive
 */
export interface AudioFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  createdTime?: string;
  modifiedTime?: string;
  webContentLink?: string;
  streamUrl: string;
}

/**
 * Interface para pasta do Drive
 */
export interface AudioFolder {
  id: string;
  name: string;
  files: AudioFile[];
  subfolders: { id: string; name: string }[];
}

/**
 * Lista arquivos de áudio em uma pasta específica
 */
export async function listAudioFiles(folderId: string): Promise<AudioFile[]> {
  const drive = getAudioDriveClient();
  
  // Query para buscar arquivos de áudio na pasta
  const query = `'${folderId}' in parents and trashed=false and (mimeType contains 'audio/' or mimeType='application/octet-stream')`;
  
  const response = await drive.files.list({
    q: query,
    fields: 'files(id, name, mimeType, size, createdTime, modifiedTime, webContentLink)',
    orderBy: 'name',
    pageSize: 1000,
  });

  const files = response.data.files || [];
  
  return files.map(file => ({
    id: file.id || '',
    name: file.name || '',
    mimeType: file.mimeType || 'audio/mpeg',
    size: file.size || undefined,
    createdTime: file.createdTime || undefined,
    modifiedTime: file.modifiedTime || undefined,
    webContentLink: file.webContentLink || undefined,
    streamUrl: `/api/drive/audio/stream/${file.id}`,
  }));
}

/**
 * Lista subpastas de uma pasta
 */
export async function listSubfolders(folderId: string): Promise<{ id: string; name: string }[]> {
  const drive = getAudioDriveClient();
  
  const query = `'${folderId}' in parents and trashed=false and mimeType='application/vnd.google-apps.folder'`;
  
  const response = await drive.files.list({
    q: query,
    fields: 'files(id, name)',
    orderBy: 'name',
    pageSize: 1000,
  });

  return (response.data.files || []).map(folder => ({
    id: folder.id || '',
    name: folder.name || '',
  }));
}

/**
 * Busca um arquivo JSON do Drive e retorna seu conteúdo parseado
 */
export async function fetchJsonFromDrive<T>(fileId: string): Promise<T> {
  const drive = getAudioDriveClient();
  
  const response = await drive.files.get({
    fileId,
    alt: 'media',
  }, {
    responseType: 'text',
  });

  return JSON.parse(response.data as string) as T;
}

/**
 * Busca um arquivo pelo nome em uma pasta
 */
export async function findFileByName(folderId: string, fileName: string): Promise<string | null> {
  const drive = getAudioDriveClient();
  
  const query = `'${folderId}' in parents and name='${fileName}' and trashed=false`;
  
  const response = await drive.files.list({
    q: query,
    fields: 'files(id)',
    pageSize: 1,
  });

  const files = response.data.files || [];
  return files.length > 0 ? files[0].id || null : null;
}

/**
 * Faz download de um arquivo como stream
 */
export async function getFileStream(fileId: string): Promise<{
  stream: NodeJS.ReadableStream;
  mimeType: string;
  size: number;
  name: string;
}> {
  const drive = getAudioDriveClient();
  
  // Primeiro, obter metadados do arquivo
  const metadata = await drive.files.get({
    fileId,
    fields: 'name, mimeType, size',
  });

  // Depois, obter o conteúdo como stream
  const response = await drive.files.get({
    fileId,
    alt: 'media',
  }, {
    responseType: 'stream',
  });

  return {
    stream: response.data as NodeJS.ReadableStream,
    mimeType: metadata.data.mimeType || 'audio/mpeg',
    size: parseInt(metadata.data.size || '0', 10),
    name: metadata.data.name || 'audio',
  };
}

/**
 * Obter metadados de um arquivo
 */
export async function getFileMetadata(fileId: string): Promise<{
  id: string;
  name: string;
  mimeType: string;
  size: number;
}> {
  const drive = getAudioDriveClient();
  
  const response = await drive.files.get({
    fileId,
    fields: 'id, name, mimeType, size',
  });

  return {
    id: response.data.id || fileId,
    name: response.data.name || 'audio',
    mimeType: response.data.mimeType || 'audio/mpeg',
    size: parseInt(response.data.size || '0', 10),
  };
}

/**
 * Faz download parcial de um arquivo (para suporte a Range requests)
 */
export async function getFilePartial(fileId: string, start: number, end: number): Promise<{
  buffer: Buffer;
  mimeType: string;
  totalSize: number;
  name: string;
}> {
  const drive = getAudioDriveClient();
  
  // Obter metadados
  const metadata = await drive.files.get({
    fileId,
    fields: 'name, mimeType, size',
  });

  const totalSize = parseInt(metadata.data.size || '0', 10);
  
  // Ajustar end se necessário
  const actualEnd = Math.min(end, totalSize - 1);

  // Fazer download parcial
  const response = await drive.files.get({
    fileId,
    alt: 'media',
  }, {
    responseType: 'arraybuffer',
    headers: {
      Range: `bytes=${start}-${actualEnd}`,
    },
  });

  return {
    buffer: Buffer.from(response.data as ArrayBuffer),
    mimeType: metadata.data.mimeType || 'audio/mpeg',
    totalSize,
    name: metadata.data.name || 'audio',
  };
}
