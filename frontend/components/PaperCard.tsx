import Link from "next/link";
import { FileText, Calendar, MessageSquare, Download, Trash2, ChevronRight } from "lucide-react";

interface PaperCardProps {
  paper: {
    id: string;
    title: string;
    authors: string;
    abstract: string;
    uploadedAt: Date;
    pageCount: number;
    chatCount: number;
    tags: string[];
  };
  viewMode: "grid" | "list";
}

export function PaperCard({ paper, viewMode }: PaperCardProps) {
  if (viewMode === "list") {
    return (
      <Link
        href={`/chat/${paper.id}`}
        className="block bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:border-indigo-500 dark:hover:border-indigo-400 transition-colors group"
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-start gap-3">
              <FileText className="h-5 w-5 text-gray-400 mt-1" />
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                  {paper.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {paper.authors}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 line-clamp-2">
                  {paper.abstract}
                </p>
                <div className="flex flex-wrap gap-2 mt-3">
                  {paper.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded text-xs"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-4 mt-3">
                  <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-500">
                    <Calendar className="h-3 w-3" />
                    {paper.uploadedAt.toLocaleDateString()}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-500">
                    {paper.pageCount} pages
                  </span>
                  <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-500">
                    <MessageSquare className="h-3 w-3" />
                    {paper.chatCount} chats
                  </span>
                </div>
              </div>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400" />
        </div>
      </Link>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-indigo-500 dark:hover:border-indigo-400 transition-all hover:shadow-lg group">
      <Link href={`/chat/${paper.id}`} className="block p-6">
        <div className="flex items-start gap-3 mb-3">
          <FileText className="h-6 w-6 text-gray-400" />
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 line-clamp-2">
              {paper.title}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {paper.authors}
            </p>
          </div>
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3 mb-3">
          {paper.abstract}
        </p>

        <div className="flex flex-wrap gap-2 mb-3">
          {paper.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded text-xs"
            >
              {tag}
            </span>
          ))}
        </div>

        <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-500">
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {paper.uploadedAt.toLocaleDateString()}
          </span>
          <span>{paper.pageCount} pages</span>
          <span className="flex items-center gap-1">
            <MessageSquare className="h-3 w-3" />
            {paper.chatCount}
          </span>
        </div>
      </Link>

      <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-3 flex justify-between">
        <button className="text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
          <Download className="h-4 w-4" />
        </button>
        <button className="text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}