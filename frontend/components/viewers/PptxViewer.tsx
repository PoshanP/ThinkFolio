"use client";

import { useRef, useState, useEffect } from 'react';
import { MessageSquare, ChevronLeft, ChevronRight, Presentation, ZoomIn, ZoomOut } from 'lucide-react';
import Image from 'next/image';

interface PptxViewerProps {
  previewHtml?: string;
  previewImageUrl?: string;
  currentSlide?: number;
  totalSlides?: number;
  onSlideChange?: (slide: number) => void;
  onChatClick?: () => void;
}

export function PptxViewer({
  previewHtml,
  previewImageUrl,
  currentSlide = 1,
  totalSlides = 1,
  onSlideChange,
  onChatClick,
}: PptxViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [showControls, setShowControls] = useState(true);
  const [zoom, setZoom] = useState(100);

  const handlePrevSlide = () => {
    if (currentSlide > 1 && onSlideChange) {
      onSlideChange(currentSlide - 1);
    }
  };

  const handleNextSlide = () => {
    if (currentSlide < totalSlides && onSlideChange) {
      onSlideChange(currentSlide + 1);
    }
  };

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 25, 200));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 25, 50));

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

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') handlePrevSlide();
      if (e.key === 'ArrowRight') handleNextSlide();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentSlide, totalSlides]);

  return (
    <div className="relative h-full flex flex-col bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <Presentation className="h-5 w-5 text-orange-500" />
          <span className="text-sm font-medium text-gray-200">
            PowerPoint Presentation
          </span>
        </div>
        <div className="text-sm text-gray-400">
          {totalSlides > 1 ? `Slide ${currentSlide} of ${totalSlides}` : `${totalSlides} slide${totalSlides !== 1 ? 's' : ''}`}
        </div>
      </div>

      {/* Content */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto flex items-center justify-center p-4"
      >
        {previewImageUrl ? (
          /* Show preview image */
          <div
            className="bg-white rounded-lg shadow-2xl overflow-hidden"
            style={{
              transform: `scale(${zoom / 100})`,
              transformOrigin: 'center',
            }}
          >
            <Image
              src={previewImageUrl}
              alt={`Slide ${currentSlide}`}
              width={800}
              height={600}
              className="object-contain"
              priority
            />
          </div>
        ) : previewHtml ? (
          /* Show HTML preview */
          <div
            className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl overflow-auto max-h-full"
            style={{
              transform: `scale(${zoom / 100})`,
              transformOrigin: 'top center',
              maxWidth: '900px',
            }}
          >
            <div
              dangerouslySetInnerHTML={{ __html: previewHtml }}
            />
          </div>
        ) : (
          /* Placeholder */
          <div className="text-center text-gray-400">
            <Presentation className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p>No preview available</p>
          </div>
        )}
      </div>

      {/* Controls */}
      <div
        className={`absolute bottom-4 left-1/2 transform -translate-x-1/2 transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex items-center gap-1 bg-gray-800 rounded-full shadow-lg px-2 py-1 border border-gray-700">
          {/* Slide navigation */}
          {totalSlides > 1 && (
            <>
              <button
                onClick={handlePrevSlide}
                disabled={currentSlide <= 1}
                className="p-2 text-gray-300 hover:bg-gray-700 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
                title="Previous slide"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              <span className="px-2 text-xs font-medium text-gray-300">
                {currentSlide} / {totalSlides}
              </span>

              <button
                onClick={handleNextSlide}
                disabled={currentSlide >= totalSlides}
                className="p-2 text-gray-300 hover:bg-gray-700 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
                title="Next slide"
              >
                <ChevronRight className="h-4 w-4" />
              </button>

              <div className="w-px h-6 bg-gray-700 mx-1" />
            </>
          )}

          {/* Zoom controls */}
          <button
            onClick={handleZoomOut}
            disabled={zoom <= 50}
            className="p-2 text-gray-300 hover:bg-gray-700 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
            title="Zoom out"
          >
            <ZoomOut className="h-4 w-4" />
          </button>

          <span className="px-2 text-xs font-medium text-gray-300">
            {zoom}%
          </span>

          <button
            onClick={handleZoomIn}
            disabled={zoom >= 200}
            className="p-2 text-gray-300 hover:bg-gray-700 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
            title="Zoom in"
          >
            <ZoomIn className="h-4 w-4" />
          </button>

          {onChatClick && (
            <>
              <div className="w-px h-6 bg-gray-700 mx-1" />
              <button
                onClick={onChatClick}
                className="p-2 text-indigo-400 hover:bg-indigo-900/30 rounded-full"
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

export default PptxViewer;
