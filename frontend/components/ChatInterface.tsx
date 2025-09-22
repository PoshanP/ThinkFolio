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

const mockMessages: Message[] = [
  {
    id: "1",
    role: "assistant",
    content: "Hello! I've loaded the paper 'Attention Is All You Need'. How can I help you understand this research?",
    timestamp: new Date(),
  },
  {
    id: "2",
    role: "user",
    content: "What is the main contribution of this paper?",
    timestamp: new Date(),
  },
  {
    id: "3",
    role: "assistant",
    content: "The main contribution of this paper is the introduction of the Transformer architecture, which relies entirely on self-attention mechanisms, dispensing with recurrence and convolutions entirely. The authors demonstrate that their model achieves state-of-the-art performance on machine translation tasks while being more parallelizable and requiring significantly less time to train.",
    citations: [
      { page: 1, text: "We propose a new simple network architecture, the Transformer, based solely on attention mechanisms" },
      { page: 2, text: "dispensing with recurrence and convolutions entirely" },
    ],
    timestamp: new Date(),
  },
];

export function ChatInterface({ paperId }: { paperId: string }) {
  const [messages, setMessages] = useState<Message[]>(mockMessages);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "This is a simulated response. In a real implementation, this would be the AI's answer based on the paper's content.",
        citations: [
          { page: 3, text: "Example citation from the paper" },
        ],
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 1500);
  };

  const handleCopy = (text: string, messageId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(messageId);
    setTimeout(() => setCopiedId(null), 2000);
  };

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
                        : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{message.content}</p>
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
                      {message.timestamp.toLocaleTimeString([], {
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