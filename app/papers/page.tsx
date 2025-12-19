"use client";

import { useEffect, useState } from "react";
import { useSupabase } from "@/lib/hooks/useSupabase";
import { useRouter } from "next/navigation";
import { FileText, Clock, Trash2, Loader2, Search, Heart, ArrowLeft, BookOpen } from "lucide-react";
import { useAlert } from "@/lib/contexts/AlertContext";
import { useConfirm } from "@/lib/contexts/ConfirmContext";
import { usePapers, Paper } from "@/lib/hooks/useApi";
import { useData } from "@/lib/contexts/DataContext";
import { useStats } from "@/lib/contexts/StatsContext";
import {
  getPreviewImage,
  setPreviewImage,
  hasPreview,
  clearPreview
} from "@/lib/utils/previewCache";

export default function PapersPage() {
  const supabase = useSupabase();
  const router = useRouter();
  const { confirmDeletePaper, confirmRemoveFromNextRead } = useConfirm();
  const { error: showError, success: showSuccess } = useAlert();
  const { refreshStats } = useStats();
  const { papers: dataPapers, refreshPapers, refreshRecentReads } = useData();
  const { data: cachedPapers, isLoading: swrLoading, mutate } = usePapers();
  const [searchTerm, setSearchTerm] = useState("");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [favoriteToggling, setFavoriteToggling] = useState<string | null>(null);
  const [openingNextRead, setOpeningNextRead] = useState<string | null>(null);
  const [previewImages, setPreviewImages] = useState<Record<string, string>>({});

  // Use SWR data directly - no local state duplication
  const papers = cachedPapers || [];
  const loading = swrLoading && !cachedPapers;

  // Filter for Next Read papers
  const nextReadPapers = dataPapers?.filter(p => p.is_next_read) || [];

  // Check if any papers are still processing
  const hasProcessingPapers = papers.some(
    p => p.processing_status === 'pending' || p.processing_status === 'processing'
  );

  // Poll for updates when papers are processing
  useEffect(() => {
    if (!hasProcessingPapers) return;

    const pollInterval = setInterval(() => {
      mutate(); // Refresh SWR cache
    }, 3000); // Poll every 3 seconds

    return () => clearInterval(pollInterval);
  }, [hasProcessingPapers, mutate]);

  // Generate previews for papers
  useEffect(() => {
    if (papers.length > 0) {
      // Generate previews only for papers we haven't generated yet (check shared cache)
      const newPapers = papers.filter((p: Paper) => !hasPreview(p.id) && p.storage_path);
      if (newPapers.length > 0) {
        generatePreviewImages(newPapers);
      }
      // Load existing cached previews
      const images: Record<string, string> = {};
      papers.forEach((p: Paper) => {
        const img = getPreviewImage(p.id);
        if (img) images[p.id] = img;
      });
      if (Object.keys(images).length > 0) {
        setPreviewImages(prev => ({ ...prev, ...images }));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [papers.length]);

  // Generate previews for next read papers
  useEffect(() => {
    if (nextReadPapers.length > 0) {
      const newPapers = nextReadPapers.filter((p: Paper) => !hasPreview(p.id) && p.storage_path);
      if (newPapers.length > 0) {
        generatePreviewImages(newPapers);
      }
      // Load existing cached previews
      const images: Record<string, string> = {};
      nextReadPapers.forEach((p: Paper) => {
        const img = getPreviewImage(p.id);
        if (img) images[p.id] = img;
      });
      if (Object.keys(images).length > 0) {
        setPreviewImages(prev => ({ ...prev, ...images }));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nextReadPapers.length]);

  const generatePreviewImages = async (paperList: Paper[]) => {
    await Promise.all(
      paperList.map(async (paper) => {
        if (paper.storage_path) {
          const { data, error } = await supabase.storage
            .from('papers')
            .createSignedUrl(paper.storage_path, 60 * 60);

          if (!error && data?.signedUrl) {
            const img = await renderPdfFirstPage(data.signedUrl);
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
      // Set worker source to local file
      GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

      const loadingTask = getDocument(url);
      const pdf = await loadingTask.promise;
      const page = await pdf.getPage(1);
      const viewport = page.getViewport({ scale: 1 });
      const targetWidth = 560;
      const scale = targetWidth / viewport.width;
      const scaledViewport = page.getViewport({ scale });

      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.width = scaledViewport.width;
      canvas.height = scaledViewport.height;

      // Fill background so transparent PDF areas don't show dark gaps
      context!.fillStyle = '#ffffff';
      context!.fillRect(0, 0, canvas.width, canvas.height);

      await page.render({ canvasContext: context!, viewport: scaledViewport, canvas } as Parameters<typeof page.render>[0]).promise;
      return canvas.toDataURL('image/png');
    } catch (err) {
      console.warn('PDF preview render failed, falling back:', err);
      return null;
    }
  };

  const toggleFavorite = async (paperId: string, isFavorite: boolean) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }

      setFavoriteToggling(paperId);

      if (isFavorite) {
        const { error } = await supabase
          .from('paper_favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('paper_id', paperId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('paper_favorites')
          .insert({
            user_id: user.id,
            paper_id: paperId
          });

        if (error && !error.message.includes('duplicate key')) throw error;
      }

      // Update SWR cache
      mutate((current: Paper[] | undefined) =>
        current?.map(paper =>
          paper.id === paperId ? { ...paper, is_favorite: !isFavorite } : paper
        ), false);
    } catch (err) {
      console.error('Error updating favorite:', err);
      showError('Could not update favorites. Please try again.');
    } finally {
      setFavoriteToggling(null);
    }
  };

  const deletePaper = async (paperId: string) => {
    const confirmed = await confirmDeletePaper();
    if (!confirmed) return;

    setDeleting(paperId);
    try {
      const { error } = await supabase
        .from('papers')
        .delete()
        .eq('id', paperId);

      if (error) throw error;

      // Update SWR cache
      mutate((current: Paper[] | undefined) => current?.filter(p => p.id !== paperId), false);
      // Clear preview from shared cache
      clearPreview(paperId);
      // Refresh stats in background
      refreshStats();
    } catch (err) {
      console.error('Error deleting paper:', err);
      showError('Failed to delete paper. Please try again.');
    } finally {
      setDeleting(null);
    }
  };

  const createChatSession = async (paperId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: existingSessions, error: fetchError } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('paper_id', paperId)
        .order('updated_at', { ascending: false });

      if (fetchError) throw fetchError;

      let sessionId: string;

      if (existingSessions && existingSessions.length > 0) {
        sessionId = existingSessions[0].id;
      } else {
        const paper = papers.find(p => p.id === paperId);

        const { data: session, error } = await supabase
          .from('chat_sessions')
          .insert({
            user_id: user.id,
            paper_id: paperId,
            title: `Chat about ${paper?.title || 'Paper'}`,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        if (error) throw error;
        sessionId = session.id;
        // Refresh stats in background (new chat created)
        refreshStats();
      }

      // Refresh recent reads (opening a paper)
      refreshRecentReads();

      router.push(`/chat-new?session=${sessionId}&paper=${paperId}`);
    } catch (err) {
      console.error('Error opening chat session:', err);
    }
  };

  const handleOpenNextRead = async (paper: Paper) => {
    setOpeningNextRead(paper.id);
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

      // Refresh data
      refreshStats();
      refreshPapers();
      refreshRecentReads();

      // Navigate to chat
      router.push(`/chat-new?session=${session.id}&paper=${paper.id}`);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      showError(`Failed to open paper: ${errorMessage}`);
      setOpeningNextRead(null);
    }
  };

  const removeFromNextRead = async (paperId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    const confirmed = await confirmRemoveFromNextRead();
    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from('papers')
        .update({ is_next_read: false })
        .eq('id', paperId);

      if (error) throw error;

      showSuccess('Removed from Next Read');
      refreshStats();
      refreshPapers();
    } catch (error) {
      console.error('Error removing from next read:', error);
      showError('Failed to remove from Next Read');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
    return date.toLocaleDateString();
  };

  const filteredPapers = papers
    .filter(paper => !paper.is_next_read) // Exclude Next Read papers from main grid
    .filter(paper =>
      paper.title.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter(paper => (showFavoritesOnly ? paper.is_favorite : true));

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 animate-pulse">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-3"></div>
            <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded mb-3"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/')}
            className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="Back to home"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">My Library</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Browse all your uploaded papers</p>
          </div>
        </div>
      </div>

      {/* Next Read Section */}
      {nextReadPapers.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-2 mb-3">
            <BookOpen className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-sm font-medium text-gray-900 dark:text-white">
              Next Read ({nextReadPapers.length})
            </h2>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-gray-100 dark:[&::-webkit-scrollbar-track]:bg-gray-700 [&::-webkit-scrollbar-thumb]:bg-gray-300 dark:[&::-webkit-scrollbar-thumb]:bg-gray-600 [&::-webkit-scrollbar-thumb]:rounded-full">
            {nextReadPapers.map((paper) => (
              <div
                key={paper.id}
                onClick={() => handleOpenNextRead(paper)}
                className="flex-shrink-0 w-32 p-2 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer group"
              >
                <div className="relative mb-2 rounded overflow-hidden bg-gray-100 dark:bg-gray-700 aspect-[85/110]">
                  {openingNextRead === paper.id ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Loader2 className="h-5 w-5 animate-spin text-indigo-600 dark:text-indigo-400" />
                    </div>
                  ) : previewImages[paper.id] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={previewImages[paper.id]}
                      alt={paper.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (paper.processing_status === 'pending' || paper.processing_status === 'processing') ? (
                    <div className="w-full h-full flex items-center justify-center bg-white/60 dark:bg-gray-600/60 backdrop-blur-sm">
                      <Loader2 className="h-5 w-5 animate-spin text-gray-500 dark:text-gray-300" />
                    </div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <FileText className="h-6 w-6 text-gray-400" />
                    </div>
                  )}
                </div>
                <p className="text-xs font-medium text-gray-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                  {paper.title}
                </p>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[10px] text-gray-500 dark:text-gray-400">{paper.processing_status === 'completed' ? `${paper.page_count} pages` : '-'}</span>
                  <button
                    onClick={(e) => removeFromNextRead(paper.id, e)}
                    className="p-0.5 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                    title="Remove from Next Read"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search documents..."
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
              className={`inline-flex items-center space-x-2 px-3 py-2 rounded-lg text-sm border transition-colors ${
                showFavoritesOnly
                  ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700 text-yellow-700 dark:text-yellow-300'
                  : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <Heart className="h-4 w-4" fill={showFavoritesOnly ? 'currentColor' : 'none'} />
              <span>Favorites only</span>
            </button>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {filteredPapers.length} result{filteredPapers.length === 1 ? '' : 's'}
            </span>
          </div>
        </div>
      </div>

      {filteredPapers.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">
            {showFavoritesOnly ? 'No favourite documents match your filters.' : 'No documents found.'}
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
            {showFavoritesOnly ? 'Try turning off the favorites filter or upload a new document.' : 'Try a different search term or upload a document.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {filteredPapers.map((paper) => (
            <div
              key={paper.id}
              className="relative rounded-lg overflow-hidden cursor-pointer"
              onClick={() => createChatSession(paper.id)}
            >
              <div className="relative overflow-hidden bg-white dark:bg-gray-900 aspect-[210/297]">
                {previewImages[paper.id] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={previewImages[paper.id]}
                    alt={`${paper.title} preview`}
                    className="absolute inset-0 w-full h-full object-cover"
                    style={{ transform: 'scale(1.12)', transformOrigin: 'center' }}
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 bg-gradient-to-br from-gray-900/40 via-gray-800/20 to-gray-900/40 backdrop-blur-sm">
                    <div className="h-12 w-10 rounded-lg bg-white/10 border border-white/10 flex items-center justify-center shadow-inner">
                      <FileText className="h-6 w-6" />
                    </div>
                  </div>
                )}
                <div className="absolute top-2 right-2 w-5 h-5 bg-indigo-600 rounded-full flex items-center justify-center text-white text-[10px] font-medium shadow-md">
                  {paper.chat_count || 0}
                </div>
              </div>
              <div className="absolute inset-x-0 bottom-0 pt-14 pb-2 px-2 bg-gradient-to-t from-gray-800 via-gray-800/80 to-transparent text-white pointer-events-none">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="text-xs font-semibold truncate">{paper.title}</h3>
                    <div className="flex items-center mt-0.5 space-x-2 text-[10px] text-gray-200">
                      <span className="flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {formatDate(paper.created_at)}
                      </span>
                      <span>{paper.page_count} pages</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-0.5 pointer-events-auto">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(paper.id, !!paper.is_favorite);
                      }}
                      disabled={favoriteToggling === paper.id}
                      className={`p-1 rounded transition-all ${
                        paper.is_favorite
                          ? 'text-red-400 hover:bg-red-900/40'
                          : 'text-gray-200 hover:text-white hover:bg-white/10'
                      } disabled:opacity-50`}
                      title={paper.is_favorite ? 'Remove from favorites' : 'Add to favorites'}
                      aria-pressed={paper.is_favorite}
                    >
                      {favoriteToggling === paper.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Heart className="h-4 w-4" fill={paper.is_favorite ? 'currentColor' : 'none'} />
                      )}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deletePaper(paper.id);
                      }}
                      disabled={deleting === paper.id}
                      className="p-1 rounded text-red-200 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-50"
                      title="Delete paper"
                    >
                      {deleting === paper.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
