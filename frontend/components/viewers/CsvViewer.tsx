"use client";

import { useRef, useState, useEffect, useMemo } from 'react';
import { MessageSquare, ZoomIn, ZoomOut, RotateCcw, Table } from 'lucide-react';

interface CsvViewerProps {
  content: string;
  previewHtml?: string;
  onChatClick?: () => void;
}

interface CsvData {
  headers: string[];
  rows: string[][];
}

function parseCsv(content: string): CsvData {
  const lines = content.trim().split('\n');
  if (lines.length === 0) return { headers: [], rows: [] };

  // Simple CSV parsing (handles basic cases)
  const parseRow = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const headers = parseRow(lines[0]);
  const rows = lines.slice(1).map(parseRow);

  return { headers, rows };
}

export function CsvViewer({ content, previewHtml, onChatClick }: CsvViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [fontSize, setFontSize] = useState(13);
  const [showControls, setShowControls] = useState(true);

  const csvData = useMemo(() => parseCsv(content), [content]);

  const handleZoomIn = () => setFontSize(prev => Math.min(prev + 1, 18));
  const handleZoomOut = () => setFontSize(prev => Math.max(prev - 1, 10));
  const handleResetZoom = () => setFontSize(13);

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

  // Use previewHtml if available
  if (previewHtml) {
    return (
      <div className="relative h-full flex flex-col bg-gray-100 dark:bg-gray-900">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <Table className="h-5 w-5 text-green-600 dark:text-green-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              CSV Spreadsheet
            </span>
          </div>
        </div>

        {/* Content */}
        <div
          ref={containerRef}
          className="flex-1 overflow-auto bg-white dark:bg-gray-800"
        >
          <div
            dangerouslySetInnerHTML={{ __html: previewHtml }}
            style={{ fontSize: `${fontSize}px` }}
          />
        </div>

        {/* Controls */}
        <div
          className={`absolute bottom-4 left-1/2 transform -translate-x-1/2 transition-opacity duration-300 ${
            showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          <div className="flex items-center gap-1 bg-white dark:bg-gray-800 rounded-full shadow-lg px-2 py-1 border border-gray-200 dark:border-gray-700">
            {onChatClick && (
              <button
                onClick={onChatClick}
                className="p-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-full"
                title="Open chat"
              >
                <MessageSquare className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full flex flex-col bg-gray-100 dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <Table className="h-5 w-5 text-green-600 dark:text-green-400" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            CSV Spreadsheet
          </span>
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {csvData.rows.length.toLocaleString()} rows, {csvData.headers.length} columns
        </div>
      </div>

      {/* Content */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto"
      >
        <table
          className="w-full border-collapse"
          style={{ fontSize: `${fontSize}px` }}
        >
          <thead className="sticky top-0 z-10">
            <tr className="bg-gray-100 dark:bg-gray-700">
              {csvData.headers.map((header, i) => (
                <th
                  key={i}
                  className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-left font-semibold text-gray-700 dark:text-gray-200 whitespace-nowrap"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {csvData.rows.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className={rowIndex % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-850'}
              >
                {row.map((cell, cellIndex) => (
                  <td
                    key={cellIndex}
                    className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-gray-600 dark:text-gray-300 max-w-xs truncate"
                    title={cell}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        {csvData.rows.length === 0 && (
          <div className="flex items-center justify-center h-32 text-gray-400">
            No data
          </div>
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
            disabled={fontSize >= 18}
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

export default CsvViewer;
