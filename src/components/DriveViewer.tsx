'use client';

import React, { useState } from 'react';
import { X, Download, ExternalLink, Loader2 } from 'lucide-react';
import { getDrivePreviewUrl, getDriveDownloadUrl, getDriveViewUrl } from '@/lib/driveUtils';

interface DriveViewerProps {
  fileId: string;
  title: string;
  onClose?: () => void;
  showCloseButton?: boolean;
}

export default function DriveViewer({ 
  fileId, 
  title, 
  onClose,
  showCloseButton = false 
}: DriveViewerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const previewUrl = getDrivePreviewUrl(fileId);
  const downloadUrl = getDriveDownloadUrl(fileId);
  const viewUrl = getDriveViewUrl(fileId);

  const handleLoad = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  return (
    <div className="relative w-full h-full flex flex-col bg-white rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-gray-50">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 truncate">
            {title}
          </h3>
        </div>
        <div className="flex items-center gap-2 ml-4">
          {/* Botão Download */}
          <a
            href={downloadUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            title="Baixar PDF"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Download</span>
          </a>

          {/* Botão Abrir no Drive */}
          <a
            href={viewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg transition-colors"
            title="Abrir no Google Drive"
          >
            <ExternalLink className="w-4 h-4" />
            <span className="hidden sm:inline">Abrir</span>
          </a>

          {/* Botão Fechar */}
          {showCloseButton && onClose && (
            <button
              onClick={onClose}
              className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
              title="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 relative bg-gray-100">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin text-red-600 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Carregando documento...</p>
            </div>
          </div>
        )}

        {hasError ? (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <div className="text-center p-6">
              <p className="text-gray-600 mb-4">
                Não foi possível carregar o documento inline.
              </p>
              <div className="flex gap-2 justify-center">
                <a
                  href={viewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  Abrir no Google Drive
                </a>
                <a
                  href={downloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Baixar PDF
                </a>
              </div>
            </div>
          </div>
        ) : (
          <iframe
            src={previewUrl}
            className="w-full h-full border-0"
            title={title}
            onLoad={handleLoad}
            onError={handleError}
            allow="fullscreen"
            style={{ minHeight: '600px' }}
          />
        )}
      </div>
    </div>
  );
}

