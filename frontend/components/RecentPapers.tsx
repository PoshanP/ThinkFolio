"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FileText, Calendar, MessageSquare, ChevronRight, Clock } from "lucide-react";
import { createClient } from "@supabase/supabase-js";

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

export function RecentPapers() {
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecentPapers();
  }, []);

  const fetchRecentPapers = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      // Fetch recent papers with processing status
      const { data: papersData, error } = await supabase
        .from('papers')
        .select(`
          *,
          document_processing_status (status)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(4);

      if (error) throw error;

      // Fetch chat counts for each paper
      const papersWithChatCounts = await Promise.all(
        (papersData || []).map(async (paper) => {
          const { count } = await supabase
            .from('chat_sessions')
            .select('*', { count: 'exact', head: true })
            .eq('paper_id', paper.id);

          return {
            ...paper,
            chat_count: count || 0,
            status: paper.document_processing_status?.[0]?.status || 'processed'
          };
        })
      );

      setPapers(papersWithChatCounts);
    } catch (error) {
      console.error('Error fetching recent papers:', error);
    } finally {
      setLoading(false);
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
        return 'text-yellow-600 bg-yellow-100';
      case 'processed':
      case 'completed':
        return 'text-green-600 bg-green-100';
      case 'failed':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Recent Papers
          </h2>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Recent Papers
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Your recently uploaded research papers
          </p>
        </div>
        <Link
          href="/papers"
          className="flex items-center text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
        >
          View all
          <ChevronRight className="h-4 w-4 ml-1" />
        </Link>
      </div>

      {papers.length === 0 ? (
        <div className="p-12 text-center">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">No papers uploaded yet</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
            Upload your first paper to get started
          </p>
        </div>
      ) : (
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {papers.map((paper) => (
            <div
              key={paper.id}
              className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 mt-1">
                  <FileText className="h-10 w-10 text-gray-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <Link
                        href={`/chat?paper=${paper.id}`}
                        className="text-sm font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400"
                      >
                        {paper.title}
                      </Link>
                      <div className="flex items-center mt-1 space-x-4 text-xs text-gray-500 dark:text-gray-400">
                        <span className="flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {formatDate(paper.created_at)}
                        </span>
                        <span>{paper.page_count} pages</span>
                        <span className="flex items-center">
                          <MessageSquare className="h-3 w-3 mr-1" />
                          {paper.chat_count} chats
                        </span>
                      </div>
                    </div>
                    <span
                      className={`ml-4 px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                        paper.status || 'processed'
                      )}`}
                    >
                      {paper.status === 'completed' ? 'processed' : paper.status}
                    </span>
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