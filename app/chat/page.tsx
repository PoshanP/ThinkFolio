"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { MessageSquare, FileText, Clock, Search, ChevronRight, Loader2 } from "lucide-react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface ChatSession {
  id: string;
  paper_id: string;
  title: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  paper?: {
    title: string;
  };
  messages?: {
    content: string;
  }[];
  message_count?: number;
}

export default function ChatSessionsPage() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const router = useRouter();

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push("/auth/login");
        return;
      }

      // Fetch chat sessions with paper details and message count
      const { data: sessionsData, error } = await supabase
        .from('chat_sessions')
        .select(`
          *,
          papers!inner (title),
          chat_messages (content)
        `)
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      // Process sessions to include message count and last message
      const processedSessions = (sessionsData || []).map(session => ({
        ...session,
        message_count: session.chat_messages?.length || 0,
        last_message: session.chat_messages?.[session.chat_messages.length - 1]?.content || ''
      }));

      setSessions(processedSessions);
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredSessions = sessions.filter(session =>
    session.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    session.paper?.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (session.messages?.[session.messages.length - 1]?.content || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const groupedSessions = filteredSessions.reduce((groups, session) => {
    const date = new Date(session.updated_at).toDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(session);
    return groups;
  }, {} as Record<string, ChatSession[]>);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Chat Sessions
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Continue your conversations with research papers
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search chat sessions..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
          />
        </div>
      </div>

      <div className="space-y-6">
        {Object.entries(groupedSessions).map(([date, sessions]) => (
          <div key={date}>
            <h2 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">
              {date === new Date().toDateString() ? "Today" :
               date === new Date(Date.now() - 86400000).toDateString() ? "Yesterday" :
               date}
            </h2>
            <div className="space-y-3">
              {sessions.map((session) => (
                <Link
                  key={session.id}
                  href={`/chat/${session.paper_id}?session=${session.id}`}
                  className="block bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:border-indigo-500 dark:hover:border-indigo-400 transition-colors group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <MessageSquare className="h-5 w-5 text-gray-400 mt-1" />
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                          {session.title}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <FileText className="h-3 w-3 text-gray-400" />
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {session.paper?.title || 'Unknown Paper'}
                          </p>
                        </div>
                        {session.messages && session.messages.length > 0 && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 line-clamp-2">
                            {session.messages[session.messages.length - 1].content}
                          </p>
                        )}
                        <div className="flex items-center gap-4 mt-3">
                          <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-500">
                            <Clock className="h-3 w-3" />
                            {new Date(session.updated_at).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-500">
                            {session.message_count || 0} messages
                          </span>
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>

      {filteredSessions.length === 0 && (
        <div className="text-center py-12">
          <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            No chat sessions found
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 mt-4 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
          >
            Upload a paper to start chatting
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      )}
    </div>
  );
}