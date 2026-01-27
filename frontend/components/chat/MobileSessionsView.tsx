"use client";

import { Plus, Trash2, Search, ArrowLeft } from "lucide-react";
import { STYLE_CLASSES } from "@/lib/constants/ui";

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

interface MobileSessionsViewProps {
  sessions: ChatSession[];
  currentSessionId: string | null;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onSessionSelect: (session: ChatSession) => void;
  onSessionDelete: (sessionId: string) => void;
  onNewSession: () => void;
  onBack: () => void;
  filterPaperId: string | null;
}

export function MobileSessionsView({
  sessions,
  currentSessionId,
  searchTerm,
  onSearchChange,
  onSessionSelect,
  onSessionDelete,
  onNewSession,
  onBack,
  filterPaperId,
}: MobileSessionsViewProps) {
  const filteredSessions = sessions.filter((session) => {
    const matchesSearch = session.title
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesPaper = filterPaperId
      ? session.paper_id === filterPaperId
      : true;
    return matchesSearch && matchesPaper;
  });

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2 -ml-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Go back"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            </button>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Conversations
            </h2>
          </div>
          {filterPaperId && (
            <button
              onClick={onNewSession}
              className={`p-2 rounded-lg text-white min-h-[44px] min-w-[44px] flex items-center justify-center ${STYLE_CLASSES.buttonPrimary}`}
              aria-label="New conversation"
            >
              <Plus className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Search */}
        {!filterPaperId && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search conversations..."
              className={`w-full pl-10 pr-4 py-3 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 ${STYLE_CLASSES.inputFocusRing} min-h-[44px]`}
            />
          </div>
        )}
      </div>

      {/* Sessions List */}
      <div className="flex-1 overflow-y-auto">
        {filteredSessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400 px-6">
            <p className="text-sm text-center">
              {searchTerm
                ? "No conversations match your search"
                : "No conversations yet"}
            </p>
            {filterPaperId && !searchTerm && (
              <button
                onClick={onNewSession}
                className={`mt-4 px-4 py-2 text-white rounded-lg text-sm font-medium min-h-[44px] ${STYLE_CLASSES.buttonPrimary}`}
              >
                Start a conversation
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {filteredSessions.map((session) => (
              <div
                key={session.id}
                className={`flex items-center px-4 py-3 cursor-pointer transition-colors ${
                  currentSessionId === session.id
                    ? STYLE_CLASSES.activeItem
                    : "hover:bg-gray-50 dark:hover:bg-gray-800"
                }`}
                onClick={() => onSessionSelect(session)}
              >
                <div className="flex-1 min-w-0">
                  <div
                    className={`text-sm font-medium truncate ${
                      currentSessionId === session.id
                        ? STYLE_CLASSES.textThemePrimary
                        : "text-gray-900 dark:text-white"
                    }`}
                  >
                    {session.title}
                  </div>
                  {session.paper && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                      {session.paper.title}
                    </div>
                  )}
                  <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    {new Date(session.updated_at).toLocaleDateString()}
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSessionDelete(session.id);
                  }}
                  className="ml-3 p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 min-h-[44px] min-w-[44px] flex items-center justify-center"
                  aria-label={`Delete ${session.title}`}
                >
                  <Trash2 className="h-4 w-4 text-gray-400 hover:text-red-500" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
