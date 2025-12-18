"use client";

import { useState, useEffect, useCallback } from "react";
import { FileText, Download, Trash2, Clock, ChevronDown, ChevronRight, Loader2 } from "lucide-react";
import { useSupabase } from "@/lib/hooks/useSupabase";
import { useRouter, useSearchParams } from "next/navigation";

interface Session {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  message_count?: number;
}

interface Paper {
  id: string;
  title: string;
  source: string;
  page_count: number;
  storage_path: string;
}

export function PaperSidebar({ paperId }: { paperId: string }) {
  const supabase = useSupabase();
  const [isSessionsExpanded, setIsSessionsExpanded] = useState(true);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [paper, setPaper] = useState<Paper | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentSessionId = searchParams.get('session');

  const fetchPaperDetails = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('papers')
        .select('*')
        .eq('id', paperId)
        .single();

      if (error) throw error;
      setPaper(data);
    } catch (error) {
      console.error('Error fetching paper:', error);
    }
  }, [supabase, paperId]);

  const fetchSessions = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch sessions with message count
      const { data: sessionsData, error } = await supabase
        .from('chat_sessions')
        .select(`
          *,
          chat_messages (id)
        `)
        .eq('paper_id', paperId)
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .returns<(Session & { chat_messages?: { id: string }[] })[]>();

      if (error) throw error;

      const processedSessions = (sessionsData || []).map(session => ({
        ...session,
        message_count: session.chat_messages?.length || 0
      }));

      setSessions(processedSessions);
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setLoading(false);
    }
  }, [supabase, paperId]);

  useEffect(() => {
    fetchPaperDetails();
    fetchSessions();
  }, [fetchPaperDetails, fetchSessions]);

  const handleDownload = async () => {
    if (!paper) return;

    try {
      const { data, error } = await supabase.storage
        .from('papers')
        .download(paper.storage_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${paper.title}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading paper:', error);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this paper and all associated chats?')) return;

    try {
      const { error } = await supabase
        .from('papers')
        .delete()
        .eq('id', paperId);

      if (error) throw error;
      router.push('/papers');
    } catch (error) {
      console.error('Error deleting paper:', error);
    }
  };

  const handleNewSession = () => {
    router.push(`/chat/${paperId}`);
  };

  const handleSessionClick = (sessionId: string) => {
    router.push(`/chat/${paperId}?session=${sessionId}`);
  };

  return (
    <div className="h-full bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        {paper ? (
          <>
            <div className="flex items-start gap-3">
              <FileText className="h-5 w-5 text-gray-400 mt-1" />
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {paper.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {paper.source} • {paper.page_count} pages
                </p>
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <button
                onClick={handleDownload}
                className="flex-1 px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors flex items-center justify-center gap-2">
                <Download className="h-4 w-4" />
                <span>Download</span>
              </button>
              <button
                onClick={handleDelete}
                className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </>
        ) : (
          <div className="flex justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          <button
            onClick={() => setIsSessionsExpanded(!isSessionsExpanded)}
            className="flex items-center justify-between w-full text-left text-sm font-medium text-gray-700 dark:text-gray-300 mb-3"
          >
            <span>Chat Sessions</span>
            {isSessionsExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>

          {isSessionsExpanded && (
            <div className="space-y-2">
              {loading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                </div>
              ) : sessions.length > 0 ? (
                sessions.map((session) => (
                  <button
                    key={session.id}
                    onClick={() => handleSessionClick(session.id)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      currentSessionId === session.id
                        ? 'bg-indigo-100 dark:bg-indigo-900/30 border border-indigo-300 dark:border-indigo-700'
                        : 'bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600'
                    }`}
                  >
                    <p className="font-medium text-sm text-gray-900 dark:text-white truncate">
                      {session.title}
                    </p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                        <Clock className="h-3 w-3" />
                        {new Date(session.updated_at).toLocaleDateString()}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {session.message_count || 0} messages
                      </span>
                    </div>
                  </button>
                ))
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                  No chat sessions yet
                </p>
              )}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleNewSession}
            className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors text-sm font-medium">
            New Chat Session
          </button>
        </div>
      </div>
    </div>
  );
}