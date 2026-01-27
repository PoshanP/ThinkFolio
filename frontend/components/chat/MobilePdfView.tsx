"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Loader2, X, ArrowLeft, ZoomIn, ZoomOut, RotateCw, MessageSquare, ChevronUp, ChevronDown, FileText } from "lucide-react";
import { STYLE_CLASSES } from "@/lib/constants/ui";

export type FileType = 'pdf' | 'docx' | 'txt' | 'rtf' | 'pptx' | 'csv' | 'epub' | 'html';

// Types for PDF.js (loaded dynamically)
type PDFDocumentProxy = {
  numPages: number;
  getPage: (pageNum: number) => Promise<PDFPageProxy>;
};

type PDFPageProxy = {
  getViewport: (params: { scale: number }) => { width: number; height: number };
  render: (params: { canvasContext: CanvasRenderingContext2D; viewport: { width: number; height: number }; canvas: HTMLCanvasElement }) => { promise: Promise<void>; cancel: () => void };
};

interface MobilePdfViewProps {
  pdfUrl: string | null;
  isLoading: boolean;
  processingStatus: "pending" | "processing" | "completed" | "failed" | null;
  processingError: string | null;
  onBack?: () => void;
  onChatOpen?: () => void;
  messageCount?: number;
  // Document type props
  fileType?: FileType;
  previewHtml?: string | null;
  previewImageUrl?: string | null;
}

