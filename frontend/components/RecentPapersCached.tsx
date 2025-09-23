"use client";

import { useState } from "react";
import { FileText, MessageSquare, Clock, Trash2, Search, Loader2 } from "lucide-react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { usePapers } from "@/lib/hooks/useApi";

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
  chat_count?: number;
  status?: string;
}

export function RecentPapersCached() {
  const [searchTerm, setSearchTerm] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);
  const router = useRouter();

  const { data: papers, error, isLoading: loading, mutate } = usePapers();

  // Debug: Log the papers data
  console.log('Papers data:', papers);

  const deletePaper = async (paperId: string) => {
    setDeleting(paperId);
    try {
      const { error } = await supabase
        .from('papers')
        .delete()
        .eq('id', paperId);

      if (error) throw error;

      // Update the cache by removing the deleted paper
      mutate();
    } catch (error) {
      console.error('Error deleting paper:', error);
      alert('Failed to delete paper');
    } finally {
      setDeleting(null);
    }
  };

  const filteredPapers = (papers || []).filter(paper =>
    paper.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    paper.source.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'processing':
        return 'text-yellow-400';
      case 'completed':
        return 'text-green-400';
      case 'failed':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'processing':
        return 'Processing...';
      case 'completed':
        return 'Ready';
      case 'failed':
        return 'Failed';
      default:
        return 'Unknown';
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Documents</h3>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Documents</h3>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Search documents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm w-64"
          />
        </div>
      </div>

      {filteredPapers.length === 0 ? (
        <div className="text-center py-8">
          <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-400 mb-2">
            {searchTerm ? 'No documents match your search' : 'No documents uploaded yet'}
          </p>
          <p className="text-sm text-gray-500">
            {searchTerm ? 'Try a different search term' : 'Upload your first document to get started'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredPapers.map((paper) => (
            <div
              key={paper.id}
              className="relative flex items-center justify-between p-4 bg-gray-700 rounded-lg border border-gray-600 hover:bg-gray-650 transition-colors group cursor-pointer"
              onClick={() => {
                if (paper.status === 'completed') {
                  router.push(`/chat-new?paper=${paper.id}`);
                }
              }}
            >
              <div className="flex items-center space-x-4 flex-1 min-w-0">
                <div className="flex-shrink-0 relative">
                  <FileText className="h-8 w-8 text-blue-400" />
                  {paper.chat_count && paper.chat_count > 0 && (
                    <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs px-2 py-1 rounded-full min-w-[20px] text-center">
                      {paper.chat_count}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-white truncate group-hover:text-blue-300 transition-colors">
                    {paper.title}
                  </h4>
                  <div className="flex items-center space-x-4 mt-1">
                    <span className="text-xs text-gray-400">
                      {paper.source}
                    </span>
                    <span className="text-xs text-gray-400">
                      {paper.page_count} pages
                    </span>
                    <span className="text-xs text-gray-400">
                      {formatDate(paper.created_at)}
                    </span>
                    <span className={`text-xs ${getStatusColor(paper.status || 'completed')}`}>
                      {getStatusText(paper.status || 'completed')}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deletePaper(paper.id);
                  }}
                  disabled={deleting === paper.id}
                  className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                >
                  {deleting === paper.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}