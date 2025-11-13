/**
 * Utilitários para trabalhar com Google Drive
 */

/**
 * Converte File ID do Google Drive para URL de visualização (preview)
 * @param fileId - ID do arquivo no Google Drive
 * @returns URL para visualização inline do arquivo
 */
export function getDrivePreviewUrl(fileId: string): string {
  return `https://drive.google.com/file/d/${fileId}/preview`;
}

/**
 * Converte File ID do Google Drive para URL de download direto
 * @param fileId - ID do arquivo no Google Drive
 * @returns URL para download direto do arquivo
 */
export function getDriveDownloadUrl(fileId: string): string {
  return `https://drive.google.com/uc?export=download&id=${fileId}`;
}

/**
 * Converte File ID do Google Drive para URL de visualização no navegador
 * @param fileId - ID do arquivo no Google Drive
 * @returns URL para abrir no Google Drive
 */
export function getDriveViewUrl(fileId: string): string {
  return `https://drive.google.com/file/d/${fileId}/view`;
}

/**
 * Extrai File ID de uma URL do Google Drive
 * Suporta vários formatos:
 * - https://drive.google.com/file/d/FILE_ID/view
 * - https://drive.google.com/file/d/FILE_ID/preview
 * - https://drive.google.com/open?id=FILE_ID
 * - https://drive.google.com/uc?id=FILE_ID
 * @param url - URL do Google Drive
 * @returns File ID ou null se não encontrar
 */
export function extractFileIdFromUrl(url: string): string | null {
  if (!url) return null;

  // Formato: /file/d/FILE_ID/view ou /file/d/FILE_ID/preview
  const fileIdMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileIdMatch && fileIdMatch[1]) {
    return fileIdMatch[1];
  }

  // Formato: ?id=FILE_ID
  const idMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idMatch && idMatch[1]) {
    return idMatch[1];
  }

  // Formato: /open?id=FILE_ID
  const openMatch = url.match(/\/open\?id=([a-zA-Z0-9_-]+)/);
  if (openMatch && openMatch[1]) {
    return openMatch[1];
  }

  return null;
}

/**
 * Gera slug a partir do título do arquivo
 * Remove caracteres especiais e converte para formato URL-friendly
 * @param title - Título do arquivo
 * @returns Slug formatado
 */
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^a-z0-9]+/g, '-') // Substitui não-alfanuméricos por hífen
    .replace(/^-+|-+$/g, ''); // Remove hífens do início/fim
}

