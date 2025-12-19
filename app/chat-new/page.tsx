"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSupabase } from "@/lib/hooks/useSupabase";
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
  ArrowLeft,
  PanelLeftClose,
  PanelLeft
} from "lucide-react";
import { ExportChatButton } from "@/frontend/components/ExportChatButton";
import { useStats } from "@/lib/contexts/StatsContext";
import { useConfirm } from "@/lib/contexts/ConfirmContext";

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
  const supabase = useSupabase();
  const { confirmDeleteConversation } = useConfirm();
  const { refreshStats } = useStats();
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
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [chatOpen, setChatOpen] = useState(true);
  const [chatWidth, setChatWidth] = useState(550);
  const [isResizing, setIsResizing] = useState(false);
  const [pdfBaseUrl, setPdfBaseUrl] = useState<string | null>(null);
  const [processingStatus, setProcessingStatus] = useState<'pending' | 'processing' | 'completed' | 'failed' | null>(null);
  const [processingError, setProcessingError] = useState<string | null>(null);
  const [generatingSummary, setGeneratingSummary] = useState(false);
  const pdfLoadedRef = useRef<boolean>(false);
  const resizeRef = useRef<HTMLDivElement>(null);
  const initialPaperIdRef = useRef<string | null>(null);
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
      // Store initial paper ID for PDF loading (only once)
      if (!initialPaperIdRef.current) {
        initialPaperIdRef.current = paperId;
      }
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
      setChatOpen(true);
    } catch (error) {
      console.error('Error creating session:', error);
    }
  };

  const loadSession = async (sessionId: string) => {
    if (currentSession?.id === sessionId) return;

    // Check cache first - if cached, use immediately without loading state
    if (messagesCache[sessionId]) {
      setMessages(messagesCache[sessionId]);
      // Still fetch session data for currentSession but don't show loading
      const { data: session } = await supabase
        .from('chat_sessions')
        .select(`*, papers (title)`)
        .eq('id', sessionId)
        .single();
      if (session) setCurrentSession(session);
      return;
    }

    // Not cached - show loading
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
    const confirmed = await confirmDeleteConversation();
    if (!confirmed) return;

    try {
      await supabase.from('chat_messages').delete().eq('session_id', sessionId);
      await supabase.from('chat_sessions').delete().eq('id', sessionId);

      setSessions(prev => prev.filter(s => s.id !== sessionId));
      // Refresh stats in background
      refreshStats();

      if (currentSession?.id === sessionId) {
        setCurrentSession(null);
        setMessages([]);
        router.push('/chat-new');
      }
    } catch (error) {
      console.error('Error deleting session:', error);
    }
  };

  const filteredSessions = sessions.filter(session => {
    // Filter by search term
    const matchesSearch = session.title.toLowerCase().includes(searchTerm.toLowerCase());

    // Filter by paper if specified
    const matchesPaper = filterPaperId ? session.paper_id === filterPaperId : true;

    return matchesSearch && matchesPaper;
  });

  // Load PDF preview only once on initial mount, with processing status check
  useEffect(() => {
    const loadPreview = async () => {
      // Only load once
      if (pdfLoadedRef.current) return;

      const paperId = initialPaperIdRef.current || searchParams.get('paper');
      if (!paperId) {
        return;
      }

      pdfLoadedRef.current = true;
      setPreviewLoading(true);

      try {
        // First check processing status
        const { data: paper, error } = await supabase
          .from('papers')
          .select('storage_path, processing_status, processing_error')
          .eq('id', paperId)
          .single();

        if (error) {
          console.error('Paper fetch error:', error);
          return;
        }

        // Check if paper has chunks (means it's been processed regardless of status)
        const { count: chunkCount } = await supabase
          .from('paper_chunks')
          .select('*', { count: 'exact', head: true })
          .eq('paper_id', paperId);

        // If chunks exist, paper is processed - override any stale status
        const hasChunks = (chunkCount || 0) > 0;
        const status = hasChunks ? 'completed' : (paper?.processing_status || 'completed');
        setProcessingStatus(status);

        if (status === 'pending' || status === 'processing') {
          // Poll for completion
          const pollInterval = setInterval(async () => {
            // Check both status and chunks
            const [{ data: updatedPaper }, { count: updatedChunkCount }] = await Promise.all([
              supabase
                .from('papers')
                .select('processing_status, processing_error, storage_path')
                .eq('id', paperId)
                .single(),
              supabase
                .from('paper_chunks')
                .select('*', { count: 'exact', head: true })
                .eq('paper_id', paperId)
            ]);

            const chunksExist = (updatedChunkCount || 0) > 0;
            const effectiveStatus = chunksExist ? 'completed' : (updatedPaper?.processing_status || null);

            if (updatedPaper) {
              setProcessingStatus(effectiveStatus);

              if (effectiveStatus === 'completed') {
                clearInterval(pollInterval);
                setProcessingError(null);
                // Load PDF after processing complete
                if (updatedPaper.storage_path) {
                  const { data: signed } = await supabase.storage
                    .from('papers')
                    .createSignedUrl(updatedPaper.storage_path, 60 * 60);
                  if (signed?.signedUrl) {
                    setPdfBaseUrl(signed.signedUrl);
                  }
                }
                setPreviewLoading(false);

                // Generate summary now that processing is done
                const sessionId = searchParams.get('session');
                const { data: { user } } = await supabase.auth.getUser();
                if (sessionId && user) {
                  generateSummary(paperId, sessionId, user.id);
                }
              } else if (effectiveStatus === 'failed') {
                clearInterval(pollInterval);
                setProcessingError(updatedPaper.processing_error || 'Processing failed');
                setPreviewLoading(false);
              }
            }
          }, 2000); // Poll every 2 seconds

          // Cleanup interval on unmount
          return () => clearInterval(pollInterval);
        }

        if (status === 'failed') {
          setProcessingError(paper.processing_error || 'Processing failed');
          setPreviewLoading(false);
          return;
        }

        // Processing is complete, load PDF
        if (!paper?.storage_path) {
          console.error('No storage_path for paper');
          setPreviewLoading(false);
          return;
        }

        const { data: signed, error: signedError } = await supabase.storage
          .from('papers')
          .createSignedUrl(paper.storage_path, 60 * 60);

        if (signedError || !signed?.signedUrl) {
          console.error('Signed URL error:', signedError);
          return;
        }
        console.log('PDF URL obtained:', signed.signedUrl.substring(0, 100) + '...');

        setPdfBaseUrl(signed.signedUrl);

        // Generate summary for new sessions with already-processed papers
        const sessionId = searchParams.get('session');
        const { data: { user } } = await supabase.auth.getUser();
        if (sessionId && user && paperId) {
          // Check if session already has messages (don't regenerate summary)
          const { count } = await supabase
            .from('chat_messages')
            .select('*', { count: 'exact', head: true })
            .eq('session_id', sessionId);

          if (count === 0) {
            // New session, generate summary
            generateSummary(paperId, sessionId, user.id);
          }
        }
      } catch (err) {
        console.error('Error loading PDF preview:', err);
        setPdfBaseUrl(null);
      } finally {
        if (processingStatus === 'completed' || processingStatus === 'failed' || processingStatus === null) {
          setPreviewLoading(false);
        }
      }
    };

    loadPreview();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Generate summary for the paper
  const generateSummary = async (paperId: string, sessionId: string, userId: string) => {
    setGeneratingSummary(true);

    // Add placeholder loading message
    const loadingMessage: Message = {
      id: `loading-summary-${Date.now()}`,
      content: '',
      role: 'assistant',
      created_at: new Date().toISOString(),
      session_id: sessionId,
      metadata: { is_loading: true, is_system_summary: true }
    };
    setMessages(prev => [...prev, loadingMessage]);

    try {
      const summaryResponse = await fetch('/api/rag/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: "Please provide a comprehensive summary of this paper including its main contributions, methodology, and key findings.",
          paperId: paperId,
          sessionId: sessionId,
          userId: userId,
        }),
      });

      if (summaryResponse.ok) {
        const summaryData = await summaryResponse.json();
        await supabase
          .from('chat_messages')
          .insert({
            session_id: sessionId,
            role: 'assistant',
            content: summaryData.answer,
            user_id: userId,
            created_at: new Date().toISOString(),
            metadata: {
              citations: summaryData.sources?.map((source: { metadata?: { page?: number }; content: string }) => ({
                page: source.metadata?.page || 0,
                text: source.content
              })),
              is_system_summary: true
            }
          });

        // Reload messages to show the summary
        loadSession(sessionId);
      } else {
        // Remove loading message on error
        setMessages(prev => prev.filter(m => m.id !== loadingMessage.id));
      }
    } catch (err) {
      console.error('Error generating summary:', err);
      // Remove loading message on error
      setMessages(prev => prev.filter(m => !m.metadata?.is_loading));
    } finally {
      setGeneratingSummary(false);
    }
  };

  // Handle chat panel resize
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      e.preventDefault();
      const sidebarWidth = sidebarOpen ? 256 : 56;
      const newWidth = e.clientX - sidebarWidth;
      requestAnimationFrame(() => {
        setChatWidth(Math.min(Math.max(280, newWidth), 800));
      });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove, { passive: false });
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      // Prevent iframe from capturing mouse events during resize
      const iframes = document.querySelectorAll('iframe');
      iframes.forEach(iframe => {
        (iframe as HTMLElement).style.pointerEvents = 'none';
      });
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      const iframes = document.querySelectorAll('iframe');
      iframes.forEach(iframe => {
        (iframe as HTMLElement).style.pointerEvents = '';
      });
    };
  }, [isResizing, sidebarOpen]);

  return (
    <div className="fixed inset-0 z-50 flex h-screen bg-white dark:bg-gray-900" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999 }}>
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-14'} transition-all duration-300 bg-gray-100 dark:bg-gray-800 border-r border-gray-300 dark:border-gray-700 flex flex-col`}>
        {/* Header */}
        <div className={`p-3 border-b border-gray-200 dark:border-gray-700 flex ${sidebarOpen ? 'items-center justify-between' : 'flex-col items-center gap-2'}`}>
          {sidebarOpen ? (
            <>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => router.back()}
                  className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <ArrowLeft className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                </button>
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Conversations</h2>
              </div>
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <PanelLeftClose className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => router.back()}
                className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              </button>
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <PanelLeft className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              </button>
            </>
          )}
        </div>

        {/* Search - only when expanded */}
        {sidebarOpen && !filterPaperId && (
          <div className="px-3 py-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-600 dark:text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search"
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-600 dark:placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-900 dark:focus:ring-white"
              />
            </div>
          </div>
        )}

        {/* Session list */}
        <div className={`flex-1 overflow-y-auto pt-2 ${sidebarOpen ? 'px-2' : 'px-1'}`}>
          {filteredSessions.map((session, index) => (
            <div
              key={session.id}
              className={`group mb-1 rounded-lg cursor-pointer transition-colors ${
                currentSession?.id === session.id
                  ? 'bg-gray-200 dark:bg-gray-700'
                  : 'hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
              onClick={() => {
                if (currentSession?.id !== session.id) {
                  setCurrentSession(session);
                  loadSession(session.id);
                }
                setChatOpen(true);
              }}
              title={!sidebarOpen ? session.title : undefined}
            >
              {sidebarOpen ? (
                <div className="flex items-center justify-between px-3 py-2">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-gray-900 dark:text-white truncate font-medium">
                      {session.title}
                    </div>
                    {session.paper && (
                      <div className="text-xs text-gray-600 dark:text-gray-400 truncate mt-0.5">
                        📄 {session.paper.title}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteSession(session.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-300 dark:hover:bg-gray-600 rounded transition-opacity"
                  >
                    <Trash2 className="h-3 w-3 text-gray-600 dark:text-gray-400" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-center py-2">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-medium ${
                    currentSession?.id === session.id
                      ? 'bg-gray-300 dark:bg-gray-600 text-gray-900 dark:text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}>
                    {session.title.charAt(0).toUpperCase()}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* New chat button at bottom */}
        {filterPaperId && (
          <div className={`p-2 border-t border-gray-200 dark:border-gray-700 ${sidebarOpen ? 'px-3' : 'px-1'}`}>
            <button
              onClick={createNewSession}
              className={`flex items-center justify-center gap-2 text-sm bg-white hover:bg-gray-200 text-gray-900 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white rounded-lg transition-colors ${
                sidebarOpen ? 'w-full px-3 py-2' : 'w-10 h-10 mx-auto'
              }`}
              title={!sidebarOpen ? 'New chat' : undefined}
            >
              <Plus className="h-4 w-4" />
              {sidebarOpen && <span>New chat</span>}
            </button>
          </div>
        )}
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {currentSession ? (
            <div className="flex-1 flex bg-gray-50 dark:bg-gray-900 overflow-hidden">
              {/* Chat panel */}
              <div
                className="flex-shrink-0 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col transition-[margin] duration-300 ease-in-out"
                style={{
                  width: chatWidth,
                  marginLeft: chatOpen ? 0 : -chatWidth
                }}
              >
                <div className="flex justify-end items-center gap-1 px-2 py-2 flex-shrink-0">
                  <ExportChatButton
                    sessionId={currentSession.id}
                    sessionTitle={currentSession.title}
                    paperTitle={currentSession.paper?.title}
                    sessionDate={currentSession.created_at}
                    messages={messages}
                  />
                  <button
                    onClick={() => setChatOpen(false)}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto">
                  {loadingSession ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-gray-400 dark:text-gray-500 text-sm">Start conversing with your document</p>
                    </div>
                  ) : (
                  <div className="px-3 py-3 space-y-6">
                    {messages.map((message) => (
                      <div key={message.id} className="w-full">
                        {message.role === 'user' ? (
                          <div className="flex justify-end">
                            <div className="max-w-[320px]">
                              <div className="bg-blue-600 text-white rounded-xl px-3 py-2 shadow-md">
                                <div className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="flex justify-start">
                            <div className="w-full">
                              {message.metadata?.is_loading ? (
                                <div className="px-2 py-1">
                                  <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    <span>Generating summary...</span>
                                  </div>
                                </div>
                              ) : (
                                <div className="text-gray-900 dark:text-gray-100 px-2 py-1 whitespace-pre-wrap text-sm leading-relaxed">
                                  {message.content}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                    {currentSession && loadingSessions.has(currentSession.id) && (
                      <div className="flex items-center gap-2 px-2">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                  )}
                </div>
                <div className="flex-shrink-0 border-t border-gray-200 dark:border-gray-700 p-3">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                      placeholder="Message..."
                      disabled={currentSession ? loadingSessions.has(currentSession.id) : false}
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
                    />
                    <button
                      onClick={sendMessage}
                      disabled={!input.trim() || (currentSession ? loadingSessions.has(currentSession.id) : false)}
                      className="px-3 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg disabled:opacity-50"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Resize handle - invisible, just cursor change at edge */}
              {chatOpen && (
                <div
                  ref={resizeRef}
                  onMouseDown={() => setIsResizing(true)}
                  className="w-1 cursor-col-resize flex-shrink-0 z-10"
                />
              )}

              {/* PDF viewer */}
              <div className="flex-1 bg-gray-50 dark:bg-gray-900 overflow-hidden">
                {(processingStatus === 'pending' || processingStatus === 'processing') ? (
                  <div className="h-full flex flex-col items-center justify-center text-gray-500 dark:text-gray-400 px-6">
                    <Loader2 className="h-8 w-8 animate-spin mb-4" />
                    <p className="text-sm font-medium mb-2">Processing document...</p>
                    <p className="text-xs text-center max-w-sm">
                      Your document is being analyzed. This usually takes 10-30 seconds.
                    </p>
                  </div>
                ) : processingStatus === 'failed' ? (
                  <div className="h-full flex flex-col items-center justify-center text-red-500 dark:text-red-400 px-6">
                    <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
                      <X className="h-6 w-6" />
                    </div>
                    <p className="text-sm font-medium mb-2">Processing failed</p>
                    <p className="text-xs text-center max-w-sm text-gray-500 dark:text-gray-400">
                      {processingError || 'An error occurred while processing your document.'}
                    </p>
                  </div>
                ) : previewLoading ? (
                  <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : pdfBaseUrl ? (
                  <iframe
                    src={pdfBaseUrl}
                    className="w-full h-full border-0 bg-gray-50 dark:bg-gray-900"
                    title="PDF Viewer"
                  />
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400 px-6 text-sm">
                    No PDF preview available for this chat.
                  </div>
                )}
              </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center max-w-md">
              <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="h-8 w-8 text-gray-600 dark:text-gray-400" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                How can I help you today?
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Start a new conversation or select an existing one from the sidebar.
              </p>
              {filterPaperId && (
                <button
                  onClick={createNewSession}
                  className="px-4 py-2 bg-white text-gray-900 rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600 transition-colors"
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
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white">Loading...</div>}>
      <ChatNewPageContent />
    </Suspense>
  );
}
