"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Plus,
  MessageSquare,
  Send,
  Search,
  Trash2,
  Loader2,
  Menu,
  X,
  ArrowLeft
} from "lucide-react";
import { ExportChatButton } from "@/frontend/components/ExportChatButton";
import { HighlightableText } from "@/frontend/components/HighlightableText";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface ChatSession {
  id: string;
  paper_id: string | null;
  title: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  paper?: {
    title: string;
  };
}

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  created_at: string;
  session_id: string;
  metadata?: any;
}

function ChatNewPageContent() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loadingSessions, setLoadingSessions] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const [loadingSession, setLoadingSession] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [filterPaperId, setFilterPaperId] = useState<string | null>(null);
  const [sessionsFetched, setSessionsFetched] = useState(false);
  const [messagesCache, setMessagesCache] = useState<{[sessionId: string]: Message[]}>({});
  const [savingHighlight, setSavingHighlight] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageCounter = useRef(0); // Counter for unique message IDs
  const router = useRouter();
  const searchParams = useSearchParams();

  // Override parent layout styling
  useEffect(() => {
    // Set body styles
    document.body.style.backgroundColor = "#111827";
    document.body.style.margin = "0";
    document.body.style.padding = "0";
    document.body.style.height = "100vh";
    document.body.style.overflow = "hidden";

    // Hide navbar and main container
    const navbar = document.querySelector('nav');
    const main = document.querySelector('main');

    if (navbar) {
      navbar.style.display = 'none';
    }

    if (main) {
      main.style.position = 'static';
      main.style.margin = '0';
      main.style.padding = '0';
      main.style.maxWidth = 'none';
      main.style.height = '100vh';
      main.style.overflow = 'hidden';
    }

    return () => {
      // Cleanup when leaving the page
      document.body.style.backgroundColor = "";
      document.body.style.margin = "";
      document.body.style.padding = "";
      document.body.style.height = "";
      document.body.style.overflow = "";

      if (navbar) {
        navbar.style.display = '';
      }

      if (main) {
        main.style.position = '';
        main.style.margin = '';
        main.style.padding = '';
        main.style.maxWidth = '';
        main.style.height = '';
        main.style.overflow = '';
      }
    };
  }, []);

  useEffect(() => {
    // Only fetch sessions if not already fetched
    if (!sessionsFetched) {
      fetchSessions();
    }

    const sessionId = searchParams.get('session');
    const paperId = searchParams.get('paper');

    // Set filter if coming from a specific paper
    if (paperId) {
      setFilterPaperId(paperId);
    }

    if (sessionId) {
      loadSession(sessionId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionsFetched]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchSessions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/auth/login");
        return;
      }

      const { data: sessionsData, error } = await supabase
        .from('chat_sessions')
        .select(`
          *,
          papers (title)
        `)
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setSessions(sessionsData || []);
      setSessionsFetched(true);
    } catch (error) {
      console.error('Error fetching sessions:', error);
    }
  };

  const createNewSession = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: session, error } = await supabase
        .from('chat_sessions')
        .insert({
          user_id: user.id,
          title: filterPaperId ? 'New Document Chat' : 'New Chat',
          paper_id: filterPaperId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating session:', error);
        return;
      }

      setCurrentSession(session);
      setMessages([]);
      setSessions(prev => [session, ...prev]);

      const urlParams = new URLSearchParams({ session: session.id });
      if (filterPaperId) {
        urlParams.set('paper', filterPaperId);
      }
      router.push(`/chat-new?${urlParams.toString()}`);
    } catch (error) {
      console.error('Error creating session:', error);
    }
  };

  const loadSession = async (sessionId: string) => {
    if (currentSession?.id === sessionId) return;

    // Clear messages immediately when switching sessions
    setMessages([]);
    setLoadingSession(true);

    try {
      const { data: session, error: sessionError } = await supabase
        .from('chat_sessions')
        .select(`
          *,
          papers (title)
        `)
        .eq('id', sessionId)
        .single();

      if (sessionError) throw sessionError;
      setCurrentSession(session);

      // Check cache first
      if (messagesCache[sessionId]) {
        setMessages(messagesCache[sessionId]);
        setLoadingSession(false);
        return;
      }

      const { data: messagesData, error: messagesError } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (messagesError) throw messagesError;

      const transformedMessages = (messagesData || []).map((msg, index) => ({
        id: `${msg.id}-${index}`,
        content: msg.content,
        role: msg.role as 'user' | 'assistant',
        created_at: msg.created_at,
        session_id: msg.session_id,
        metadata: msg.metadata
      }));

      // Cache the messages
      setMessagesCache(prev => ({
        ...prev,
        [sessionId]: transformedMessages
      }));

      setMessages(transformedMessages);
    } catch (error) {
      console.error('Error loading session:', error);
    } finally {
      setLoadingSession(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || !currentSession) return;

    const sessionIsLoading = loadingSessions.has(currentSession.id);
    if (sessionIsLoading) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const messageContent = input.trim();
    const sessionIdAtStart = currentSession.id; // Capture session ID at start

    const userMessage: Message = {
      id: `temp-user-${Date.now()}-${messageCounter.current++}`,
      content: messageContent,
      role: 'user',
      created_at: new Date().toISOString(),
      session_id: sessionIdAtStart
    };

    // Update cache first
    const updatedCacheWithUser = [...(messagesCache[sessionIdAtStart] || []), userMessage];
    setMessagesCache(prev => ({
      ...prev,
      [sessionIdAtStart]: updatedCacheWithUser
    }));

    // Only update messages if we're still on the same session - read from cache
    if (currentSession?.id === sessionIdAtStart) {
      setMessages(updatedCacheWithUser);
    }

    setInput("");
    setLoadingSessions(prev => new Set(prev).add(sessionIdAtStart));

    try {
      if (messages.length === 0) {
        const newTitle = messageContent.slice(0, 50) + (messageContent.length > 50 ? '...' : '');
        await supabase
          .from('chat_sessions')
          .update({
            title: newTitle,
            updated_at: new Date().toISOString()
          })
          .eq('id', sessionIdAtStart);

        // Only update UI if still on the same session
        if (currentSession?.id === sessionIdAtStart) {
          setCurrentSession(prev => prev ? { ...prev, title: newTitle } : null);
          setSessions(prev => prev.map(s => s.id === sessionIdAtStart ? { ...s, title: newTitle } : s));
        }
      }

      let assistantContent = "";

      // Use the session from when the request started
      const sessionForRequest = sessions.find(s => s.id === sessionIdAtStart);

      if (sessionForRequest?.paper_id) {
        const response = await fetch('/api/rag/query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            question: messageContent,
            paperId: sessionForRequest.paper_id,
            sessionId: sessionIdAtStart,
            userId: user.id,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          assistantContent = data.answer;
        } else {
          assistantContent = "Sorry, I encountered an error processing your question about the paper.";
        }
      } else {
        assistantContent = "I'm ready to help! Upload a paper to enable document-specific conversations, or ask me any general questions.";
      }

      const assistantMessage: Message = {
        id: `temp-assistant-${Date.now()}-${messageCounter.current++}`,
        content: assistantContent,
        role: 'assistant',
        created_at: new Date().toISOString(),
        session_id: sessionIdAtStart
      };

      // Update cache first
      const updatedCacheWithAssistant = [...updatedCacheWithUser, assistantMessage];
      setMessagesCache(prev => ({
        ...prev,
        [sessionIdAtStart]: updatedCacheWithAssistant
      }));

      // Only update messages if we're still on the same session - read from cache
      setCurrentSession(currentSessionAtUpdate => {
        if (currentSessionAtUpdate?.id === sessionIdAtStart) {
          setMessages(updatedCacheWithAssistant);
        }
        return currentSessionAtUpdate;
      });

    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: `temp-error-${Date.now()}-${messageCounter.current++}`,
        content: "Sorry, I encountered an error. Please try again.",
        role: 'assistant',
        created_at: new Date().toISOString(),
        session_id: sessionIdAtStart
      };

      // Update cache first
      const updatedCacheWithError = [...updatedCacheWithUser, errorMessage];
      setMessagesCache(prev => ({
        ...prev,
        [sessionIdAtStart]: updatedCacheWithError
      }));

      // Only update messages if we're still on the same session - read from cache
      setCurrentSession(currentSessionAtUpdate => {
        if (currentSessionAtUpdate?.id === sessionIdAtStart) {
          setMessages(updatedCacheWithError);
        }
        return currentSessionAtUpdate;
      });
    } finally {
      setLoadingSessions(prev => {
        const newSet = new Set(prev);
        newSet.delete(sessionIdAtStart);
        return newSet;
      });
    }
  };

  const deleteSession = async (sessionId: string) => {
    if (!confirm('Delete this conversation?')) return;

    try {
      await supabase.from('chat_messages').delete().eq('session_id', sessionId);
      await supabase.from('chat_sessions').delete().eq('id', sessionId);

      setSessions(prev => prev.filter(s => s.id !== sessionId));

      if (currentSession?.id === sessionId) {
        setCurrentSession(null);
        setMessages([]);
        router.push('/chat-new');
      }
    } catch (error) {
      console.error('Error deleting session:', error);
    }
  };

  const handleSaveHighlight = async (text: string, pageNo?: number) => {
    if (!currentSession?.paper_id) {
      alert('Cannot save highlight: No paper associated with this chat');
      return;
    }

    setSavingHighlight(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('Please log in to save highlights');
        return;
      }

      const { error } = await supabase
        .from('saved_highlights')
        .insert({
          user_id: user.id,
          paper_id: currentSession.paper_id,
          highlighted_text: text,
          page_no: pageNo || null,
        });

      if (error) {
        console.error('Error saving highlight:', error);
        throw error;
      }

      alert('✓ Quote saved to highlights!');
    } catch (error) {
      console.error('Error saving highlight:', error);
      alert('Failed to save highlight. Please try again.');
    } finally {
      setSavingHighlight(false);
    }
  };

  const filteredSessions = sessions.filter(session => {
    // Filter by search term
    const matchesSearch = session.title.toLowerCase().includes(searchTerm.toLowerCase());

    // Filter by paper if specified
    const matchesPaper = filterPaperId ? session.paper_id === filterPaperId : true;

    return matchesSearch && matchesPaper;
  });

  return (
    <div className="fixed inset-0 z-50 flex h-screen bg-gray-900" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999 }}>
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-0'} transition-all duration-300 bg-gray-800 border-r border-gray-700 flex flex-col overflow-hidden`}>
        <div className="p-3 space-y-2">
          {filterPaperId && (
            <button
              onClick={createNewSession}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm bg-white hover:bg-gray-100 text-black rounded-lg transition-colors"
            >
              <Plus className="h-4 w-4" />
              New chat
            </button>
          )}
        </div>

        {!filterPaperId && (
          <div className="px-3 pb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search"
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-600 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-white"
              />
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-2">
          {filteredSessions.map((session) => (
            <div
              key={session.id}
              className={`group mb-1 rounded-lg cursor-pointer transition-colors ${
                currentSession?.id === session.id
                  ? 'bg-gray-700'
                  : 'hover:bg-gray-700'
              }`}
              onClick={() => {
                if (currentSession?.id !== session.id) {
                  setCurrentSession(session);
                  loadSession(session.id);
                  router.push(`/chat-new?session=${session.id}`);
                }
              }}
            >
              <div className="flex items-center justify-between px-3 py-2">
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-white truncate font-medium">
                    {session.title}
                  </div>
                  {session.paper && (
                    <div className="text-xs text-gray-400 truncate mt-0.5">
                      📄 {session.paper.title}
                    </div>
                  )}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteSession(session.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-600 rounded transition-opacity"
                >
                  <Trash2 className="h-3 w-3 text-gray-400" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700 bg-gray-900">
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push('/')}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-white" />
            </button>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            >
              {sidebarOpen ? <X className="h-5 w-5 text-white" /> : <Menu className="h-5 w-5 text-white" />}
            </button>
          </div>
          <div className="text-sm font-medium text-white">
            {currentSession?.title || 'ThinkFolio'}
          </div>
          <div className="flex items-center gap-2">
            {currentSession && (
              <ExportChatButton
                sessionId={currentSession.id}
                sessionTitle={currentSession.title}
                paperTitle={currentSession.paper?.title}
                sessionDate={currentSession.created_at}
                messages={messages}
              />
            )}
          </div>
        </div>

        {loadingSession ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : currentSession ? (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto">
              <div className="max-w-5xl mx-auto px-6 py-4">
                {messages.map((message) => (
                  <div key={message.id} className="mb-8">
                    {message.role === 'user' ? (
                      <div className="flex justify-end">
                        <div className="max-w-lg">
                          <div className="bg-blue-600 text-white rounded-xl px-3 py-2 shadow-md">
                            <div className="whitespace-pre-wrap text-sm leading-relaxed">
                              {message.content}
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-start">
                        <div className="w-full max-w-4xl">
                          <div className="bg-transparent text-gray-100 rounded-lg px-2 py-3">
                            <HighlightableText
                              text={message.content}
                              messageId={message.id}
                              paperId={currentSession?.paper_id || undefined}
                              onSave={handleSaveHighlight}
                              className="whitespace-pre-wrap text-sm leading-relaxed"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {currentSession && loadingSessions.has(currentSession.id) && (
                  <div className="mb-8">
                    <div className="flex justify-start">
                      <div className="w-full max-w-4xl">
                        <div className="bg-transparent text-gray-100 rounded-lg px-2 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                            <span className="text-xs text-gray-400 ml-2">Thinking...</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Input Area */}
            <div className="border-t border-gray-700 bg-gray-900">
              <div className="max-w-5xl mx-auto px-6 py-4">
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                    placeholder="Message ThinkFolio..."
                    disabled={currentSession ? loadingSessions.has(currentSession.id) : false}
                    className="flex-1 px-4 py-3 border border-gray-600 rounded-lg bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white disabled:opacity-50"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!input.trim() || (currentSession ? loadingSessions.has(currentSession.id) : false)}
                    className="px-4 py-3 bg-white hover:bg-gray-100 disabled:bg-gray-600 text-black rounded-lg transition-colors disabled:cursor-not-allowed"
                  >
                    {currentSession && loadingSessions.has(currentSession.id) ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Send className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center max-w-md">
              <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="h-8 w-8 text-gray-400" />
              </div>
              <h2 className="text-xl font-semibold text-white mb-2">
                How can I help you today?
              </h2>
              <p className="text-gray-400 mb-6">
                Start a new conversation or select an existing one from the sidebar.
              </p>
              {filterPaperId && (
                <button
                  onClick={createNewSession}
                  className="px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Start new document chat
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ChatNewPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <ChatNewPageContent />
    </Suspense>
  );
}