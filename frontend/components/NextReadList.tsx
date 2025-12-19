"use client";

import { useEffect, useState } from "react";
import { BookOpen, FileText, Clock, Loader2, Trash2 } from "lucide-react";
import { useSupabase } from "@/lib/hooks/useSupabase";
import { useRouter } from "next/navigation";
import { useAlert } from "@/lib/contexts/AlertContext";
import { useConfirm } from "@/lib/contexts/ConfirmContext";
import { useData } from "@/lib/contexts/DataContext";
import { useStats } from "@/lib/contexts/StatsContext";
import { Paper } from "@/lib/hooks/useApi";
import {
  getPreviewImage,
  setPreviewImage,
  hasPreview
} from "@/lib/utils/previewCache";

export function NextReadList() {
  const supabase = useSupabase();
  const router = useRouter();
  const { success: showSuccess, error: showError } = useAlert();
  const { confirmRemoveFromNextRead } = useConfirm();
  const { papers, refreshPapers, refreshRecentReads } = useData();
  const { refreshStats } = useStats();
  const [opening, setOpening] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [previewImages, setPreviewImages] = useState<Record<string, string>>({});

  // Filter for Next Read papers
  const nextReadPapers = papers?.filter(p => p.is_next_read) || [];

  // Check if any papers are still processing
  const hasProcessingPapers = nextReadPapers.some(
    p => p.processing_status === 'pending' || p.processing_status === 'processing'
  );

  // Poll for updates when papers are processing
  useEffect(() => {
    if (!hasProcessingPapers) return;

    const pollInterval = setInterval(() => {
      refreshPapers();
    }, 3000); // Poll every 3 seconds

    return () => clearInterval(pollInterval);
  }, [hasProcessingPapers, refreshPapers]);

  // Generate previews for papers that don't have them yet
  useEffect(() => {
    if (nextReadPapers.length > 0) {
      const newPapers = nextReadPapers.filter((p: Paper) => !hasPreview(p.id) && p.processing_status === 'completed' && p.storage_path);
      if (newPapers.length > 0) {
        generatePreviews(newPapers);
      }
      // Load existing cached previews (images only)
      const images: Record<string, string> = {};
      nextReadPapers.forEach(p => {
        const img = getPreviewImage(p.id);
        if (img) images[p.id] = img;
      });
      setPreviewImages(prev => ({ ...prev, ...images }));
    }
  }, [nextReadPapers.length, nextReadPapers.map(p => p.processing_status).join(',')]);

  const generatePreviews = async (paperList: Paper[]) => {
    await Promise.all(
      paperList.map(async (paper) => {
        if (paper.storage_path) {
          const signed = await supabase.storage
            .from('papers')
            .createSignedUrl(paper.storage_path, 60 * 60);

          const pdfUrl = signed.data?.signedUrl;
          if (pdfUrl) {
            const img = await renderPdfFirstPage(pdfUrl);
            if (img) {
              setPreviewImage(paper.id, img);
              setPreviewImages(prev => ({ ...prev, [paper.id]: img }));
            }
          }
        }
      })
    );
  };

  const renderPdfFirstPage = async (url: string): Promise<string | null> => {
    try {
      const pdfjs = await import('pdfjs-dist');
      const { getDocument, GlobalWorkerOptions } = pdfjs;
      GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

      const loadingTask = getDocument(url);
      const pdf = await loadingTask.promise;
      const page = await pdf.getPage(1);
      const viewport = page.getViewport({ scale: 1 });
      const targetWidth = 200;
      const scale = targetWidth / viewport.width;
      const scaledViewport = page.getViewport({ scale });

      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.width = scaledViewport.width;
      canvas.height = scaledViewport.height;

      await page.render({ canvasContext: context!, viewport: scaledViewport, canvas } as Parameters<typeof page.render>[0]).promise;
      return canvas.toDataURL('image/png');
    } catch (err) {
      console.warn('PDF preview render failed:', err);
      return null;
    }
  };

  const handleOpenPaper = async (paper: Paper) => {
    setOpening(paper.id);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }

      // Create chat session
      const { data: session, error: sessionError } = await supabase
        .from('chat_sessions')
        .insert({
          paper_id: paper.id,
          user_id: user.id,
          title: paper.title,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      // Remove from Next Read
      const { error: updateError } = await supabase
        .from('papers')
        .update({ is_next_read: false })
        .eq('id', paper.id);

      if (updateError) {
        console.warn('Failed to update is_next_read:', updateError);
      }

      // Generate summary in background
      try {
        fetch('/api/rag/query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            question: "Please provide a comprehensive summary of this paper including its main contributions, methodology, and key findings.",
            paperId: paper.id,
            sessionId: session.id,
            userId: user.id,
          }),
        }).then(async (summaryResponse) => {
          if (summaryResponse.ok) {
            const summaryData = await summaryResponse.json();
            await supabase
              .from('chat_messages')
              .insert({
                session_id: session.id,
                role: 'assistant',
                content: summaryData.answer,
                user_id: user.id,
                created_at: new Date().toISOString(),
                metadata: {
                  citations: summaryData.sources?.map((source: { metadata?: { page?: number }; content: string }) => ({
                    page: source.metadata?.page || 0,
                    text: source.content
                  })),
                  is_system_summary: true
                }
              });
          }
        }).catch(() => {
          // Ignore summary errors
        });
      } catch {
        // Ignore summary errors
      }

      // Refresh data
      refreshStats();
      refreshPapers();
      refreshRecentReads();

      // Navigate to chat
      router.push(`/chat-new?session=${session.id}&paper=${paper.id}`);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      showError(`Failed to open paper: ${errorMessage}`);
      setOpening(null);
    }
  };

  const handleRemoveFromNextRead = async (paper: Paper, e: React.MouseEvent) => {
    e.stopPropagation();

    const confirmed = await confirmRemoveFromNextRead();
    if (!confirmed) return;

    setDeleting(paper.id);

    try {
      const { error } = await supabase
        .from('papers')
        .update({ is_next_read: false })
        .eq('id', paper.id);

      if (error) throw error;

      showSuccess('Removed from Next Read');
      refreshStats();
      refreshPapers();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      showError(`Failed to remove: ${errorMessage}`);
    } finally {
      setDeleting(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="mt-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center gap-2 mb-3">
          <BookOpen className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          <h4 className="text-sm font-medium text-gray-900 dark:text-white">
            Next Read {nextReadPapers.length > 0 && `(${nextReadPapers.length})`}
          </h4>
        </div>

        {nextReadPapers.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Add document to read next
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              Turn off &quot;Open immediately&quot; when uploading
            </p>
          </div>
        ) : (
        <div className="space-y-2">
          {nextReadPapers.map((paper) => (
            <div
              key={paper.id}
              className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              {/* Clickable area for opening paper */}
              <button
                onClick={() => handleOpenPaper(paper)}
                disabled={opening === paper.id || deleting === paper.id}
                className="flex-1 flex items-center gap-3 text-left disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {/* Preview thumbnail */}
                <div className="w-10 h-12 flex-shrink-0 rounded overflow-hidden bg-gray-100 dark:bg-gray-700 relative">
                  {opening === paper.id ? (
                    <div className="w-full h-full flex items-center justify-center">
                      <Loader2 className="h-4 w-4 animate-spin text-indigo-600 dark:text-indigo-400" />
                    </div>
                  ) : previewImages[paper.id] ? (
                    <img
                      src={previewImages[paper.id]}
                      alt={paper.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (paper.processing_status === 'pending' || paper.processing_status === 'processing') ? (
                    <div className="w-full h-full flex items-center justify-center bg-white/60 dark:bg-gray-600/60 backdrop-blur-sm">
                      <Loader2 className="h-4 w-4 animate-spin text-gray-500 dark:text-gray-300" />
                    </div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <FileText className="h-4 w-4 text-gray-400" />
                    </div>
                  )}
                </div>

                {/* Paper info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2">
                    {paper.title}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <span>{paper.processing_status === 'completed' ? `${paper.page_count} pages` : '-'}</span>
                    <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
                    <Clock className="h-3 w-3" />
                    <span>{formatDate(paper.created_at)}</span>
                  </div>
                </div>
              </button>

              {/* Remove button */}
              <button
                onClick={(e) => handleRemoveFromNextRead(paper, e)}
                disabled={deleting === paper.id || opening === paper.id}
                className="p-1.5 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors disabled:opacity-50"
                title="Remove from Next Read"
              >
                {deleting === paper.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </button>
            </div>
          ))}
        </div>
        )}
      </div>
    </div>
  );
}
