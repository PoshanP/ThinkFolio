"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Loader2, Bot, User, Copy, Check } from "lucide-react";
import { CitationBadge } from "./CitationBadge";
import { createClient } from "@supabase/supabase-js";
import { useRouter, useSearchParams } from "next/navigation";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  citations?: { page: number; text: string }[];
  created_at: string;
  session_id?: string;
  metadata?: any;
}

export function ChatInterface({ paperId }: { paperId: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [paperTitle, setPaperTitle] = useState<string>("");
  const [isInitializing, setIsInitializing] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const initializeChat = async () => {
      setIsInitializing(true);
      const sessionFromUrl = searchParams.get('session');
      await loadPaperDetails();

      if (sessionFromUrl) {
        setSessionId(sessionFromUrl);
        await loadSession(sessionFromUrl);
      } else {
        await createNewSession();
      }
      setIsInitializing(false);
    };

    initializeChat();
  }, [paperId]);

  const loadPaperDetails = async () => {
    try {
      const { data: paper, error } = await supabase
        .from('papers')
        .select('title')
        .eq('id', paperId)
        .single();

      if (error) throw error;
      setPaperTitle(paper.title);
    } catch (error) {
      console.error('Error loading paper details:', error);
    }
  };

  const createNewSession = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }

      const { data: session, error } = await supabase
        .from('chat_sessions')
        .insert({
          paper_id: paperId,
          user_id: user.id,
          title: 'New Chat',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      setSessionId(session.id);

      // Don't add a welcome message here - it will be loaded from the database
      // or added when loading the session
    } catch (error) {
      console.error('Error creating session:', error);
    }
  };

  const loadSession = async (sessionId: string) => {
    try {
      const { data: messagesData, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Transform the messages to the correct format
      const formattedMessages = (messagesData || []).map(msg => ({
        id: msg.id,
        role: msg.role as 'user' | 'assistant' | 'system',
        content: msg.content,
        citations: msg.metadata?.citations,
        created_at: msg.created_at,
        session_id: sessionId,
        metadata: msg.metadata
      }));

      // Set the messages - the summary should already be in the database
      if (formattedMessages.length > 0) {
        setMessages(formattedMessages);
        console.log('Loaded messages:', formattedMessages);
      } else {
        // No messages yet - this shouldn't happen if upload worked correctly
        console.log('No messages found for session:', sessionId);
        const welcomeMessage: Message = {
          id: Date.now().toString(),
          role: "assistant",
          content: `📄 **Paper Loaded**\n\nProcessing your paper. Please wait a moment for the summary to be generated...`,
          created_at: new Date().toISOString(),
          session_id: sessionId
        };
        setMessages([welcomeMessage]);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading || !sessionId) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/auth/login');
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      created_at: new Date().toISOString(),
      session_id: sessionId
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // Save user message to database
      await supabase
        .from('chat_messages')
        .insert({
          session_id: sessionId,
          role: 'user',
          content: input,
          user_id: user.id,
          created_at: new Date().toISOString()
        });

      // Update session title if this is the first message
      if (messages.length <= 1) {
        await supabase
          .from('chat_sessions')
          .update({
            title: input.slice(0, 100),
            updated_at: new Date().toISOString()
          })
          .eq('id', sessionId);
      }

      // Call RAG API
      const response = await fetch('/api/rag/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: input,
          paper_id: paperId,
          session_id: sessionId,
        }),
      });

      if (!response.ok) throw new Error('Failed to get response');

      const data = await response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.answer,
        citations: data.sources?.map((source: any) => ({
          page: source.metadata?.page || 0,
          text: source.content
        })),
        created_at: new Date().toISOString(),
        session_id: sessionId
      };

      // Save assistant message to database
      await supabase
        .from('chat_messages')
        .insert({
          session_id: sessionId,
          role: 'assistant',
          content: data.answer,
          user_id: user.id,
          created_at: new Date().toISOString(),
          metadata: { citations: assistantMessage.citations }
        });

      // Update session's updated_at timestamp
      await supabase
        .from('chat_sessions')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', sessionId);

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      // Fallback response on error
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "I apologize, but I encountered an error processing your request. Please try again.",
        created_at: new Date().toISOString()
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (text: string, messageId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(messageId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (isInitializing) {
    return (
      <div className="flex flex-col h-full bg-white dark:bg-gray-900">
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Loading chat session...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div className="max-w-3xl mx-auto space-y-6">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`flex max-w-[80%] ${
                  message.role === "user" ? "flex-row-reverse" : "flex-row"
                } gap-3`}
              >
                <div
                  className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    message.role === "user"
                      ? "bg-indigo-600 text-white"
                      : message.metadata?.is_system_summary
                      ? "bg-green-500 text-white"
                      : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                  }`}
                >
                  {message.role === "user" ? (
                    <User className="h-4 w-4" />
                  ) : (
                    <Bot className="h-4 w-4" />
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <div
                    className={`rounded-lg px-4 py-3 ${
                      message.role === "user"
                        ? "bg-indigo-600 text-white"
                        : message.metadata?.is_system_summary
                        ? "bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border border-green-200 dark:border-green-800 text-gray-900 dark:text-gray-100"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    }`}
                  >
                    <div
                      className="whitespace-pre-wrap"
                      dangerouslySetInnerHTML={{
                        __html: message.content.replace(
                          /\*\*(.*?)\*\*/g,
                          '<strong>$1</strong>'
                        ).replace(
                          /\n/g,
                          '<br />'
                        )
                      }}
                    />
                    {message.citations && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {message.citations.map((citation, idx) => (
                          <CitationBadge
                            key={idx}
                            page={citation.page}
                            text={citation.text}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>
                      {new Date(message.created_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    {message.role === "assistant" && (
                      <button
                        onClick={() => handleCopy(message.content, message.id)}
                        className="hover:text-gray-700 dark:hover:text-gray-300"
                      >
                        {copiedId === message.id ? (
                          <Check className="h-3 w-3" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                  <Bot className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                </div>
                <div className="bg-gray-100 dark:bg-gray-800 rounded-lg px-4 py-3">
                  <Loader2 className="h-4 w-4 animate-spin text-gray-600 dark:text-gray-400" />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSend()}
              placeholder="Ask a question about the paper..."
              className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <Send className="h-5 w-5" />
              <span className="hidden sm:inline">Send</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}