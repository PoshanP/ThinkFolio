"use client";

import { useState, useEffect } from "react";
import { PaperCard } from "@/frontend/components/PaperCard";
import { Search, Filter, Plus, Grid, List, Loader2, FileText } from "lucide-react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Paper {
  id: string;
  title: string;
  source: string;
  page_count: number;
  created_at: string;
  updated_at: string;
  user_id: string;
  storage_path: string;
  chat_count?: number;
  processing_status?: string;
}

export default function PapersPage() {
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [filterTag, setFilterTag] = useState("All");
  const router = useRouter();

  useEffect(() => {
    fetchPapers();
  }, []);

  const fetchPapers = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push("/auth/login");
        return;
      }

      // Fetch papers
      const { data: papersData, error } = await supabase
        .from('papers')
        .select(`
          *,
          document_processing_status (status)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch chat counts for each paper
      const papersWithCounts = await Promise.all(
        (papersData || []).map(async (paper) => {
          const { count } = await supabase
            .from('chat_sessions')
            .select('*', { count: 'exact', head: true })
            .eq('paper_id', paper.id);

          return {
            ...paper,
            chat_count: count || 0,
            processing_status: paper.document_processing_status?.[0]?.status
          };
        })
      );

      setPapers(papersWithCounts);
    } catch (error) {
      console.error('Error fetching papers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (paperId: string) => {
    if (!confirm('Are you sure you want to delete this paper?')) return;

    try {
      const { error } = await supabase
        .from('papers')
        .delete()
        .eq('id', paperId);

      if (error) throw error;

      setPapers(papers.filter(p => p.id !== paperId));
    } catch (error) {
      console.error('Error deleting paper:', error);
      alert('Failed to delete paper');
    }
  };

  const filteredPapers = papers.filter(paper =>
    paper.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            My Papers
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            {papers.length} {papers.length === 1 ? 'paper' : 'papers'} in your library
          </p>
        </div>
        <Link
          href="/"
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition"
        >
          <Plus className="h-4 w-4" />
          Upload Paper
        </Link>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search papers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg p-1">
          <button
            onClick={() => setViewMode("grid")}
            className={`p-2 rounded ${
              viewMode === "grid"
                ? "bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400"
                : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
            }`}
          >
            <Grid className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`p-2 rounded ${
              viewMode === "list"
                ? "bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400"
                : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
            }`}
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      {filteredPapers.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {searchQuery ? 'No papers found' : 'No papers uploaded yet'}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            {searchQuery
              ? 'Try adjusting your search terms'
              : 'Upload your first research paper to get started'}
          </p>
          {!searchQuery && (
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition"
            >
              <Plus className="h-4 w-4" />
              Upload Your First Paper
            </Link>
          )}
        </div>
      ) : (
        <div
          className={
            viewMode === "grid"
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              : "space-y-4"
          }
        >
          {filteredPapers.map((paper) => (
            <PaperCard
              key={paper.id}
              paper={{
                id: paper.id,
                title: paper.title,
                authors: `Uploaded from ${paper.source}`,
                abstract: `${paper.page_count} pages • ${paper.chat_count || 0} chats`,
                uploadedAt: new Date(paper.created_at),
                pageCount: paper.page_count,
                chatCount: paper.chat_count || 0,
                tags: paper.processing_status ? [paper.processing_status] : ['processed'],
              }}
              viewMode={viewMode}
              onDelete={() => handleDelete(paper.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}