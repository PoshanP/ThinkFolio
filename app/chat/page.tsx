"use client";

import { useState } from "react";
import Link from "next/link";
import { MessageSquare, FileText, Clock, Search, ChevronRight } from "lucide-react";

const mockSessions = [
  {
    id: "1",
    paperId: "1",
    paperTitle: "Attention Is All You Need",
    sessionTitle: "Understanding self-attention mechanism",
    lastMessage: "The self-attention mechanism allows the model to attend to different positions...",
    timestamp: new Date(),
    messageCount: 12,
  },
  {
    id: "2",
    paperId: "1",
    paperTitle: "Attention Is All You Need",
    sessionTitle: "Multi-head attention explained",
    lastMessage: "Multi-head attention allows the model to jointly attend to information...",
    timestamp: new Date(Date.now() - 86400000),
    messageCount: 8,
  },
  {
    id: "3",
    paperId: "2",
    paperTitle: "BERT: Pre-training of Deep Bidirectional Transformers",
    sessionTitle: "BERT architecture discussion",
    lastMessage: "BERT uses bidirectional training to achieve deeper understanding...",
    timestamp: new Date(Date.now() - 172800000),
    messageCount: 15,
  },
  {
    id: "4",
    paperId: "3",
    paperTitle: "GPT-3: Language Models are Few-Shot Learners",
    sessionTitle: "Few-shot learning capabilities",
    lastMessage: "GPT-3 demonstrates that scaling up language models greatly improves...",
    timestamp: new Date(Date.now() - 259200000),
    messageCount: 10,
  },
];

export default function ChatSessionsPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredSessions = mockSessions.filter(session =>
    session.sessionTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
    session.paperTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
    session.lastMessage.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const groupedSessions = filteredSessions.reduce((groups, session) => {
    const date = session.timestamp.toDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(session);
    return groups;
  }, {} as Record<string, typeof mockSessions>);

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
                  href={`/chat/${session.paperId}`}
                  className="block bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:border-indigo-500 dark:hover:border-indigo-400 transition-colors group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <MessageSquare className="h-5 w-5 text-gray-400 mt-1" />
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                          {session.sessionTitle}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <FileText className="h-3 w-3 text-gray-400" />
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {session.paperTitle}
                          </p>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 line-clamp-2">
                          {session.lastMessage}
                        </p>
                        <div className="flex items-center gap-4 mt-3">
                          <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-500">
                            <Clock className="h-3 w-3" />
                            {session.timestamp.toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-500">
                            {session.messageCount} messages
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