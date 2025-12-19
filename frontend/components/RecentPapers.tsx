"use client";

import { useEffect, useState } from "react";
import { FileText, Clock, Trash2, Loader2, Heart } from "lucide-react";
import { useSupabase } from "@/lib/hooks/useSupabase";
import { useRouter } from "next/navigation";
import { useAlert } from "@/lib/contexts/AlertContext";
import { useConfirm } from "@/lib/contexts/ConfirmContext";
import { usePapers, useRecentReads, Paper } from "@/lib/hooks/useApi";
import { useStats } from "@/lib/contexts/StatsContext";
import {
  getPreviewImage,
  setPreviewImage,
  hasPreview,
  clearPreview
} from "@/lib/utils/previewCache";



export function RecentPapers() {
  const supabase = useSupabase();
  const { confirmDeletePaper } = useConfirm();
  const { refreshStats } = useStats();
  const { data: cachedPapers, isLoading: swrLoading, mutate } = usePapers();
  const { data: recentReads, isLoading: recentReadsLoading, mutate: mutateRecentReads } = useRecentReads();

  // Use SWR data directly - no local state duplication
  const papers = cachedPapers || [];
  const loading = swrLoading && !cachedPapers;
  const [deleting, setDeleting] = useState<string | null>(null);
  const [favoriteToggling, setFavoriteToggling] = useState<string | null>(null);
  const [previewImages, setPreviewImages] = useState<Record<string, string>>({});
  const router = useRouter();
  const { success: showSuccess, error: showError } = useAlert();

  // Generate previews when papers change
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
  }, [papers.length]);

  // Generate previews for recent reads
  useEffect(() => {
    if (recentReads && recentReads.length > 0) {
      const newPapers = recentReads.filter((p: Paper) => !hasPreview(p.id) && p.storage_path);
      if (newPapers.length > 0) {
        generatePreviewImages(newPapers);
      }
      // Load existing cached previews
      const images: Record<string, string> = {};
      recentReads.forEach((p: Paper) => {
        const img = getPreviewImage(p.id);
        if (img) images[p.id] = img;
      });
      if (Object.keys(images).length > 0) {
        setPreviewImages(prev => ({ ...prev, ...images }));
      }
    }
  }, [recentReads]);

  const generatePreviewImages = async (paperList: Paper[]) => {
    await Promise.all(
      paperList.map(async (paper) => {
        if (paper.storage_path) {
          const signed = await supabase.storage
            .from('papers')
            .createSignedUrl(paper.storage_path, 60 * 60);

          const pdfUrl = signed.data?.signedUrl;

          // Render first page to an image
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
      // Set worker source to local file
      GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

      const loadingTask = getDocument(url);
      const pdf = await loadingTask.promise;
      const page = await pdf.getPage(1);
      const viewport = page.getViewport({ scale: 1 });
      const targetWidth = 420;
      const scale = targetWidth / viewport.width;
      const scaledViewport = page.getViewport({ scale });

      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.width = scaledViewport.width;
      canvas.height = scaledViewport.height;

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
      // Update recent reads cache
      mutateRecentReads((current: Paper[] | undefined) =>
        current?.map(paper =>
          paper.id === paperId ? { ...paper, is_favorite: !isFavorite } : paper
        ), false);
    } catch (error) {
      console.error('Error updating favorite:', error);
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
      // Delete the paper - CASCADE will handle related records (chunks, sessions, messages)
      const { error } = await supabase
        .from('papers')
        .delete()
        .eq('id', paperId);

      if (error) throw error;

      // Update SWR cache
      mutate((current: Paper[] | undefined) => current?.filter(p => p.id !== paperId), false);
      // Update recent reads cache
      mutateRecentReads((current: Paper[] | undefined) => current?.filter(p => p.id !== paperId), false);
      // Clear preview from shared cache
      clearPreview(paperId);
      // Refresh stats in background
      refreshStats();

      // Show success message
      showSuccess('Paper deleted successfully!');
    } catch (error) {
      console.error('Error deleting paper:', error);
      showError('Failed to delete paper. Please try again.');
    } finally {
      setDeleting(null);
    }
  };

  const createChatSession = async (paperId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check if there are existing chat sessions for this paper
      const { data: existingSessions, error: fetchError } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('paper_id', paperId)
        .order('updated_at', { ascending: false });

      if (fetchError) throw fetchError;

      let sessionId: string;

      if (existingSessions && existingSessions.length > 0) {
        // Use the most recent existing session
        sessionId = existingSessions[0].id;
      } else {
        // Create new chat session only if none exist
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

      // Refresh recent reads (opening paper updates last read)
      mutateRecentReads();

      // Go to chat page with the session and paper filter
      router.push(`/chat-new?session=${sessionId}&paper=${paperId}`);
    } catch (error) {
      console.error('Error accessing chat session:', error);
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'processing':
        return 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/30';
      case 'processed':
      case 'completed':
        return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30';
      case 'failed':
        return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/30';
      default:
        return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-700';
    }
  };

  const favoritePapers = papers.filter((paper) => paper.is_favorite && !paper.is_next_read);

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Favourite Documents
          </h2>
          <div className="flex gap-3 overflow-hidden">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex-shrink-0 w-44 p-1.5 border border-gray-200 dark:border-gray-600 rounded-lg animate-pulse">
                <div className="mb-2 rounded-md bg-gray-200 dark:bg-gray-700 aspect-[85/110]"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-1.5"></div>
                <div className="h-2.5 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-6 pt-6 px-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Recent Reads
          </h3>
          <div className="flex gap-3 overflow-hidden pb-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex-shrink-0 w-44 p-1.5 border border-gray-200 dark:border-gray-600 rounded-lg animate-pulse">
                <div className="mb-2 rounded-md bg-gray-200 dark:bg-gray-700 aspect-[85/110]"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-1.5"></div>
                <div className="h-2.5 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Favourite Documents
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Quick access to the papers you loved
            </p>
          </div>
          <button
            onClick={() => router.push('/papers')}
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline pr-2"
          >
            See all
          </button>
        </div>
      </div>

      {swrLoading ? (
        <div className="flex gap-3 p-3 overflow-hidden">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex-shrink-0 w-44 p-1.5 border border-gray-200 dark:border-gray-600 rounded-lg animate-pulse">
              <div className="mb-2 rounded-md bg-gray-200 dark:bg-gray-700 aspect-[85/110]"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-1.5"></div>
              <div className="h-2.5 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : favoritePapers.length === 0 ? (
        <div className="p-12 text-center">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">
            No favourites yet
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
            Heart documents to see them here, or browse everything in My Library.
          </p>
          <button
            onClick={() => router.push('/papers')}
            className="mt-4 inline-flex items-center space-x-2 px-3 py-2 rounded-lg text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600"
          >
            <span>Go to My Library</span>
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:bg-gray-800 [&::-webkit-scrollbar-thumb]:bg-gray-600 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb:hover]:bg-gray-500" style={{
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgb(75 85 99) rgb(31 41 55)'
        }}>
          <div className="flex gap-3 p-3 min-w-max">
            {favoritePapers.map((paper) => (
              <div
                key={paper.id}
                className="flex-shrink-0 w-44 p-1.5 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group cursor-pointer"
                onClick={() => createChatSession(paper.id)}
              >
                <div className="mb-2 relative overflow-hidden rounded-md bg-gray-100 dark:bg-gray-700 aspect-[85/110]">
                  {previewImages[paper.id] ? (
                    <img
                      src={previewImages[paper.id]}
                      alt={`${paper.title} preview`}
                      className="absolute inset-0 w-full h-full object-contain"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400">
                      <FileText className="h-5 w-5" />
                    </div>
                  )}
                </div>
                <div>
                  <h4 className="text-xs font-medium text-gray-900 dark:text-white group-hover:text-blue-400 transition-colors truncate">
                    {paper.title}
                  </h4>
                  <div className="flex items-center justify-between mt-0.5">
                    <span className="text-[10px] text-gray-500 dark:text-gray-400">
                      {formatDate(paper.created_at)}
                    </span>
                    <div className="flex items-center space-x-0.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(paper.id, !!paper.is_favorite);
                        }}
                        disabled={favoriteToggling === paper.id}
                        className={`p-1 rounded transition-all ${
                          paper.is_favorite
                            ? 'text-red-500 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30'
                            : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:text-gray-500 dark:hover:text-gray-300 dark:hover:bg-gray-700/50'
                        } disabled:opacity-50`}
                        title={paper.is_favorite ? 'Remove from favorites' : 'Add to favorites'}
                        aria-pressed={paper.is_favorite}
                      >
                        {favoriteToggling === paper.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Heart className="h-3 w-3" fill={paper.is_favorite ? 'currentColor' : 'none'} />
                        )}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deletePaper(paper.id);
                        }}
                        disabled={deleting === paper.id}
                        className="p-1 rounded text-gray-400 hover:text-red-500 hover:bg-gray-100 dark:text-gray-500 dark:hover:text-red-400 dark:hover:bg-gray-700/50 transition-all disabled:opacity-50"
                        title="Delete paper"
                      >
                        {deleting === paper.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Trash2 className="h-3 w-3" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Reads Section */}
      <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-6">
        <div className="flex items-center justify-between mb-4 px-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Recent Reads
          </h3>
          <button
            onClick={() => router.push('/papers')}
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline pr-2"
          >
            See all
          </button>
        </div>

        {recentReadsLoading ? (
          <div className="flex gap-3 p-3 overflow-hidden">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex-shrink-0 w-44 p-1.5 border border-gray-200 dark:border-gray-600 rounded-lg animate-pulse">
                <div className="mb-2 rounded-md bg-gray-200 dark:bg-gray-700 aspect-[85/110]"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-1.5"></div>
                <div className="h-2.5 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : !recentReads || recentReads.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400 text-sm">Haven&apos;t read anything in past 7 days</p>
            <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">
              Start a chat with a paper to see it here
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:bg-gray-800 [&::-webkit-scrollbar-thumb]:bg-gray-600 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb:hover]:bg-gray-500" style={{
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgb(75 85 99) rgb(31 41 55)'
          }}>
            <div className="flex gap-3 p-3 min-w-max">
              {recentReads.slice(0, 10).map((paper) => (
                <div
                  key={paper.id}
                  className="flex-shrink-0 w-44 p-1.5 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group cursor-pointer"
                  onClick={() => createChatSession(paper.id)}
                >
                  <div className="mb-2 relative overflow-hidden rounded-md bg-gray-100 dark:bg-gray-700 aspect-[85/110]">
                    {previewImages[paper.id] ? (
                      <img
                        src={previewImages[paper.id]}
                        alt={`${paper.title} preview`}
                        className="absolute inset-0 w-full h-full object-contain"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-400">
                        <FileText className="h-6 w-6" />
                      </div>
                    )}
                  </div>
                  <div>
                    <h4 className="text-xs font-medium text-gray-900 dark:text-white group-hover:text-blue-400 transition-colors truncate">
                      {paper.title}
                    </h4>
                    <div className="flex items-center justify-between mt-0.5">
                      <span className="text-[10px] text-gray-500 dark:text-gray-400">
                        {formatDate(paper.created_at)}
                      </span>
                      <div className="flex items-center space-x-0.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(paper.id, !!paper.is_favorite);
                          }}
                          disabled={favoriteToggling === paper.id}
                          className={`p-1 rounded transition-all ${
                            paper.is_favorite
                              ? 'text-red-500 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30'
                              : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:text-gray-500 dark:hover:text-gray-300 dark:hover:bg-gray-700/50'
                          } disabled:opacity-50`}
                          title={paper.is_favorite ? 'Remove from favorites' : 'Add to favorites'}
                        >
                          {favoriteToggling === paper.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Heart className="h-3 w-3" fill={paper.is_favorite ? 'currentColor' : 'none'} />
                          )}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deletePaper(paper.id);
                          }}
                          disabled={deleting === paper.id}
                          className="p-1 rounded text-gray-400 hover:text-red-500 hover:bg-gray-100 dark:text-gray-500 dark:hover:text-red-400 dark:hover:bg-gray-700/50 transition-all disabled:opacity-50"
                          title="Delete paper"
                        >
                          {deleting === paper.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Trash2 className="h-3 w-3" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
