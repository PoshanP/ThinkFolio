"use client";

import { useEffect, useState, useMemo } from "react";
import { FileText, Trash2, Loader2, Heart } from "lucide-react";
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
import { useCollections, useCollectionPapers } from "@/lib/hooks/useCollections";
import { SYSTEM_COLLECTION_NAME } from "@/lib/constants";
import { formatDate } from "@/lib/utils/dateFormat";
import { renderPdfFirstPage } from "@/lib/utils/pdfPreview";



export function RecentPapers() {
  const supabase = useSupabase();
  const { confirmDeletePaper } = useConfirm();
  const { refreshStats } = useStats();
  const { data: cachedPapers, isLoading: swrLoading, mutate } = usePapers();
  const { data: recentReads, isLoading: recentReadsLoading, mutate: mutateRecentReads } = useRecentReads();

  // Collections hooks for Favorites
  const { data: collections, isLoading: collectionsLoading } = useCollections();
  const favoritesCollection = useMemo(() =>
    collections?.find(c => c.name === SYSTEM_COLLECTION_NAME),
    [collections]
  );
  const { data: favoritePapers, isLoading: favoritesLoading } = useCollectionPapers(
    favoritesCollection?.id || null
  );

  // Use SWR data directly - no local state duplication
  const papers = cachedPapers || [];
  const loading = swrLoading && !cachedPapers;
  const [deleting, setDeleting] = useState<string | null>(null);
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

  // Generate previews for favorite papers from collection
  useEffect(() => {
    if (favoritePapers && favoritePapers.length > 0) {
      const newPapers = favoritePapers.filter((p: Paper) => !hasPreview(p.id) && p.storage_path);
      if (newPapers.length > 0) {
        generatePreviewImages(newPapers);
      }
      // Load existing cached previews
      const images: Record<string, string> = {};
      favoritePapers.forEach((p: Paper) => {
        const img = getPreviewImage(p.id);
        if (img) images[p.id] = img;
      });
      if (Object.keys(images).length > 0) {
        setPreviewImages(prev => ({ ...prev, ...images }));
      }
    }
  }, [favoritePapers]);

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

  // Display all favorite papers from the collection
  const displayFavorites = useMemo(() =>
    favoritePapers || [],
    [favoritePapers]
  );

  if (loading || collectionsLoading) {
    return (
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg border border-gray-200 dark:border-gray-700">
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
      <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-2 sm:mb-4">
          <div>
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
              Favourite Documents
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-0.5 sm:mt-1">
              Quick access to the papers you loved
            </p>
          </div>
          <button
            onClick={() => router.push('/papers')}
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline px-2 py-1 min-h-[44px] flex items-center"
          >
            See all
          </button>
        </div>
      </div>

      {favoritesLoading ? (
        <div className="flex gap-3 p-3 overflow-hidden">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex-shrink-0 w-44 p-1.5 border border-gray-200 dark:border-gray-600 rounded-lg animate-pulse">
              <div className="mb-2 rounded-md bg-gray-200 dark:bg-gray-700 aspect-[85/110]"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-1.5"></div>
              <div className="h-2.5 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : displayFavorites.length === 0 ? (
        <div className="p-12 text-center">
          <Heart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">
            No favourites yet
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
            Add papers to your Favorites collection to see them here.
          </p>
          <button
            onClick={() => router.push('/papers?collection=' + (favoritesCollection?.id || ''))}
            className="mt-4 inline-flex items-center space-x-2 px-3 py-2 rounded-lg text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600"
          >
            <span>Go to Favorites</span>
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:bg-gray-800 [&::-webkit-scrollbar-thumb]:bg-gray-600 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb:hover]:bg-gray-500" style={{
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgb(75 85 99) rgb(31 41 55)'
        }}>
          <div className="flex gap-3 p-3 min-w-max">
            {displayFavorites.map((paper) => (
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
                      <Heart className="h-3 w-3 text-red-500" fill="currentColor" />
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
      <div className="mt-4 sm:mt-6 border-t border-gray-200 dark:border-gray-700 pt-4 sm:pt-6">
        <div className="flex items-center justify-between mb-3 sm:mb-4 px-4">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
            Recent Reads
          </h3>
          <button
            onClick={() => router.push('/papers')}
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline px-2 py-1 min-h-[44px] flex items-center"
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
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
