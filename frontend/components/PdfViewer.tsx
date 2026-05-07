"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Loader2, X, ZoomIn, ZoomOut, RotateCw, ChevronUp, ChevronDown, MessageSquare } from "lucide-react";
import { STYLE_CLASSES } from "@/lib/constants/ui";

// Types for PDF.js (loaded dynamically)
type PDFDocumentProxy = {
  numPages: number;
  getPage: (pageNum: number) => Promise<PDFPageProxy>;
};

type PDFPageProxy = {
  getViewport: (params: { scale: number }) => { width: number; height: number };
  render: (params: { canvasContext: CanvasRenderingContext2D; viewport: { width: number; height: number }; canvas: HTMLCanvasElement }) => { promise: Promise<void>; cancel: () => void };
};

interface PdfViewerProps {
  pdfUrl: string | null;
  isLoading?: boolean;
  processingStatus?: "pending" | "processing" | "completed" | "failed" | null;
  processingError?: string | null;
  className?: string;
  onChatOpen?: () => void;
  messageCount?: number;
  containerKey?: string | number; // Changes when container size changes (e.g., chat open/close)
}

export function PdfViewer({
  pdfUrl,
  isLoading = false,
  processingStatus,
  processingError,
  className = "",
  onChatOpen,
  messageCount = 0,
}: PdfViewerProps) {
  const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [renderedPages, setRenderedPages] = useState<Set<number>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRefs = useRef<Map<number, HTMLCanvasElement>>(new Map());
  const renderTasksRef = useRef<Map<number, { cancel: () => void }>>(new Map());
  const baseWidthRef = useRef<number | null>(null);

  // Load PDF document
  useEffect(() => {
    if (!pdfUrl) return;

    setPdfLoading(true);
    setPdfError(null);
    setRenderedPages(new Set());
    baseWidthRef.current = null; // Reset for new PDF

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

  // Render a single page with given base width
  const renderPage = useCallback(async (pageNum: number, baseWidth: number) => {
    try {
      if (!pdfDoc) return;

      const canvas = canvasRefs.current.get(pageNum);
      if (!canvas) return;

      // Cancel existing render for this page
      const existingTask = renderTasksRef.current.get(pageNum);
      if (existingTask) {
        try {
          existingTask.cancel();
        } catch {
          // Ignore cancel errors
        }
      }

      const page = await pdfDoc.getPage(pageNum);
      const context = canvas.getContext("2d");
      if (!context) return;

      const viewport = page.getViewport({ scale: 1 });
      const fitScale = baseWidth / viewport.width;
      const finalScale = fitScale * scale;
      const scaledViewport = page.getViewport({ scale: finalScale });

      // Ensure valid dimensions
      const width = Math.max(1, Math.round(scaledViewport.width));
      const height = Math.max(1, Math.round(scaledViewport.height));

      canvas.width = width;
      canvas.height = height;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      // Reset transform before rendering
      context.setTransform(1, 0, 0, 1, 0, 0);

      const renderTask = page.render({
        canvasContext: context,
        viewport: scaledViewport,
        canvas: canvas,
      });

      renderTasksRef.current.set(pageNum, renderTask);
      await renderTask.promise;

      setRenderedPages(prev => new Set(prev).add(pageNum));
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== "RenderingCancelledException") {
        console.error("Error rendering page:", pageNum, err);
      }
    }
  }, [pdfDoc, scale]);

  // Render all pages when PDF loads or scale changes
  useEffect(() => {
    if (!pdfDoc || totalPages === 0 || !containerRef.current) return;

    // Calculate base width on first render
    const calculateAndRender = async () => {
      if (baseWidthRef.current === null) {
        // Get first page to determine aspect ratio
        const firstPage = await pdfDoc.getPage(1);
        const viewport = firstPage.getViewport({ scale: 1 });
        const pageAspectRatio = viewport.width / viewport.height;

        const containerHeight = containerRef.current!.clientHeight - 80; // Leave space for controls
        const containerWidth = containerRef.current!.clientWidth - 32; // Account for p-4 padding (16px × 2)

        // Calculate width that would make 80% of page height visible
        const targetHeight = containerHeight * 0.8;
        const widthForHeight = targetHeight * pageAspectRatio;

        // Use the smaller of width-fit or height-fit
        baseWidthRef.current = Math.max(Math.min(widthForHeight, containerWidth), 300);
      }

      const width = baseWidthRef.current;
      setRenderedPages(new Set());

      try {
        for (let i = 1; i <= totalPages; i++) {
          await renderPage(i, width);
        }
      } catch (err) {
        console.error("Error rendering pages:", err);
      }
    };

    calculateAndRender();
  }, [pdfDoc, totalPages, scale, renderPage]);

  
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
    setScale(prev => Math.min(prev + 0.25, 3));
  };

  const zoomOut = () => {
    setScale(prev => Math.max(prev - 0.25, 0.5));
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

  // Processing states
  if (processingStatus === "pending" || processingStatus === "processing") {
    return (
      <div className={`flex flex-col h-full bg-gray-50 dark:bg-gray-900 ${className}`}>
        <div className="flex-1 flex flex-col items-center justify-center text-gray-500 dark:text-gray-400 px-6">
          <Loader2 className="h-10 w-10 animate-spin mb-4" />
          <p className="text-base font-medium mb-2">Processing document...</p>
          <p className="text-sm text-center max-w-xs">
            Your document is being analyzed. This usually takes 10-30 seconds.
          </p>
        </div>
      </div>
    );
  }

  if (processingStatus === "failed") {
    return (
      <div className={`flex flex-col h-full bg-gray-50 dark:bg-gray-900 ${className}`}>
        <div className="flex-1 flex flex-col items-center justify-center text-red-500 dark:text-red-400 px-6">
          <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
            <X className="h-7 w-7" />
          </div>
          <p className="text-base font-medium mb-2">Processing failed</p>
          <p className="text-sm text-center max-w-xs text-gray-500 dark:text-gray-400">
            {processingError || "An error occurred while processing your document."}
          </p>
        </div>
      </div>
    );
  }

  if (isLoading || pdfLoading) {
    return (
      <div className={`flex flex-col h-full bg-gray-50 dark:bg-gray-900 ${className}`}>
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  if (!pdfUrl || pdfError) {
    return (
      <div className={`flex flex-col h-full bg-gray-50 dark:bg-gray-900 ${className}`}>
        <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400 px-6">
          <p className="text-sm text-center">{pdfError || "No document available for this chat."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative flex flex-col h-full bg-gray-200 dark:bg-gray-900 ${className}`}>
      {/* Scrollable PDF container with all pages */}
      <div
        ref={containerRef}
        className={`flex-1 overflow-y-auto scroll-smooth ${scale <= 1 ? 'overflow-x-hidden' : 'overflow-x-auto'}`}
      >
        <div className="flex flex-col items-center gap-4 p-4 pb-16">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
            <canvas
              key={pageNum}
              ref={(el) => {
                if (el) canvasRefs.current.set(pageNum, el);
              }}
              className="shadow-lg bg-white"
              style={scale <= 1 ? { maxWidth: '100%' } : undefined}
            />
          ))}
        </div>
      </div>

      {/* Fixed controls - bottom center */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1 p-1.5 rounded-lg bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm shadow-lg border border-gray-200 dark:border-gray-700">
        {/* Page navigation */}
        <button
          onClick={prevPage}
          disabled={currentPage <= 1}
          className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 transition-colors"
          title="Previous page"
        >
          <ChevronUp className="h-4 w-4 text-gray-700 dark:text-gray-300" />
        </button>
        <span className="text-xs text-gray-600 dark:text-gray-400 min-w-[50px] text-center font-medium">
          {currentPage} / {totalPages}
        </span>
        <button
          onClick={nextPage}
          disabled={currentPage >= totalPages}
          className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 transition-colors"
          title="Next page"
        >
          <ChevronDown className="h-4 w-4 text-gray-700 dark:text-gray-300" />
        </button>

        <div className="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-1" />

        {/* Zoom controls */}
        <button
          onClick={zoomOut}
          disabled={scale <= 0.5}
          className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 transition-colors"
          title="Zoom out"
        >
          <ZoomOut className="h-4 w-4 text-gray-700 dark:text-gray-300" />
        </button>
        <span className="text-xs text-gray-600 dark:text-gray-400 min-w-[40px] text-center font-medium">
          {Math.round(scale * 100)}%
        </span>
        <button
          onClick={zoomIn}
          disabled={scale >= 3}
          className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 transition-colors"
          title="Zoom in"
        >
          <ZoomIn className="h-4 w-4 text-gray-700 dark:text-gray-300" />
        </button>
        <button
          onClick={resetToFirstPage}
          className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          title="Reset to first page"
        >
          <RotateCw className="h-4 w-4 text-gray-700 dark:text-gray-300" />
        </button>

        {/* Chat button */}
        {onChatOpen && (
          <>
            <div className="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-1" />
            <button
              onClick={onChatOpen}
              className={`relative p-2 rounded-lg flex items-center justify-center ${STYLE_CLASSES.buttonPrimary}`}
              title="Open chat"
            >
              <MessageSquare className="h-4 w-4 text-white" />
              {messageCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-medium">
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
