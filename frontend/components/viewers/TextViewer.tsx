"use client";

import { useRef, useState, useEffect } from 'react';
import { MessageSquare, ZoomIn, ZoomOut, RotateCcw, FileCode } from 'lucide-react';

interface TextViewerProps {
  content: string;
  isHtml?: boolean;
  onChatClick?: () => void;
}

export function TextViewer({ content, isHtml = false, onChatClick }: TextViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [fontSize, setFontSize] = useState(14);
  const [showControls, setShowControls] = useState(true);
  const [lineCount, setLineCount] = useState(0);

  // Count lines
  useEffect(() => {
    if (!isHtml && content) {
      setLineCount(content.split('\n').length);
    }
  }, [content, isHtml]);

  const handleZoomIn = () => setFontSize(prev => Math.min(prev + 2, 24));
  const handleZoomOut = () => setFontSize(prev => Math.max(prev - 2, 10));
  const handleResetZoom = () => setFontSize(14);

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
          <FileCode className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Text File
          </span>
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {lineCount > 0 && `${lineCount.toLocaleString()} lines • `}
          {fontSize}px
        </div>
      </div>

      {/* Content */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto p-4"
        style={{ backgroundColor: '#1e1e1e' }}
      >
        {isHtml ? (
          <div
            className="text-gray-200"
            style={{ fontSize: `${fontSize}px` }}
            dangerouslySetInnerHTML={{ __html: content }}
          />
        ) : (
          <pre
            className="text-gray-200 whitespace-pre-wrap break-words font-mono"
            style={{
              fontSize: `${fontSize}px`,
              lineHeight: 1.6,
              tabSize: 4,
            }}
          >
            {content || 'Empty file'}
          </pre>
        )}
      </div>

      {/* Controls */}
      <div
        className={`absolute bottom-4 left-1/2 transform -translate-x-1/2 transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex items-center gap-1 bg-white dark:bg-gray-800 rounded-full shadow-lg px-2 py-1 border border-gray-200 dark:border-gray-700">
          {/* Font size controls */}
          <button
            onClick={handleZoomOut}
            disabled={fontSize <= 10}
            className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
            title="Decrease font size"
          >
            <ZoomOut className="h-4 w-4" />
          </button>

          <button
            onClick={handleResetZoom}
            className="px-2 py-1 text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            title="Reset font size"
          >
            {fontSize}px
          </button>

          <button
            onClick={handleZoomIn}
            disabled={fontSize >= 24}
            className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
            title="Increase font size"
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

export default TextViewer;
