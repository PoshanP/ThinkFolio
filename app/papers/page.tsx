"use client";

import { Suspense, useEffect, useState, useMemo } from "react";
import { useSupabase } from "@/lib/hooks/useSupabase";
import { useRouter, useSearchParams } from "next/navigation";
import { FileText, Trash2, Loader2, Search, ArrowLeft, FolderPlus, Menu, X } from "lucide-react";
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
import { CollectionsSidebar, AddToCollectionModal, CollectionBadges } from "@/frontend/components/collections";
import { useCollections, useCollectionPapers, invalidateCollectionCaches } from "@/lib/hooks/useCollections";
import { CollectionWithCount } from "@/lib/types/database";
import { SIGNED_URL_EXPIRY_SECONDS } from "@/lib/constants";
import { formatDate } from "@/lib/utils/dateFormat";
import { renderPdfFirstPage } from "@/lib/utils/pdfPreview";

// Loading skeleton component
function PapersPageSkeleton() {
  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header skeleton */}
      <div className="flex-shrink-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 rounded-xl mx-4 mt-4">
        <div className="flex items-center gap-3 animate-pulse">
          <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
        </div>
      </div>
      {/* Content skeleton */}
      <div className="flex-1 flex">
        <div className="hidden lg:block w-64 flex-shrink-0 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 animate-pulse">
          <div className="p-4 space-y-3">
            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          </div>
        </div>
        <div className="flex-1 p-4 lg:p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-64 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Main page wrapper with Suspense
export default function PapersPage() {
  return (
    <Suspense fallback={<PapersPageSkeleton />}>
      <PapersPageContent />
    </Suspense>
  );
}

