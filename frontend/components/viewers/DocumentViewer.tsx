"use client";

import { useState, useEffect } from 'react';
import { PdfViewer } from '../PdfViewer';
import { HtmlPreviewViewer } from './HtmlPreviewViewer';
import { TextViewer } from './TextViewer';
import { CsvViewer } from './CsvViewer';
import { PptxViewer } from './PptxViewer';
import { Loader2, AlertCircle } from 'lucide-react';

export type FileType = 'pdf' | 'docx' | 'txt' | 'rtf' | 'pptx' | 'csv' | 'epub' | 'html';

interface DocumentViewerProps {
  fileType: FileType;
  fileUrl?: string | null;
  previewHtml?: string | null;
  previewImageUrl?: string | null;
  onChatClick?: () => void;
  currentPage?: number;
  onPageChange?: (page: number) => void;
  totalPages?: number;
  // Pass-through props for PdfViewer
  isLoading?: boolean;
  processingStatus?: 'pending' | 'processing' | 'completed' | 'failed' | null;
  processingError?: string | null;
  messageCount?: number;
}

export function DocumentViewer({
  fileType,
  fileUrl,
  previewHtml,
  previewImageUrl,
  onChatClick,
  currentPage = 1,
  onPageChange,
  totalPages = 1,
  isLoading,
  processingStatus,
  processingError,
  messageCount,
}: DocumentViewerProps) {
  // Debug logging
  console.log('DocumentViewer props:', { fileType, previewHtml: previewHtml?.slice(0, 100), fileUrl: fileUrl?.slice(0, 50) });

  const [contentLoading, setContentLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rawContent, setRawContent] = useState<string | null>(null);

  // For text-based formats, fetch the raw content if no previewHtml
  useEffect(() => {
    if (!previewHtml && fileUrl && (fileType === 'txt' || fileType === 'csv')) {
      setContentLoading(true);
      fetch(fileUrl)
        .then(res => {
          if (!res.ok) throw new Error('Failed to load file');
          return res.text();
        })
        .then(text => {
          setRawContent(text);
          setContentLoading(false);
        })
        .catch(err => {
          setError(err.message);
          setContentLoading(false);
        });
    } else {
      setContentLoading(false);
    }
  }, [fileUrl, fileType, previewHtml]);

  // PDF uses the existing PdfViewer
  if (fileType === 'pdf') {
    return (
      <PdfViewer
        pdfUrl={fileUrl || null}
        isLoading={isLoading}
        processingStatus={processingStatus}
        processingError={processingError}
        onChatOpen={onChatClick}
        messageCount={messageCount}
      />
    );
  }

  // Handle external loading state (from parent)
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <Loader2 className="h-8 w-8 text-indigo-600 animate-spin mx-auto mb-2" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading document...</p>
        </div>
      </div>
    );
  }

  // Handle internal content loading state
  if (contentLoading) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <Loader2 className="h-8 w-8 text-indigo-600 animate-spin mx-auto mb-2" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading document...</p>
        </div>
      </div>
    );
  }

  // Handle error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
          <p className="text-sm text-red-500">{error}</p>
        </div>
      </div>
    );
  }

  // Plain text files
  if (fileType === 'txt') {
    return (
      <TextViewer
        content={rawContent || previewHtml || ''}
        isHtml={!!previewHtml}
        onChatClick={onChatClick}
      />
    );
  }

  // CSV files
  if (fileType === 'csv') {
    return (
      <CsvViewer
        content={rawContent || ''}
        previewHtml={previewHtml || undefined}
        onChatClick={onChatClick}
      />
    );
  }

  // PPTX files
  if (fileType === 'pptx') {
    return (
      <PptxViewer
        previewHtml={previewHtml || undefined}
        previewImageUrl={previewImageUrl || undefined}
        currentSlide={currentPage}
        totalSlides={totalPages}
        onSlideChange={onPageChange}
        onChatClick={onChatClick}
      />
    );
  }

  // DOCX, RTF, EPUB, HTML - use HTML preview
  if (fileType === 'docx' || fileType === 'rtf' || fileType === 'epub' || fileType === 'html') {
    return (
      <HtmlPreviewViewer
        previewHtml={previewHtml || ''}
        fileType={fileType}
        onChatClick={onChatClick}
      />
    );
  }

  // Fallback for unknown types
  return (
    <div className="flex items-center justify-center h-full bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <AlertCircle className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Preview not available for this file type
        </p>
      </div>
    </div>
  );
}

export default DocumentViewer;
