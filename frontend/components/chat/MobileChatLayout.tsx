"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { MobileChatView } from "./MobileChatView";
import { MobilePdfView } from "./MobilePdfView";
import { MessageSquare, X, ChevronDown, Trash2, Plus, Search } from "lucide-react";
import { STYLE_CLASSES } from "@/lib/constants/ui";

interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  created_at: string;
  session_id: string;
  metadata?: {
    is_loading?: boolean;
    is_system_summary?: boolean;
  };
}

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

interface MobileChatLayoutProps {
  sessions: ChatSession[];
  currentSession: ChatSession | null;
  filterPaperId: string | null;
  messages: Message[];
  input: string;
  onInputChange: (value: string) => void;
  onSendMessage: () => void;
  isMessageLoading: boolean;
  loadingSession: boolean;
  onSessionSelect: (session: ChatSession) => void;
  onSessionDelete: (sessionId: string) => void;
  onNewSession: () => void;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  pdfUrl: string | null;
  pdfLoading: boolean;
  processingStatus: "pending" | "processing" | "completed" | "failed" | null;
  processingError: string | null;
  onBack: () => void;
}

export function MobileChatLayout({
  sessions,
  currentSession,
  filterPaperId,
  messages,
  input,
  onInputChange,
  onSendMessage,
  isMessageLoading,
  loadingSession,
  onSessionSelect,
  onSessionDelete,
  onNewSession,
  searchTerm,
  onSearchChange,
  pdfUrl,
  pdfLoading,
  processingStatus,
  processingError,
  onBack,
}: MobileChatLayoutProps) {
  const [chatOpen, setChatOpen] = useState(false);
  const [sessionSelectorOpen, setSessionSelectorOpen] = useState(false);
  const chatPanelRef = useRef<HTMLDivElement>(null);
  const sessionSelectorRef = useRef<HTMLDivElement>(null);
  const sessionButtonRef = useRef<HTMLButtonElement>(null);

  // Count actual messages (exclude loading and system summaries)
  const actualMessageCount = messages.filter(
    m => !m.metadata?.is_loading && !m.metadata?.is_system_summary
  ).length;

  // Filter sessions for current paper
  const filteredSessions = sessions.filter(session => {
    const matchesSearch = session.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPaper = filterPaperId ? session.paper_id === filterPaperId : true;
    return matchesSearch && matchesPaper;
  });

  const handleSessionSelect = useCallback((session: ChatSession) => {
    onSessionSelect(session);
    setSessionSelectorOpen(false);
  }, [onSessionSelect]);

  const toggleChat = useCallback(() => {
    setChatOpen(prev => !prev);
    setSessionSelectorOpen(false);
  }, []);

  // Close chat panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (chatOpen && chatPanelRef.current && !chatPanelRef.current.contains(e.target as Node)) {
        // Check if click is on the chat bubble
        const bubble = document.getElementById('chat-bubble');
        if (bubble && bubble.contains(e.target as Node)) return;
        setChatOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [chatOpen]);

  // Close session selector when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (sessionSelectorOpen) {
        const clickedInsideSelector = sessionSelectorRef.current?.contains(e.target as Node);
        const clickedOnButton = sessionButtonRef.current?.contains(e.target as Node);
        if (!clickedInsideSelector && !clickedOnButton) {
          setSessionSelectorOpen(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [sessionSelectorOpen]);

  return (
    <div className="relative flex flex-col h-full">
      {/* PDF View - Full Screen (Default) */}
      <MobilePdfView
        pdfUrl={pdfUrl}
        isLoading={pdfLoading}
        processingStatus={processingStatus}
        processingError={processingError}
        onBack={onBack}
        onChatOpen={toggleChat}
        messageCount={actualMessageCount}
      />

      {/* Chat Panel - Slide up overlay */}
      {chatOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/30 backdrop-blur-sm">
          <div
            ref={chatPanelRef}
            className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm rounded-t-2xl shadow-2xl flex flex-col animate-slide-up"
            style={{ height: '85vh', maxHeight: '85vh' }}
          >
            {/* Chat Panel Header */}
            <div className="flex-shrink-0 px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {/* Session Selector */}
                <button
                  ref={sessionButtonRef}
                  onClick={() => setSessionSelectorOpen(!sessionSelectorOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors max-w-[200px]"
                >
                  <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {currentSession?.title || 'Select Chat'}
                  </span>
                  <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${sessionSelectorOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* New Chat Button */}
                {filterPaperId && (
                  <button
                    onClick={onNewSession}
                    className={`p-2 rounded-lg transition-colors ${STYLE_CLASSES.activeItem} hover:bg-sky-100 dark:hover:bg-sky-900/40`}
                  >
                    <Plus className={`h-5 w-5 ${STYLE_CLASSES.textThemePrimary}`} />
                  </button>
                )}
              </div>

              {/* Close Button */}
              <button
                onClick={toggleChat}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            {/* Session Selector Dropdown */}
            {sessionSelectorOpen && (
              <div
                ref={sessionSelectorRef}
                className="absolute top-16 left-4 right-4 z-10 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 max-h-[300px] overflow-hidden flex flex-col"
              >
                {/* Search */}
                <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => onSearchChange(e.target.value)}
                      placeholder="Search chats..."
                      className={`w-full pl-9 pr-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 ${STYLE_CLASSES.inputFocusRing}`}
                    />
                  </div>
                </div>

                {/* Session List */}
                <div className="flex-1 overflow-y-auto">
                  {filteredSessions.length === 0 ? (
                    <div className="p-4 text-center text-gray-500 dark:text-gray-400 text-sm">
                      No chats found
                    </div>
                  ) : (
                    filteredSessions.map((session) => (
                      <div
                        key={session.id}
                        className={`flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-100 dark:border-gray-700 last:border-0 ${
                          currentSession?.id === session.id ? STYLE_CLASSES.activeItem : ''
                        }`}
                        onClick={() => handleSessionSelect(session)}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {session.title}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            {new Date(session.updated_at).toLocaleDateString()}
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSessionDelete(session.id);
                          }}
                          className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                        >
                          <Trash2 className="h-4 w-4 text-gray-400 hover:text-red-500" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Chat Content */}
            <div className="flex-1 overflow-hidden">
              {currentSession ? (
                <MobileChatView
                  messages={messages}
                  input={input}
                  onInputChange={onInputChange}
                  onSendMessage={onSendMessage}
                  isLoading={isMessageLoading}
                  loadingSession={loadingSession}
                  sessionTitle={currentSession.title}
                  hideHeader={true}
                />
              ) : (
                <div className="flex-1 flex items-center justify-center px-6 h-full">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                      <MessageSquare className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">
                      Select a chat or start a new one
                    </p>
                    {filterPaperId && (
                      <button
                        onClick={onNewSession}
                        className={`px-4 py-2 text-white rounded-lg text-sm font-medium transition-colors ${STYLE_CLASSES.buttonPrimary}`}
                      >
                        Start New Chat
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