function PapersPageContent() {
  const supabase = useSupabase();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { confirmDeletePaper, confirmDeleteCollection } = useConfirm();
  const { error: showError, success: showSuccess } = useAlert();
  const { refreshStats } = useStats();
  const { refreshPapers, refreshRecentReads } = useData();
  const { data: cachedPapers, isLoading: swrLoading, mutate } = usePapers();
  const [searchTerm, setSearchTerm] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [previewImages, setPreviewImages] = useState<Record<string, string>>({});

  // Collections state
  const collectionFromUrl = searchParams.get('collection');
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(collectionFromUrl);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [addToCollectionPaper, setAddToCollectionPaper] = useState<{ id: string; title: string } | null>(null);
  const [paperCollectionsMap, setPaperCollectionsMap] = useState<Record<string, CollectionWithCount[]>>({});
  const [deletingCollection, setDeletingCollection] = useState(false);

  // Sync selected collection with URL
  useEffect(() => {
    const collectionParam = searchParams.get('collection');
    if (collectionParam !== selectedCollectionId) {
      setSelectedCollectionId(collectionParam);
    }
  }, [searchParams, selectedCollectionId]);

  // Collection hooks
  const { data: collections, refresh: refreshCollections } = useCollections();
  const { data: collectionPapers } = useCollectionPapers(selectedCollectionId);

  const papers = cachedPapers || [];
  const loading = swrLoading && !cachedPapers;

  const hasProcessingPapers = papers.some(
    p => p.processing_status === 'pending' || p.processing_status === 'processing'
  );

  // Fetch collections for all papers
  useEffect(() => {
    const fetchPaperCollections = async () => {
      if (!papers.length) return;
      const collectionsData: Record<string, CollectionWithCount[]> = {};
      await Promise.all(
        papers.map(async (paper) => {
          try {
            const response = await fetch(`/api/papers/${paper.id}/collections`, { credentials: 'include' });
            if (response.ok) {
              const json = await response.json();
              if (json.data) collectionsData[paper.id] = json.data;
            }
          } catch (err) {
            console.warn(`Failed to fetch collections for paper ${paper.id}:`, err);
          }
        })
      );
      setPaperCollectionsMap(collectionsData);
    };
    fetchPaperCollections();
  }, [papers.length]);

  // Poll for processing papers
  useEffect(() => {
    if (!hasProcessingPapers) return;
    const pollInterval = setInterval(() => mutate(), 3000);
    return () => clearInterval(pollInterval);
  }, [hasProcessingPapers, mutate]);

  // Generate previews
  useEffect(() => {
    if (papers.length > 0) {
      const newPapers = papers.filter((p: Paper) => !hasPreview(p.id) && p.storage_path);
      if (newPapers.length > 0) generatePreviewImages(newPapers);
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

  const generatePreviewImages = async (paperList: Paper[]) => {
    await Promise.all(
      paperList.map(async (paper) => {
        if (paper.storage_path) {
          const { data, error } = await supabase.storage
            .from('papers')
            .createSignedUrl(paper.storage_path, SIGNED_URL_EXPIRY_SECONDS);
          if (!error && data?.signedUrl) {
            const img = await renderPdfFirstPage(data.signedUrl, 560);
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
      const { error } = await supabase.from('papers').delete().eq('id', paperId);
      if (error) throw error;
      mutate((current: Paper[] | undefined) => current?.filter(p => p.id !== paperId), false);
      clearPreview(paperId);
      refreshStats();
      refreshCollections();
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
        refreshStats();
      }
      refreshRecentReads();
      router.push(`/chat-new?session=${sessionId}&paper=${paperId}`);
    } catch (err) {
      console.error('Error opening chat session:', err);
    }
  };

  const handleCollectionSelect = (collectionId: string | null) => {
    setSelectedCollectionId(collectionId);
    setMobileSidebarOpen(false);
    if (collectionId) {
      router.push(`/papers?collection=${collectionId}`, { scroll: false });
    } else {
      router.push('/papers', { scroll: false });
    }
  };

  const handleAddToCollectionSuccess = () => {
    invalidateCollectionCaches();
    refreshCollections();
    if (addToCollectionPaper) {
      fetch(`/api/papers/${addToCollectionPaper.id}/collections`, { credentials: 'include' })
        .then(res => res.json())
        .then(json => {
          if (json.data) {
            setPaperCollectionsMap(prev => ({ ...prev, [addToCollectionPaper.id]: json.data }));
          }
        })
        .catch(console.error);
    }
  };

  const handleDeleteCollection = async () => {
    if (!selectedCollectionId || !selectedCollection) return;
    const confirmed = await confirmDeleteCollection();
    if (!confirmed) return;
    setDeletingCollection(true);
    try {
      const response = await fetch(`/api/collections/${selectedCollectionId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete collection');
      }
      showSuccess('Collection deleted successfully');
      invalidateCollectionCaches();
      refreshCollections();
      handleCollectionSelect(null);
    } catch (err) {
      console.error('Error deleting collection:', err);
      showError(err instanceof Error ? err.message : 'Failed to delete collection');
    } finally {
      setDeletingCollection(false);
    }
  };

  const basePapers = useMemo(() => {
    if (selectedCollectionId && collectionPapers) return collectionPapers;
    return papers;
  }, [selectedCollectionId, collectionPapers, papers]);

  const filteredPapers = useMemo(() => {
    return basePapers.filter(paper =>
      paper.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [basePapers, searchTerm]);

  const totalPaperCount = papers.length;
  const selectedCollection = collections?.find(c => c.id === selectedCollectionId);

  if (loading) return <PapersPageSkeleton />;

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Full-width Header */}
      <div className="flex-shrink-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-4 py-3 rounded-xl mx-4 mt-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/')}
            className="p-2.5 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <button
            onClick={() => setMobileSidebarOpen(true)}
            className="lg:hidden p-2.5 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <Menu className="h-5 w-5" />
          </button>
          <h1 className="flex-1 text-lg font-semibold text-gray-900 dark:text-white">
            {selectedCollection ? selectedCollection.name : 'My Library'}
          </h1>
        </div>
      </div>

      {/* Sidebar + Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block w-64 flex-shrink-0 border-r border-gray-200 dark:border-gray-800">
          <CollectionsSidebar
            selectedCollectionId={selectedCollectionId}
            onSelectCollection={handleCollectionSelect}
            totalPaperCount={totalPaperCount}
          />
        </div>

        {/* Mobile Sidebar */}
        {mobileSidebarOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-black/50" onClick={() => setMobileSidebarOpen(false)} />
            <div className="absolute left-0 top-0 bottom-0 w-72 bg-white dark:bg-gray-800 shadow-xl">
              <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="font-semibold text-gray-900 dark:text-white">Collections</h2>
                <button
                  onClick={() => setMobileSidebarOpen(false)}
                  className="p-2.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 min-h-[44px] min-w-[44px] flex items-center justify-center"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <CollectionsSidebar
                selectedCollectionId={selectedCollectionId}
                onSelectCollection={handleCollectionSelect}
                totalPaperCount={totalPaperCount}
              />
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-6">
          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search papers..."
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent min-h-[44px]"
            />
          </div>

          {/* Papers Grid */}
          {filteredPapers.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
                {selectedCollectionId ? 'No papers in this collection' : 'No papers found'}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {selectedCollectionId
                  ? 'Add papers using the folder icon on any paper card.'
                  : 'Upload your first paper to get started.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredPapers.map((paper) => (
                <div
                  key={paper.id}
                  onClick={() => createChatSession(paper.id)}
                  className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden cursor-pointer group hover:shadow-lg hover:border-indigo-300 dark:hover:border-indigo-600 transition-all"
                >
                  {/* Thumbnail */}
                  <div className="relative aspect-[4/3] bg-gray-100 dark:bg-gray-900">
                    {previewImages[paper.id] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={previewImages[paper.id]}
                        alt={paper.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <FileText className="h-12 w-12 text-gray-300 dark:text-gray-600" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-3">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors mb-1">
                      {paper.title}
                    </h3>
                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                      <span>{formatDate(paper.created_at)} • {paper.page_count}p</span>
                      <span className="px-1.5 py-0.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded">
                        {paper.chat_count || 0} chats
                      </span>
                    </div>

                    {/* Collections + Actions row */}
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                      {/* Collection badges - left */}
                      <div className="flex-1 min-w-0">
                        {paperCollectionsMap[paper.id]?.length > 0 && (
                          <CollectionBadges collections={paperCollectionsMap[paper.id]} maxVisible={2} size="sm" />
                        )}
                      </div>
                      {/* Actions - right */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setAddToCollectionPaper({ id: paper.id, title: paper.title });
                          }}
                          className="p-2 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
                          title="Add to collection"
                        >
                          <FolderPlus className="h-4 w-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deletePaper(paper.id);
                          }}
                          disabled={deleting === paper.id}
                          className="p-2 text-gray-400 hover:text-red-500 rounded transition-colors disabled:opacity-50 min-h-[36px] min-w-[36px] flex items-center justify-center"
                          title="Delete"
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
      </div>

      {/* Add to Collection Modal */}
      <AddToCollectionModal
        isOpen={!!addToCollectionPaper}
        paperId={addToCollectionPaper?.id || null}
        paperTitle={addToCollectionPaper?.title}
        onClose={() => setAddToCollectionPaper(null)}
        onSuccess={handleAddToCollectionSuccess}
      />
    </div>
  );
}
