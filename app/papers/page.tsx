"use client";

import { useState, useEffect } from "react";
import { PaperCard } from "@/frontend/components/PaperCard";
import { Search, Filter, Plus, Grid, List, FileText } from "lucide-react";
import Link from "next/link";

interface Paper {
  id: string;
  title: string;
  source: string;
  page_count: number;
  created_at: string;
  chatCount?: number;
}

export default function PapersPage() {
  const [papers, setPapers] = useState<Paper[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchPapers();
  }, []);

  const fetchPapers = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/papers');

      if (response.ok) {
        const data = await response.json();

        // Fetch chat count for each paper
        const papersWithChatCount = await Promise.all(
          (data.data || []).map(async (paper: Paper) => {
            try {
              const chatResponse = await fetch(`/api/chat/sessions?paperId=${paper.id}`);
              const chatData = await chatResponse.json();
              return {
                ...paper,
                chatCount: chatData.data?.length || 0
              };
            } catch {
              return { ...paper, chatCount: 0 };
            }
          })
        );

        setPapers(papersWithChatCount);
      }
    } catch (error) {
      console.error('Error fetching papers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const allSources = Array.from(new Set(papers.map(p => p.source)));

  const filteredPapers = papers.filter(paper => {
    const matchesSearch = paper.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSources = selectedSources.length === 0 ||
                          selectedSources.includes(paper.source);
    return matchesSearch && matchesSources;
  });

  const formatSourceLabel = (source: string) => {
    switch (source) {
      case 'upload': return 'Uploaded';
      case 'url': return 'From URL';
      default: return source;
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInHours = diffInMs / (1000 * 60 * 60);
    const diffInDays = diffInHours / 24;

    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} hours ago`;
    } else if (diffInDays < 7) {
      return `${Math.floor(diffInDays)} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              My Papers
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Loading your research papers...
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 animate-pulse">
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="flex justify-between">
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            My Papers
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {filteredPapers.length} research papers in your library
          </p>
        </div>
        <Link
          href="/"
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors flex items-center gap-2"
        >
          <Plus className="h-5 w-5" />
          <span>Upload Paper</span>
        </Link>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search papers by title..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
            />
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded ${
                  viewMode === "grid"
                    ? "bg-white dark:bg-gray-600 shadow-sm"
                    : "hover:bg-gray-200 dark:hover:bg-gray-600"
                } transition-colors`}
              >
                <Grid className="h-4 w-4 text-gray-700 dark:text-gray-300" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded ${
                  viewMode === "list"
                    ? "bg-white dark:bg-gray-600 shadow-sm"
                    : "hover:bg-gray-200 dark:hover:bg-gray-600"
                } transition-colors`}
              >
                <List className="h-4 w-4 text-gray-700 dark:text-gray-300" />
              </button>
            </div>
          </div>
        </div>

        {allSources.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            <span className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
              <Filter className="h-4 w-4" />
              Filter by source:
            </span>
            {allSources.map((source) => (
              <button
                key={source}
                onClick={() => {
                  setSelectedSources(prev =>
                    prev.includes(source)
                      ? prev.filter(s => s !== source)
                      : [...prev, source]
                  );
                }}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                  selectedSources.includes(source)
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                {formatSourceLabel(source)}
              </button>
            ))}
          </div>
        )}
      </div>

      {filteredPapers.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {papers.length === 0 ? 'No papers yet' : 'No papers match your search'}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {papers.length === 0
              ? 'Upload your first research paper to get started'
              : 'Try adjusting your search or filter criteria'
            }
          </p>
          {papers.length === 0 && (
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
            >
              <Plus className="h-5 w-5" />
              <span>Upload Your First Paper</span>
            </Link>
          )}
        </div>
      ) : (
        <div className={viewMode === "grid"
          ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          : "space-y-4"
        }>
          {filteredPapers.map((paper) => (
            <PaperCard
              key={paper.id}
              paper={{
                id: paper.id,
                title: paper.title,
                authors: formatSourceLabel(paper.source),
                abstract: `${paper.page_count} pages • ${formatTimeAgo(paper.created_at)}`,
                uploadedAt: new Date(paper.created_at),
                pageCount: paper.page_count,
                chatCount: paper.chatCount || 0,
                tags: [formatSourceLabel(paper.source)]
              }}
              viewMode={viewMode}
            />
          ))}
        </div>
      )}
    </div>
  );
}