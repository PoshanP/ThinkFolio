"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { Bookmark, Trash2, Loader2, FileText, Calendar, ArrowLeft } from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Highlight {
  id: string;
  paper_id: string;
  highlighted_text: string;
  page_no: number | null;
  notes: string | null;
  created_at: string;
  message_id: string | null;
  papers: {
    id: string;
    title: string;
  };
}

interface GroupedHighlights {
  [paperId: string]: {
    paperTitle: string;
    highlights: Highlight[];
  };
}

export default function HighlightsPage() {
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchHighlights();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchHighlights = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/auth/login");
        return;
      }

      const { data, error } = await supabase
        .from('saved_highlights')
        .select(`
          *,
          papers (
            id,
            title
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching highlights:', error);
        throw error;
      }

      setHighlights(data || []);
    } catch (error) {
      console.error('Error fetching highlights:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteHighlight = async (highlightId: string) => {
    if (!confirm('Delete this highlight?')) return;

    setDeleting(highlightId);

    try {
      const { error } = await supabase
        .from('saved_highlights')
        .delete()
        .eq('id', highlightId);

      if (error) {
        console.error('Error deleting highlight:', error);
        throw error;
      }

      setHighlights(prev => prev.filter(h => h.id !== highlightId));
    } catch (error) {
      console.error('Error deleting highlight:', error);
      alert('Failed to delete highlight. Please try again.');
    } finally {
      setDeleting(null);
    }
  };

  const goToPaperChat = async (paperId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/auth/login");
        return;
      }

      // Find existing session for this paper
      const { data: sessions, error } = await supabase
        .from('chat_sessions')
        .select('id')
        .eq('paper_id', paperId)
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Error fetching sessions:', error);
        return;
      }

      if (sessions && sessions.length > 0) {
        // Navigate to existing session
        router.push(`/chat-new?session=${sessions[0].id}`);
      } else {
        // Create new session for this paper
        const { data: newSession, error: createError } = await supabase
          .from('chat_sessions')
          .insert({
            user_id: user.id,
            paper_id: paperId,
            title: 'New Document Chat',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        if (createError) {
          console.error('Error creating session:', createError);
          return;
        }

        router.push(`/chat-new?session=${newSession.id}`);
      }
    } catch (error) {
      console.error('Error navigating to chat:', error);
    }
  };

  const groupedHighlights: GroupedHighlights = highlights.reduce((acc, highlight) => {
    const paperId = highlight.paper_id;
    if (!acc[paperId]) {
      acc[paperId] = {
        paperTitle: highlight.papers.title,
        highlights: [],
      };
    }
    acc[paperId].highlights.push(highlight);
    return acc;
  }, {} as GroupedHighlights);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white dark:bg-gray-900">
        <Loader2 className="h-8 w-8 animate-spin text-gray-900 dark:text-white" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-white dark:bg-gray-900 overflow-y-auto">
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header with Back Button and Theme Toggle */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/')}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-gray-900 dark:text-white" />
              </button>
              <div className="flex items-center gap-3">
                <Bookmark className="h-7 w-7 text-gray-900 dark:text-white" />
                <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
                  Saved Highlights
                </h1>
              </div>
            </div>
          </div>
          <p className="text-gray-600 dark:text-gray-400 text-sm ml-14">
            Your saved quotes and key passages from research papers
          </p>
        </div>

        {highlights.length === 0 ? (
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-700 p-12 text-center">
            <Bookmark className="h-16 w-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No highlights yet
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Start highlighting important passages in your paper chats to save them here.
            </p>
            <button
              onClick={() => router.push('/chat-new')}
              className="px-6 py-3 bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-black rounded-lg transition-colors"
            >
              Go to Chat
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedHighlights).map(([paperId, { paperTitle, highlights: paperHighlights }]) => (
              <div key={paperId} className="bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-700 overflow-hidden">
                <button
                  onClick={() => goToPaperChat(paperId)}
                  className="w-full px-6 py-4 border-b border-gray-300 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700/50 transition-colors text-left"
                >
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-gray-900 dark:text-white" />
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                      {paperTitle}
                    </h2>
                    <span className="ml-auto text-sm text-gray-600 dark:text-gray-400">
                      {paperHighlights.length} {paperHighlights.length === 1 ? 'highlight' : 'highlights'}
                    </span>
                  </div>
                </button>

                <div className="divide-y divide-gray-300 dark:divide-gray-700">
                  {paperHighlights.map((highlight) => (
                    <div
                      key={highlight.id}
                      className="p-6 hover:bg-gray-200 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1">
                          <blockquote className="text-gray-900 dark:text-gray-100 italic border-l-4 border-blue-500 dark:border-blue-500 pl-4 mb-3">
                            &quot;{highlight.highlighted_text}&quot;
                          </blockquote>

                          <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {formatDate(highlight.created_at)}
                            </div>
                            {highlight.page_no && (
                              <div>
                                Page {highlight.page_no}
                              </div>
                            )}
                          </div>

                          {highlight.notes && (
                            <div className="mt-3 text-sm text-gray-800 dark:text-gray-300">
                              <strong>Notes:</strong> {highlight.notes}
                            </div>
                          )}
                        </div>

                        <button
                          onClick={() => deleteHighlight(highlight.id)}
                          disabled={deleting === highlight.id}
                          className="p-2 hover:bg-gray-300 dark:hover:bg-gray-600 text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 rounded-lg transition-colors disabled:opacity-50"
                        >
                          {deleting === highlight.id ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                          ) : (
                            <Trash2 className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
