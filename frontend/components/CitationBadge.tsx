"use client";

import { useState } from "react";
import { FileText } from "lucide-react";

interface CitationBadgeProps {
  page: number;
  text: string;
}

export function CitationBadge({ page, text }: CitationBadgeProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className="relative inline-block">
      <button
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 rounded text-xs font-medium hover:bg-indigo-200 dark:hover:bg-indigo-800 transition-colors"
      >
        <FileText className="h-3 w-3" />
        <span>p.{page}</span>
      </button>

      {isHovered && (
        <div className="absolute bottom-full left-0 mb-2 w-64 p-3 bg-gray-900 text-white rounded-lg shadow-xl z-50 text-sm">
          <p className="text-xs text-gray-400 mb-1">Page {page}</p>
          <p className="text-xs leading-relaxed">{text}</p>
          <div className="absolute bottom-0 left-4 transform translate-y-1/2 rotate-45 w-2 h-2 bg-gray-900"></div>
        </div>
      )}
    </div>
  );
}