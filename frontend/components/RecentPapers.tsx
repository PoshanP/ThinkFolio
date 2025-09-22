"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { FileText, MessageSquare, ChevronRight, Clock } from "lucide-react";

interface Paper {
  id: string;
  title: string;
  source: string;
  page_count: number;
  created_at: string;
  status?: string;
  chatCount?: number;
}

interface RecentPapersProps {
  onRefresh?: () => void;
}

export function RecentPapers({ onRefresh: _onRefresh }: RecentPapersProps) {
  const [papers, setPapers] = useState<Paper[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchRecentPapers();
  }, []);

  const fetchRecentPapers = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/papers');

      if (response.status === 401) {
        // Not authenticated, set empty state
        setPapers([]);
        return;
      }

      if (response.ok) {
        const data = await response.json();
        // Get the 4 most recent papers
        const recentPapers = (data.data || []).slice(0, 4);

        // Fetch chat count for each paper
        const papersWithChatCount = await Promise.all(
          recentPapers.map(async (paper: Paper) => {
            try {
              const chatResponse = await fetch(`/api/chat/sessions?paperId=${paper.id}`);
              if (chatResponse.ok) {
                const chatData = await chatResponse.json();
                return {
                  ...paper,
                  chatCount: chatData.data?.length || 0,
                  status: 'processed' // Assume processed if we can fetch it
                };
              }
              return { ...paper, chatCount: 0, status: 'processed' };
            } catch {
              return { ...paper, chatCount: 0, status: 'processed' };
            }
          })
        );

        setPapers(papersWithChatCount);
      } else {
        // Handle other errors by setting empty state
        setPapers([]);
      }
    } catch (error) {
      console.error('Error fetching recent papers:', error);
      setPapers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInHours = diffInMs / (1000 * 60 * 60);
    const diffInDays = diffInHours / 24;

    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} hours ago`;
    } else if (diffInDays < 7) {
      return `${Math.floor(diffInDays)} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const getAuthorFromSource = (source: string) => {
    if (source === 'upload') return 'Uploaded document';
    if (source === 'url') return 'From URL';
    return source;
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Recent Papers
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Your latest research papers and chat sessions
            </p>
          </div>
        </div>
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                </div>
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
            Your latest research papers and chat sessions
          </p>
        </div>
        <Link
          href="/papers"
          className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1 text-sm font-medium"
        >
          <span>View All</span>
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {papers.length === 0 ? (
          <div className="px-6 py-8 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
              No papers yet
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Upload your first research paper to get started
            </p>
          </div>
        ) : (
          papers.map((paper) => (
            <Link
              key={paper.id}
              href={`/chat/${paper.id}`}
              className="block px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                    <FileText className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 truncate">
                          {paper.title}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {getAuthorFromSource(paper.source)}
                        </p>
                      </div>
                      {paper.status === "processing" && (
                        <span className="ml-2 px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 rounded-full">
                          Processing
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-2">
                      <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                        <Clock className="h-3 w-3" />
                        {formatTimeAgo(paper.created_at)}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {paper.page_count} pages
                      </span>
                      <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                        <MessageSquare className="h-3 w-3" />
                        {paper.chatCount} chats
                      </span>
                    </div>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 mt-3" />
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}