"use client";

import { useState, useEffect } from "react";
import { FileText, Download, Trash2, Clock, ChevronDown, ChevronRight, MessageSquare, Plus } from "lucide-react";
import Link from "next/link";

interface Session {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  messageCount?: number;
}

interface Paper {
  id: string;
  title: string;
  source: string;
  page_count: number;
  created_at: string;
  storage_path?: string;
}

interface PaperSidebarProps {
  paperId: string;
}

export function PaperSidebar({ paperId }: PaperSidebarProps) {
  const [isSessionsExpanded, setIsSessionsExpanded] = useState(true);
  const [paper, setPaper] = useState<Paper | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (paperId) {
      fetchPaperData();
      fetchSessions();
    }
  }, [paperId]);

  const fetchPaperData = async () => {
    try {
      const response = await fetch(`/api/papers/${paperId}`);
      if (response.ok) {
        const data = await response.json();
        setPaper(data.data);
      }
    } catch (error) {
      console.error('Error fetching paper:', error);
    }
  };

  const fetchSessions = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/chat/sessions?paperId=${paperId}`);
      if (response.ok) {
        const data = await response.json();

        // Fetch message count for each session
        const sessionsWithCount = await Promise.all(
          (data.data || []).map(async (session: Session) => {
            try {
              const messagesResponse = await fetch(`/api/chat/sessions/${session.id}/messages`);
              const messagesData = await messagesResponse.json();
              return {
                ...session,
                messageCount: messagesData.data?.length || 0
              };
            } catch {
              return { ...session, messageCount: 0 };
            }
          })
        );

        setSessions(sessionsWithCount);
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createNewSession = async () => {
    try {
      const response = await fetch('/api/chat/sessions/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paperId,
          title: `New Chat - ${new Date().toLocaleDateString()}`
        })
      });

      if (response.ok) {
        const data = await response.json();
        const newSession = { ...data.data, messageCount: 0 };
        setSessions(prev => [newSession, ...prev]);

        // Navigate to the new session
        window.location.href = `/chat/${paperId}?session=${newSession.id}`;
      }
    } catch (error) {
      console.error('Error creating session:', error);
    }
  };

  const handleDeletePaper = async () => {
    if (!confirm('Are you sure you want to delete this paper and all its chat sessions?')) {
      return;
    }

    try {
      const response = await fetch(`/api/papers/${paperId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        // Navigate back to dashboard
        window.location.href = '/';
      }
    } catch (error) {
      console.error('Error deleting paper:', error);
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
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInDays < 7) {
      return `${Math.floor(diffInDays)}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  if (isLoading && !paper) {
    return (
      <div className="h-full bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="animate-pulse">
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 bg-gray-200 dark:bg-gray-700 rounded mt-1"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
      {/* Paper Info */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-start gap-3">
          <FileText className="h-5 w-5 text-gray-400 mt-1" />
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {paper?.title || 'Loading...'}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {paper?.source === 'upload' ? 'Uploaded document' : 'From URL'} • {paper?.page_count || 0} pages
            </p>
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          {paper?.storage_path && (
            <button className="flex-1 px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors flex items-center justify-center gap-2">
              <Download className="h-4 w-4" />
              <span>Download</span>
            </button>
          )}
          <button
            onClick={handleDeletePaper}
            className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Chat Sessions */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => setIsSessionsExpanded(!isSessionsExpanded)}
              className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              {isSessionsExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
              Chat Sessions ({sessions.length})
            </button>
            <button
              onClick={createNewSession}
              className="p-1 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          {isSessionsExpanded && (
            <div className="space-y-2">
              {sessions.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    No chat sessions yet
                  </p>
                  <button
                    onClick={createNewSession}
                    className="mt-2 text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
                  >
                    Start your first chat
                  </button>
                </div>
              ) : (
                sessions.map((session) => (
                  <Link
                    key={session.id}
                    href={`/chat/${paperId}?session=${session.id}`}
                    className="block p-3 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors group"
                  >
                    <h4 className="font-medium text-gray-900 dark:text-white text-sm group-hover:text-indigo-600 dark:group-hover:text-indigo-400 truncate">
                      {session.title}
                    </h4>
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatTimeAgo(session.updated_at)}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="h-3 w-3" />
                        {session.messageCount} messages
                      </span>
                    </div>
                  </Link>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <Link
          href="/papers"
          className="block w-full px-3 py-2 text-center bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm"
        >
          Back to Papers
        </Link>
      </div>
    </div>
  );
}