"use client";

import { useState } from "react";
import { FileText, Download, Trash2, Clock, ChevronDown, ChevronRight } from "lucide-react";

interface Session {
  id: string;
  title: string;
  timestamp: Date;
  messageCount: number;
}

const mockSessions: Session[] = [
  {
    id: "1",
    title: "Understanding self-attention",
    timestamp: new Date(),
    messageCount: 12,
  },
  {
    id: "2",
    title: "Multi-head attention explained",
    timestamp: new Date(Date.now() - 86400000),
    messageCount: 8,
  },
  {
    id: "3",
    title: "Positional encoding questions",
    timestamp: new Date(Date.now() - 172800000),
    messageCount: 5,
  },
];

export function PaperSidebar({ paperId }: { paperId: string }) {
  const [isSessionsExpanded, setIsSessionsExpanded] = useState(true);

  return (
    <div className="h-full bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-start gap-3">
          <FileText className="h-5 w-5 text-gray-400 mt-1" />
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Attention Is All You Need
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Vaswani et al. • 15 pages
            </p>
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <button className="flex-1 px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors flex items-center justify-center gap-2">
            <Download className="h-4 w-4" />
            <span>Download</span>
          </button>
          <button className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          <button
            onClick={() => setIsSessionsExpanded(!isSessionsExpanded)}
            className="flex items-center justify-between w-full text-left text-sm font-medium text-gray-700 dark:text-gray-300 mb-3"
          >
            <span>Chat Sessions</span>
            {isSessionsExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>

          {isSessionsExpanded && (
            <div className="space-y-2">
              {mockSessions.map((session) => (
                <button
                  key={session.id}
                  className="w-full text-left p-3 rounded-lg bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                >
                  <p className="font-medium text-sm text-gray-900 dark:text-white truncate">
                    {session.title}
                  </p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                      <Clock className="h-3 w-3" />
                      {session.timestamp.toLocaleDateString()}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {session.messageCount} messages
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <button className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors text-sm font-medium">
            New Chat Session
          </button>
        </div>
      </div>
    </div>
  );
}