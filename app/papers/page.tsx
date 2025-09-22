"use client";

import { useState } from "react";
import { PaperCard } from "@/frontend/components/PaperCard";
import { Search, Filter, Plus, Grid, List } from "lucide-react";
import Link from "next/link";

const mockPapers = [
  {
    id: "1",
    title: "Attention Is All You Need",
    authors: "Vaswani et al.",
    abstract: "The dominant sequence transduction models are based on complex recurrent or convolutional neural networks...",
    uploadedAt: new Date("2024-01-15"),
    pageCount: 15,
    chatCount: 8,
    tags: ["NLP", "Transformers", "Deep Learning"],
  },
  {
    id: "2",
    title: "BERT: Pre-training of Deep Bidirectional Transformers",
    authors: "Devlin et al.",
    abstract: "We introduce a new language representation model called BERT, which stands for Bidirectional Encoder Representations...",
    uploadedAt: new Date("2024-01-14"),
    pageCount: 16,
    chatCount: 12,
    tags: ["NLP", "Pre-training", "Language Models"],
  },
  {
    id: "3",
    title: "GPT-3: Language Models are Few-Shot Learners",
    authors: "Brown et al.",
    abstract: "Recent work has demonstrated substantial gains on many NLP tasks and benchmarks by pre-training on a large corpus...",
    uploadedAt: new Date("2024-01-13"),
    pageCount: 75,
    chatCount: 5,
    tags: ["Language Models", "Few-shot Learning", "Scaling"],
  },
  {
    id: "4",
    title: "ResNet: Deep Residual Learning for Image Recognition",
    authors: "He et al.",
    abstract: "Deeper neural networks are more difficult to train. We present a residual learning framework to ease the training...",
    uploadedAt: new Date("2024-01-12"),
    pageCount: 12,
    chatCount: 3,
    tags: ["Computer Vision", "CNNs", "ResNets"],
  },
  {
    id: "5",
    title: "Generative Adversarial Networks",
    authors: "Goodfellow et al.",
    abstract: "We propose a new framework for estimating generative models via an adversarial process...",
    uploadedAt: new Date("2024-01-11"),
    pageCount: 9,
    chatCount: 7,
    tags: ["GANs", "Generative Models", "Deep Learning"],
  },
  {
    id: "6",
    title: "YOLO: You Only Look Once",
    authors: "Redmon et al.",
    abstract: "We present YOLO, a new approach to object detection. Prior work on object detection repurposes classifiers...",
    uploadedAt: new Date("2024-01-10"),
    pageCount: 10,
    chatCount: 4,
    tags: ["Object Detection", "Computer Vision", "Real-time"],
  },
];

export default function PapersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const allTags = Array.from(new Set(mockPapers.flatMap(p => p.tags)));

  const filteredPapers = mockPapers.filter(paper => {
    const matchesSearch = paper.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          paper.authors.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTags = selectedTags.length === 0 ||
                        selectedTags.some(tag => paper.tags.includes(tag));
    return matchesSearch && matchesTags;
  });

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
              placeholder="Search papers by title or author..."
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

        <div className="flex flex-wrap gap-2 mt-4">
          <span className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
            <Filter className="h-4 w-4" />
            Filter by tags:
          </span>
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => {
                setSelectedTags(prev =>
                  prev.includes(tag)
                    ? prev.filter(t => t !== tag)
                    : [...prev, tag]
                );
              }}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                selectedTags.includes(tag)
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      <div className={viewMode === "grid"
        ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        : "space-y-4"
      }>
        {filteredPapers.map((paper) => (
          <PaperCard key={paper.id} paper={paper} viewMode={viewMode} />
        ))}
      </div>
    </div>
  );
}