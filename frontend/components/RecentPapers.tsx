"use client";

import Link from "next/link";
import { FileText, Calendar, MessageSquare, ChevronRight, Clock } from "lucide-react";

const mockPapers = [
  {
    id: 1,
    title: "Attention Is All You Need",
    authors: "Vaswani et al.",
    uploadedAt: "2 hours ago",
    pageCount: 15,
    chatCount: 8,
    status: "processed"
  },
  {
    id: 2,
    title: "BERT: Pre-training of Deep Bidirectional Transformers",
    authors: "Devlin et al.",
    uploadedAt: "5 hours ago",
    pageCount: 16,
    chatCount: 12,
    status: "processed"
  },
  {
    id: 3,
    title: "GPT-3: Language Models are Few-Shot Learners",
    authors: "Brown et al.",
    uploadedAt: "1 day ago",
    pageCount: 75,
    chatCount: 5,
    status: "processing"
  },
  {
    id: 4,
    title: "ResNet: Deep Residual Learning for Image Recognition",
    authors: "He et al.",
    uploadedAt: "2 days ago",
    pageCount: 12,
    chatCount: 3,
    status: "processed"
  },
];

export function RecentPapers() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Recent Papers
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Your latest research papers and chat sessions
          </p>
        </div>
        <Link
          href="/papers"
          className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1 text-sm font-medium"
        >
          <span>View All</span>
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {mockPapers.map((paper) => (
          <Link
            key={paper.id}
            href={`/chat/${paper.id}`}
            className="block px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3 flex-1">
                <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                  <FileText className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 truncate">
                        {paper.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {paper.authors}
                      </p>
                    </div>
                    {paper.status === "processing" && (
                      <span className="ml-2 px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 rounded-full">
                        Processing
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                      <Clock className="h-3 w-3" />
                      {paper.uploadedAt}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {paper.pageCount} pages
                    </span>
                    <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                      <MessageSquare className="h-3 w-3" />
                      {paper.chatCount} chats
                    </span>
                  </div>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 mt-3" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}