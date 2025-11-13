export interface Transcript {
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
  driveFileId?: string; // ID do arquivo no Google Drive para visualização inline
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