export function MobilePdfView({
  pdfUrl,
  isLoading,
  processingStatus,
  processingError,
  onBack,
  onChatOpen,
  messageCount = 0,
  fileType = 'pdf',
  previewHtml,
  previewImageUrl,
}: MobilePdfViewProps) {
  // Debug logging
  console.log('MobilePdfView props:', { fileType, previewHtml: previewHtml?.slice(0, 100), previewImageUrl, pdfUrl: pdfUrl?.slice(0, 50) });

  const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRefs = useRef<Map<number, HTMLCanvasElement>>(new Map());
  const renderTasksRef = useRef<Map<number, { cancel: () => void }>>(new Map());

  // Load PDF document
  useEffect(() => {
    if (!pdfUrl) return;

    setPdfLoading(true);
    setPdfError(null);

    const loadPdf = async () => {
      try {
        const pdfjsLib = await import("pdfjs-dist");
        pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

        const loadingTask = pdfjsLib.getDocument(pdfUrl);
        const pdf = await loadingTask.promise;
        setPdfDoc(pdf as unknown as PDFDocumentProxy);
        setTotalPages(pdf.numPages);
      } catch (err) {
        console.error("Error loading PDF:", err);
        setPdfError("Failed to load PDF");
      } finally {
        setPdfLoading(false);
      }
    };

    loadPdf();

    return () => {
      renderTasksRef.current.forEach(task => task.cancel());
      renderTasksRef.current.clear();
    };
  }, [pdfUrl]);

  // Render a single page
  const renderPage = useCallback(async (pageNum: number) => {
    if (!pdfDoc || !containerRef.current) return;

    const canvas = canvasRefs.current.get(pageNum);
    if (!canvas) return;

    const existingTask = renderTasksRef.current.get(pageNum);
    if (existingTask) {
      existingTask.cancel();
    }

    try {
      const page = await pdfDoc.getPage(pageNum);
      const context = canvas.getContext("2d");
      if (!context) return;

      const containerWidth = containerRef.current.clientWidth - 32;
      const viewport = page.getViewport({ scale: 1 });
      const fitScale = containerWidth / viewport.width;
      const finalScale = fitScale * scale;
      const scaledViewport = page.getViewport({ scale: finalScale });

      const pixelRatio = window.devicePixelRatio || 1;
      canvas.width = scaledViewport.width * pixelRatio;
      canvas.height = scaledViewport.height * pixelRatio;
      canvas.style.width = `${scaledViewport.width}px`;
      canvas.style.height = `${scaledViewport.height}px`;

      // Reset transform before scaling (fixes zoom bug)
      context.setTransform(1, 0, 0, 1, 0, 0);
      context.scale(pixelRatio, pixelRatio);

      const renderTask = page.render({
        canvasContext: context,
        viewport: scaledViewport,
        canvas: canvas,
      });

      renderTasksRef.current.set(pageNum, renderTask);
      await renderTask.promise;
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== "RenderingCancelledException") {
        console.error("Error rendering page:", pageNum, err);
      }
    }
  }, [pdfDoc, scale]);

  // Render all pages when PDF loads or scale changes
  useEffect(() => {
    if (!pdfDoc || totalPages === 0) return;

    for (let i = 1; i <= totalPages; i++) {
      renderPage(i);
    }
  }, [pdfDoc, totalPages, scale, renderPage]);

  // Re-render on container resize
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !pdfDoc || totalPages === 0) return;

    let resizeTimeout: NodeJS.Timeout;
    let lastWidth = container.clientWidth;

    const handleResize = () => {
      const newWidth = container.clientWidth;
      if (Math.abs(newWidth - lastWidth) < 5) return;

      // Hide content during resize
      setIsResizing(true);

      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(async () => {
        lastWidth = container.clientWidth;
        // Render all pages in parallel
        await Promise.all(
          Array.from({ length: totalPages }, (_, i) => renderPage(i + 1))
        );
        // Show content after all pages rendered
        setIsResizing(false);
      }, 50);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    return () => {
      clearTimeout(resizeTimeout);
      resizeObserver.disconnect();
    };
  }, [pdfDoc, totalPages, renderPage]);

  // Zoom with center preservation
  const zoomWithCenter = useCallback((newScale: number) => {
    const container = containerRef.current;
    if (!container) {
      setScale(newScale);
      return;
    }

    // Get current center point as ratio of content
    const scrollLeft = container.scrollLeft;
    const scrollTop = container.scrollTop;
    const viewportWidth = container.clientWidth;
    const viewportHeight = container.clientHeight;

    // Center point in content coordinates
    const centerX = scrollLeft + viewportWidth / 2;
    const centerY = scrollTop + viewportHeight / 2;

    // Ratio of center to current content size
    const contentWidth = container.scrollWidth;
    const contentHeight = container.scrollHeight;
    const ratioX = centerX / contentWidth;
    const ratioY = centerY / contentHeight;

    setScale(newScale);

    // After render, restore center position
    requestAnimationFrame(() => {
      const newContentWidth = container.scrollWidth;
      const newContentHeight = container.scrollHeight;
      const newCenterX = ratioX * newContentWidth;
      const newCenterY = ratioY * newContentHeight;

      container.scrollLeft = newCenterX - viewportWidth / 2;
      container.scrollTop = newCenterY - viewportHeight / 2;
    });
  }, []);

  const zoomIn = () => {
    const newScale = Math.min(scale + 0.25, 3);
    zoomWithCenter(newScale);
  };

  const zoomOut = () => {
    const newScale = Math.max(scale - 0.25, 0.5);
    zoomWithCenter(newScale);
  };

  const resetToFirstPage = () => {
    setScale(1);
    goToPage(1);
  };

  // Page navigation
  const goToPage = useCallback((pageNum: number) => {
    const canvas = canvasRefs.current.get(pageNum);
    if (canvas && containerRef.current) {
      canvas.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setCurrentPage(pageNum);
    }
  }, []);

  const prevPage = () => {
    if (currentPage > 1) {
      goToPage(currentPage - 1);
    }
  };

  const nextPage = () => {
    if (currentPage < totalPages) {
      goToPage(currentPage + 1);
    }
  };

  // Track current page on scroll
  useEffect(() => {
    const container = containerRef.current;
    if (!container || totalPages === 0) return;

    const handleScroll = () => {
      const containerRect = container.getBoundingClientRect();
      const containerCenter = containerRect.top + containerRect.height / 3;

      for (let i = 1; i <= totalPages; i++) {
        const canvas = canvasRefs.current.get(i);
        if (canvas) {
          const rect = canvas.getBoundingClientRect();
          if (rect.top <= containerCenter && rect.bottom >= containerCenter) {
            setCurrentPage(i);
            break;
          }
        }
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [totalPages]);

  // Floating back button component for reuse
  const FloatingBackButton = () => onBack ? (
    <button
      onClick={onBack}
      className="absolute top-3 left-3 z-10 p-1.5 rounded-full bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm shadow-md border border-gray-200/50 dark:border-gray-700/50 flex items-center justify-center hover:bg-white/80 dark:hover:bg-gray-800/80 transition-colors"
    >
      <ArrowLeft className="h-5 w-5 text-gray-800 dark:text-gray-200" />
    </button>
  ) : null;

  // Processing states
  if (processingStatus === "pending" || processingStatus === "processing") {
    return (
      <div className="relative flex flex-col h-full bg-gray-50 dark:bg-gray-900">
        <FloatingBackButton />
        <div className="flex-1 flex flex-col items-center justify-center text-gray-500 dark:text-gray-400 px-6">
          <Loader2 className="h-10 w-10 animate-spin mb-4" />
          <p className="text-base font-medium mb-2">Processing document...</p>
          <p className="text-sm text-center max-w-xs">Your document is being analyzed.</p>
        </div>
      </div>
    );
  }

  if (processingStatus === "failed") {
    return (
      <div className="relative flex flex-col h-full bg-gray-50 dark:bg-gray-900">
        <FloatingBackButton />
        <div className="flex-1 flex flex-col items-center justify-center text-red-500 dark:text-red-400 px-6">
          <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
            <X className="h-7 w-7" />
          </div>
          <p className="text-base font-medium mb-2">Processing failed</p>
          <p className="text-sm text-center max-w-xs text-gray-500 dark:text-gray-400">
            {processingError || "An error occurred."}
          </p>
        </div>
      </div>
    );
  }

  if (isLoading || pdfLoading) {
    return (
      <div className="relative flex flex-col h-full bg-gray-50 dark:bg-gray-900">
        <FloatingBackButton />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  // For non-PDF file types, render HTML preview or alternative viewer
  // Check this BEFORE the pdfUrl check since non-PDF files use previewHtml
  if (fileType && fileType !== 'pdf') {
    // PPTX with image preview
    if (fileType === 'pptx' && previewImageUrl) {
      return (
        <div className="relative flex flex-col h-full bg-gray-100 dark:bg-gray-900">
          <FloatingBackButton />
          <div className="flex-1 overflow-auto p-4">
            <div className="flex flex-col items-center gap-4">
              <img
                src={previewImageUrl}
                alt="Slide preview"
                className="max-w-full shadow-lg rounded-lg"
              />
              {previewHtml && (
                <div
                  className="w-full bg-white dark:bg-gray-800 rounded-lg shadow p-4 prose dark:prose-invert prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: previewHtml }}
                />
              )}
            </div>
          </div>
          {/* Chat button */}
          {onChatOpen && (
            <div className="fixed bottom-4 right-4 z-20">
              <button
                onClick={onChatOpen}
                className="relative p-3 rounded-full bg-indigo-600 hover:bg-indigo-700 shadow-lg flex items-center justify-center"
              >
                <MessageSquare className="h-6 w-6 text-white" />
                {messageCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
                    {messageCount > 9 ? '9+' : messageCount}
                  </span>
                )}
              </button>
            </div>
          )}
        </div>
      );
    }

    // HTML preview available (DOCX, RTF, EPUB, HTML, CSV)
    if (previewHtml) {
      return (
        <div className="relative flex flex-col h-full bg-gray-100 dark:bg-gray-900">
          <FloatingBackButton />
          <div className="flex-1 overflow-auto">
            <div className="bg-white dark:bg-gray-800 min-h-full p-4">
              <div
                className="prose dark:prose-invert prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: previewHtml }}
              />
            </div>
          </div>
          {/* Chat button */}
          {onChatOpen && (
            <div className="fixed bottom-4 right-4 z-20">
              <button
                onClick={onChatOpen}
                className="relative p-3 rounded-full bg-indigo-600 hover:bg-indigo-700 shadow-lg flex items-center justify-center"
              >
                <MessageSquare className="h-6 w-6 text-white" />
                {messageCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
                    {messageCount > 9 ? '9+' : messageCount}
                  </span>
                )}
              </button>
            </div>
          )}
        </div>
      );
    }

    // Fallback for files without preview - show file icon and info
    return (
      <div className="relative flex flex-col h-full bg-gray-100 dark:bg-gray-900">
        <FloatingBackButton />
        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <div className="w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded-2xl flex items-center justify-center mb-4">
            <FileText className="h-10 w-10 text-gray-400 dark:text-gray-500" />
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-2">
            {fileType.toUpperCase()} Document
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500 text-center">
            Preview not available. You can still chat about this document.
          </p>
        </div>
        {/* Chat button */}
        {onChatOpen && (
          <div className="fixed bottom-4 right-4 z-20">
            <button
              onClick={onChatOpen}
              className="relative p-3 rounded-full bg-indigo-600 hover:bg-indigo-700 shadow-lg flex items-center justify-center"
            >
              <MessageSquare className="h-6 w-6 text-white" />
              {messageCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
                  {messageCount > 9 ? '9+' : messageCount}
                </span>
              )}
            </button>
          </div>
        )}
      </div>
    );
  }

  // For PDF files, check if URL is available
  if (!pdfUrl || pdfError) {
    return (
      <div className="relative flex flex-col h-full bg-gray-50 dark:bg-gray-900">
        <FloatingBackButton />
        <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400 px-6">
          <p className="text-sm text-center">{pdfError || "No document available."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col h-full bg-gray-200 dark:bg-gray-900">
      {/* Floating back button - top left */}
      <FloatingBackButton />

      {/* Scrollable PDF container with all pages */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto"
        style={{ paddingTop: '16px', paddingBottom: '70px' }}
      >
        <div className={`flex flex-col items-center gap-4 px-4 min-w-fit ${isResizing ? 'invisible' : 'visible'}`}>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
            <canvas
              key={pageNum}
              ref={(el) => {
                if (el) canvasRefs.current.set(pageNum, el);
              }}
              className="shadow-lg bg-white max-w-none"
            />
          ))}
        </div>
      </div>

      {/* Fixed bottom controls - centered */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-0.5 md:gap-1 p-1 md:p-1.5 rounded-xl bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm shadow-lg border border-gray-200 dark:border-gray-700 max-w-[calc(100vw-24px)]">
        {/* Page navigation */}
        <button
          onClick={prevPage}
          disabled={currentPage <= 1}
          className="p-1.5 md:p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 flex items-center justify-center"
        >
          <ChevronUp className="h-4 w-4 md:h-5 md:w-5 text-gray-700 dark:text-gray-300" />
        </button>
        <span className="text-[10px] md:text-xs text-gray-600 dark:text-gray-400 min-w-[32px] md:min-w-[45px] text-center font-medium">
          {currentPage}/{totalPages}
        </span>
        <button
          onClick={nextPage}
          disabled={currentPage >= totalPages}
          className="p-1.5 md:p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 flex items-center justify-center"
        >
          <ChevronDown className="h-4 w-4 md:h-5 md:w-5 text-gray-700 dark:text-gray-300" />
        </button>

        <div className="w-px h-5 md:h-6 bg-gray-200 dark:bg-gray-700 mx-0.5 md:mx-1" />

        {/* Zoom controls */}
        <button
          onClick={zoomOut}
          disabled={scale <= 0.5}
          className="p-1.5 md:p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 flex items-center justify-center"
        >
          <ZoomOut className="h-4 w-4 md:h-5 md:w-5 text-gray-700 dark:text-gray-300" />
        </button>
        <span className="text-[10px] md:text-xs text-gray-600 dark:text-gray-400 min-w-[28px] md:min-w-[40px] text-center font-medium">
          {Math.round(scale * 100)}%
        </span>
        <button
          onClick={zoomIn}
          disabled={scale >= 3}
          className="p-1.5 md:p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 flex items-center justify-center"
        >
          <ZoomIn className="h-4 w-4 md:h-5 md:w-5 text-gray-700 dark:text-gray-300" />
        </button>
        <button
          onClick={resetToFirstPage}
          className="p-1.5 md:p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center"
          title="Reset to first page"
        >
          <RotateCw className="h-4 w-4 md:h-5 md:w-5 text-gray-700 dark:text-gray-300" />
        </button>

        {/* Chat button */}
        {onChatOpen && (
          <>
            <div className="w-px h-5 md:h-6 bg-gray-200 dark:bg-gray-700 mx-0.5 md:mx-1" />
            <button
              onClick={onChatOpen}
              className={`relative p-1.5 md:p-2 rounded-lg flex items-center justify-center ${STYLE_CLASSES.buttonPrimary}`}
            >
              <MessageSquare className="h-4 w-4 md:h-5 md:w-5 text-white" />
              {messageCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 md:w-5 md:h-5 bg-red-500 text-white text-[10px] md:text-xs rounded-full flex items-center justify-center font-medium">
                  {messageCount > 9 ? '9+' : messageCount}
                </span>
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
