"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Loader2, Bot, User, Copy, Check } from "lucide-react";
import { CitationBadge } from "./CitationBadge";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: { page: number; text: string }[];
  timestamp: Date;
}

interface ChatInterfaceProps {
  paperId: string;
  sessionId?: string;
}

export function ChatInterface({ paperId, sessionId }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(sessionId || null);
  const [paperTitle, setPaperTitle] = useState<string>("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (paperId) {
      initializeChat();
    }
  }, [paperId, sessionId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const initializeChat = async () => {
    try {
      // Fetch paper details
      const paperResponse = await fetch(`/api/papers/${paperId}`);
      if (paperResponse.ok) {
        const paperData = await paperResponse.json();
        setPaperTitle(paperData.data?.title || "Unknown Paper");
      }

      // If no sessionId, create a new session
      if (!currentSessionId) {
        const sessionResponse = await fetch('/api/chat/sessions/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            paperId,
            title: `Chat with ${paperTitle || 'Paper'}`
          })
        });

        if (sessionResponse.ok) {
          const sessionData = await sessionResponse.json();
          setCurrentSessionId(sessionData.data.id);

          // Add welcome message
          const welcomeMessage: Message = {
            id: 'welcome',
            role: 'assistant',
            content: `Hello! I'm ready to help you understand this paper${paperTitle ? `: "${paperTitle}"` : ''}. Ask me anything about its content, methodology, findings, or implications!`,
            timestamp: new Date()
          };
          setMessages([welcomeMessage]);
        }
      } else {
        // Load existing messages for the session
        loadSessionMessages();
      }
    } catch (error) {
      console.error('Error initializing chat:', error);
    }
  };

  const loadSessionMessages = async () => {
    if (!currentSessionId) return;

    try {
      const response = await fetch(`/api/chat/sessions/${currentSessionId}/messages`);
      if (response.ok) {
        const data = await response.json();
        const loadedMessages = (data.data || []).map((msg: any) => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          citations: msg.citations || [],
          timestamp: new Date(msg.created_at)
        }));
        setMessages(loadedMessages);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading || !currentSessionId) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: currentSessionId,
          message: userMessage.content,
          paperId
        })
      });

      if (response.ok) {
        const data = await response.json();

        const assistantMessage: Message = {
          id: data.data.id,
          role: "assistant",
          content: data.data.content,
          citations: data.data.citations || [],
          timestamp: new Date(data.data.created_at),
        };

        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        throw new Error('Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);

      // Add error message
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "I apologize, but I encountered an error processing your message. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async (text: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(messageId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-[600px] bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white">
            Chat with Paper
          </h3>
          {paperTitle && (
            <p className="text-sm text-gray-600 dark:text-gray-400 truncate max-w-md">
              {paperTitle}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1"></span>
            Active
          </span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400 mt-8">
            <Bot className="h-12 w-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
            <p>Start a conversation about this paper</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {message.role === "assistant" && (
                <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                  <Bot className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                </div>
              )}

              <div
                className={`max-w-[70%] rounded-lg px-4 py-3 ${
                  message.role === "user"
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
                }`}
              >
                <div className="prose prose-sm max-w-none">
                  <p className="m-0 whitespace-pre-wrap">{message.content}</p>
                </div>

                {message.citations && message.citations.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {message.citations.map((citation, idx) => (
                      <CitationBadge
                        key={idx}
                        page={citation.page}
                        text={citation.text}
                      />
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs opacity-70">
                    {message.timestamp.toLocaleTimeString()}
                  </span>
                  {message.role === "assistant" && (
                    <button
                      onClick={() => copyToClipboard(message.content, message.id)}
                      className="opacity-70 hover:opacity-100 transition-opacity"
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

              {message.role === "user" && (
                <div className="w-8 h-8 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                </div>
              )}
            </div>
          ))
        )}

        {isLoading && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center">
              <Bot className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="bg-gray-100 dark:bg-gray-700 rounded-lg px-4 py-3">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-gray-600 dark:text-gray-300" />
                <span className="text-gray-600 dark:text-gray-300 text-sm">
                  Thinking...
                </span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={currentSessionId ? "Ask about this paper..." : "Loading..."}
            disabled={isLoading || !currentSessionId}
            className="flex-1 min-h-[44px] max-h-32 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 resize-none"
            rows={1}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading || !currentSessionId}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white rounded-lg transition-colors flex items-center justify-center"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}