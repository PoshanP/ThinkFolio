"use client";

import { useEffect, useState } from "react";
import { FileText, MessageSquare, Clock, Trash2, Search, Loader2 } from "lucide-react";
import { useSupabase } from "@/lib/hooks/useSupabase";
import { useRouter } from "next/navigation";

interface Paper {
  id: string;
  title: string;
  source: string;
  page_count: number;
  created_at: string;
  chat_count?: number;
  status?: string;
}

interface ChatSession {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  paper?: {
    title: string;
  };
}

export function RecentPapers() {
  const supabase = useSupabase();
  const [papers, setPapers] = useState<Paper[]>([]);
  const [recentChats, setRecentChats] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [chatsLoading, setChatsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchAllPapers();
    fetchRecentChats();
  }, []);

  const fetchAllPapers = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      // Fetch ALL papers with processing status
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
      console.error('Error fetching papers:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentChats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setChatsLoading(false);
        return;
      }

      const { data: chatsData, error } = await supabase
        .from('chat_sessions')
        .select(`
          *,
          papers (title)
        `)
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(5);

      if (error) throw error;

      setRecentChats(chatsData || []);
    } catch (error) {
      console.error('Error fetching recent chats:', error);
    } finally {
      setChatsLoading(false);
    }
  };

  const deletePaper = async (paperId: string) => {
    if (!confirm('Are you sure you want to delete this paper? This will also delete all associated chat sessions.')) {
      return;
    }

    setDeleting(paperId);
    try {
      // Delete associated chat sessions and messages first
      const { data: sessions } = await supabase
        .from('chat_sessions')
        .select('id')
        .eq('paper_id', paperId);

      if (sessions) {
        await Promise.all(sessions.map(session =>
          supabase.from('chat_messages').delete().eq('session_id', session.id)
        ));
        await supabase.from('chat_sessions').delete().eq('paper_id', paperId);
      }

      // Delete paper chunks
      await supabase.from('paper_chunks').delete().eq('paper_id', paperId);

      // Delete processing status
      await supabase.from('document_processing_status').delete().eq('paper_id', paperId);

      // Delete the paper
      await supabase.from('papers').delete().eq('id', paperId);

      // Update local state
      const updatedPapers = papers.filter(p => p.id !== paperId);
      setPapers(updatedPapers);
    } catch (error) {
      console.error('Error deleting paper:', error);
      alert('Failed to delete paper. Please try again.');
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
      }

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

  const filteredPapers = papers.filter(paper =>
    paper.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            My Documents
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
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              My Documents
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              All your uploaded PDF documents
            </p>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search papers..."
            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500"
          />
        </div>
      </div>

      {filteredPapers.length === 0 ? (
        <div className="p-12 text-center">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">
            {searchTerm ? 'No documents found matching your search' : 'No documents uploaded yet'}
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
            {searchTerm ? 'Try a different search term' : 'Upload your first document to get started'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:bg-gray-800 [&::-webkit-scrollbar-thumb]:bg-gray-600 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb:hover]:bg-gray-500" style={{
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgb(75 85 99) rgb(31 41 55)'
        }}>
          <div className="flex gap-4 p-4 min-w-max">
            {filteredPapers.map((paper) => (
              <div
                key={paper.id}
                className="flex-shrink-0 w-72 p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group cursor-pointer"
                onClick={() => createChatSession(paper.id)}
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 relative">
                    <FileText className="h-8 w-8 text-blue-400" />
                    {paper.chat_count && paper.chat_count > 0 && (
                      <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs px-2 py-1 rounded-full min-w-[20px] text-center">
                        {paper.chat_count}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-blue-400 transition-colors truncate">
                          {paper.title}
                        </h4>
                        <div className="flex items-center mt-1 space-x-3 text-xs text-gray-500 dark:text-gray-400">
                          <span className="flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {formatDate(paper.created_at)}
                          </span>
                          <span>{paper.page_count} pages</span>
                        </div>
                        <div className="mt-2">
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                              paper.status || 'processed'
                            )}`}
                          >
                            {paper.status === 'completed' ? 'processed' : paper.status}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deletePaper(paper.id);
                        }}
                        disabled={deleting === paper.id}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded text-red-600 dark:text-red-400 disabled:opacity-50 ml-2"
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
        </div>
      )}

      {/* Recent Chats Section */}
      <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-6 px-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Recent Chats
          </h3>
          {recentChats.length >= 5 && (
            <button
              onClick={() => router.push('/chat-new')}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline pr-2"
            >
              Show all
            </button>
          )}
        </div>

        {chatsLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse flex items-center space-x-3">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-8"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-48"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
              </div>
            ))}
          </div>
        ) : recentChats.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400 text-sm">No chat sessions yet</p>
            <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">
              Upload a paper and start chatting to see your conversations here
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {recentChats.map((chat) => (
              <div
                key={chat.id}
                className="flex items-center justify-between py-2 px-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded cursor-pointer group transition-colors"
                onClick={() => router.push(`/chat-new?session=${chat.id}`)}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-blue-400 transition-colors truncate">
                    {chat.title}
                  </p>
                  {chat.paper && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {chat.paper.title}
                    </p>
                  )}
                </div>
                <span className="text-xs text-gray-400 ml-3">
                  {formatDate(chat.updated_at)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}