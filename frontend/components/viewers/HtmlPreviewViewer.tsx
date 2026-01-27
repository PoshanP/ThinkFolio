"use client";

import { useRef, useState, useEffect } from 'react';
import { MessageSquare, ZoomIn, ZoomOut, RotateCcw, FileText, Book, Code } from 'lucide-react';

interface HtmlPreviewViewerProps {
  previewHtml: string;
  fileType: 'docx' | 'rtf' | 'epub' | 'html';
  onChatClick?: () => void;
}

const FILE_TYPE_INFO = {
  docx: { label: 'Word Document', icon: FileText, color: 'text-blue-600' },
  rtf: { label: 'Rich Text', icon: FileText, color: 'text-gray-600' },
  epub: { label: 'EPUB Book', icon: Book, color: 'text-purple-600' },
  html: { label: 'HTML Document', icon: Code, color: 'text-orange-600' },
};

export function HtmlPreviewViewer({ previewHtml, fileType, onChatClick }: HtmlPreviewViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(100);
  const [showControls, setShowControls] = useState(true);

  const fileInfo = FILE_TYPE_INFO[fileType];
  const FileIcon = fileInfo.icon;

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 25, 200));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 25, 50));
  const handleResetZoom = () => setZoom(100);

  // Hide controls after inactivity
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    const handleActivity = () => {
      setShowControls(true);
      clearTimeout(timeout);
      timeout = setTimeout(() => setShowControls(false), 3000);
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('mousemove', handleActivity);
      container.addEventListener('scroll', handleActivity);
    }

    return () => {
      clearTimeout(timeout);
      if (container) {
        container.removeEventListener('mousemove', handleActivity);
        container.removeEventListener('scroll', handleActivity);
      }
    };
  }, []);

  return (
    <div className="relative h-full flex flex-col bg-gray-100 dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <FileIcon className={`h-5 w-5 ${fileInfo.color}`} />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {fileInfo.label}
          </span>
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {zoom}% zoom
        </div>
      </div>

      {/* Content */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto"
        style={{ backgroundColor: '#f5f5f5' }}
      >
        <div
          className="mx-auto bg-white dark:bg-gray-800 shadow-lg my-4"
          style={{
            transform: `scale(${zoom / 100})`,
            transformOrigin: 'top center',
            maxWidth: '900px',
            minHeight: '100%',
          }}
        >
          {previewHtml ? (
            <div
              className="prose prose-sm dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: previewHtml }}
            />
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-400">
              No preview available
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div
        className={`absolute bottom-4 left-1/2 transform -translate-x-1/2 transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex items-center gap-1 bg-white dark:bg-gray-800 rounded-full shadow-lg px-2 py-1 border border-gray-200 dark:border-gray-700">
          {/* Zoom controls */}
          <button
            onClick={handleZoomOut}
            disabled={zoom <= 50}
            className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
            title="Zoom out"
          >
            <ZoomOut className="h-4 w-4" />
          </button>

          <button
            onClick={handleResetZoom}
            className="px-2 py-1 text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            title="Reset zoom"
          >
            {zoom}%
          </button>

          <button
            onClick={handleZoomIn}
            disabled={zoom >= 200}
            className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
            title="Zoom in"
          >
            <ZoomIn className="h-4 w-4" />
          </button>

          <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1" />

          <button
            onClick={handleResetZoom}
            className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
            title="Reset view"
          >
            <RotateCcw className="h-4 w-4" />
          </button>

          {onChatClick && (
            <>
              <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1" />
              <button
                onClick={onChatClick}
                className="p-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-full"
                title="Open chat"
              >
                <MessageSquare className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default HtmlPreviewViewer;
