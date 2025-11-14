'use client';

import React, { useState } from 'react';
import { ExternalLink, Loader2 } from 'lucide-react';
import { getDrivePreviewUrl, getDriveViewUrl } from '@/lib/driveUtils';

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
      {/* Content */}
      <div className="flex-1 relative bg-white">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Carregando documento...</p>
            </div>
          </div>
        )}

        {hasError ? (
          <div className="absolute inset-0 flex items-center justify-center bg-white">
            <div className="text-center p-6">
              <p className="text-gray-600 mb-4">
                Não foi possível carregar o documento inline.
              </p>
              <a
                href={viewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                Abrir no Google Drive
              </a>
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

