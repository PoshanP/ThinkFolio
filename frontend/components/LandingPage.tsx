"use client";

import Link from "next/link";
import {
  FileText,
  MessageSquare,
  BookOpen,
  Upload,
  Sparkles,
  ArrowRight,
  CheckCircle,
  FolderOpen,
  Heart,
  Clock,
  Bookmark,
  Bot,
  BookMarked,
  Layers,
} from "lucide-react";

// Generate random stars
function generateStars(count: number) {
  const stars = [];
  for (let i = 0; i < count; i++) {
    stars.push({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      size: Math.random() * 2 + 1,
      delay: Math.random() * 3,
      duration: Math.random() * 2 + 2,
    });
  }
  return stars;
}

const stars = generateStars(400);

export function LandingPage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] relative overflow-hidden">
      {/* Starry Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {stars.map((star) => (
          <div
            key={star.id}
            className="absolute rounded-full bg-indigo-400 dark:bg-white animate-twinkle"
            style={{
              left: `${star.left}%`,
              top: `${star.top}%`,
              width: `${star.size}px`,
              height: `${star.size}px`,
              animationDelay: `${star.delay}s`,
              animationDuration: `${star.duration}s`,
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Hero Section */}
        <section className="py-12 sm:py-16 lg:py-20">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white leading-tight">
              Reading that talks back.
              <span className="block text-indigo-600 dark:text-indigo-400 mt-2">
                Think faster. Struggle less.
              </span>
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              A simplistic PDF reader where you can ask questions, organize your research,
              and get AI-powered answers with precise citations.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/auth/signup"
                className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-medium transition-colors min-h-[48px] w-full sm:w-auto"
              >
                Get Started Free
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/auth/login"
                className="flex items-center justify-center gap-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 px-6 py-3 rounded-lg font-medium transition-colors min-h-[48px] w-full sm:w-auto"
              >
                Sign In
              </Link>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-12 sm:py-16 border-t border-gray-200 dark:border-gray-700">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              How ThinkFolio Works
            </h2>
            <p className="mt-3 text-gray-600 dark:text-gray-400">
              Three simple steps to transform your research workflow
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {/* Upload Feature */}
            <div className="bg-gray-100/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 sm:p-8 border border-gray-200 dark:border-gray-700">
              <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center mb-4">
                <Upload className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                1. Upload Your Papers
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Drop your PDF research papers or paste a URL. We securely process and index your documents.
              </p>
            </div>

            {/* Chat Feature */}
            <div className="bg-gray-100/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 sm:p-8 border border-gray-200 dark:border-gray-700">
              <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center mb-4">
                <MessageSquare className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                2. Ask Questions
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Have natural conversations with your documents. Ask anything about the content.
              </p>
            </div>

            {/* Citations Feature */}
            <div className="bg-gray-100/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 sm:p-8 border border-gray-200 dark:border-gray-700">
              <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center mb-4">
                <BookOpen className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                3. Get Cited Answers
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Every answer comes with precise page citations. Verify sources instantly.
              </p>
            </div>
          </div>
        </section>

        {/* Features Grid Section */}
        <section className="py-12 sm:py-16 border-t border-gray-200 dark:border-gray-700">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              Everything You Need
            </h2>
            <p className="mt-3 text-gray-600 dark:text-gray-400">
              Powerful features to organize and interact with your research
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Collections */}
            <div className="bg-gray-100/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg p-5 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                  <FolderOpen className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Collections</h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Create your own collections to organize papers by topic, project, or any way you prefer.
              </p>
            </div>

            {/* PDF Reader */}
            <div className="bg-gray-100/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg p-5 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                  <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white">PDF Reader</h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Clean, simplistic PDF reader with a side panel for AI chat assistance while you read.
              </p>
            </div>

            {/* AI Chat */}
            <div className="bg-gray-100/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg p-5 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                  <Bot className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white">AI Chat Helper</h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Ask questions about your paper and get intelligent answers with page references.
              </p>
            </div>

            {/* Favorites */}
            <div className="bg-gray-100/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg p-5 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                  <Heart className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Favorite Reads</h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Mark papers as favorites for quick access to your most important documents.
              </p>
            </div>

            {/* Recent Reads */}
            <div className="bg-gray-100/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg p-5 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                  <Clock className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Recent Reads</h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Quickly pick up where you left off with your recently viewed papers.
              </p>
            </div>

            {/* Bookmarks */}
            <div className="bg-gray-100/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg p-5 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center">
                  <Bookmark className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Bookmarks</h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Bookmark important sections and pages to revisit key information easily.
              </p>
            </div>

            {/* Next Read List */}
            <div className="bg-gray-100/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg p-5 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-teal-100 dark:bg-teal-900/30 rounded-lg flex items-center justify-center">
                  <BookMarked className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Reading List</h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Queue up papers you want to read next and never lose track of your reading goals.
              </p>
            </div>

            {/* Chat History */}
            <div className="bg-gray-100/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg p-5 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center">
                  <MessageSquare className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Chat Sessions</h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Save and revisit your AI conversations. All chat history is preserved.
              </p>
            </div>

            {/* Multiple Papers */}
            <div className="bg-gray-100/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg p-5 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-pink-100 dark:bg-pink-900/30 rounded-lg flex items-center justify-center">
                  <Layers className="h-5 w-5 text-pink-600 dark:text-pink-400" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Paper Library</h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Build your personal library with unlimited papers, all searchable and organized.
              </p>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-12 sm:py-16 border-t border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-6">
                Built for researchers who value their time
              </h2>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-600 dark:text-gray-400">
                    <strong className="text-gray-900 dark:text-white">Smart chunking</strong> — Papers are intelligently split for accurate retrieval
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-600 dark:text-gray-400">
                    <strong className="text-gray-900 dark:text-white">Secure storage</strong> — Your documents are private and encrypted
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-600 dark:text-gray-400">
                    <strong className="text-gray-900 dark:text-white">Precise citations</strong> — Every answer includes exact page numbers
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-600 dark:text-gray-400">
                    <strong className="text-gray-900 dark:text-white">Clean interface</strong> — Distraction-free reading experience
                  </span>
                </li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 backdrop-blur-sm rounded-xl p-6 sm:p-8 border border-indigo-100 dark:border-indigo-800">
              <div className="flex items-center gap-3 mb-4">
                <Sparkles className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Powered by AI
                </h3>
              </div>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                ThinkFolio uses advanced language models to understand your papers deeply and provide accurate, contextual answers with citations.
              </p>
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-500">
                <FileText className="h-4 w-4" />
                <span>Supports PDF files up to 50MB</span>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-12 sm:py-16 border-t border-gray-200 dark:border-gray-700">
          <div className="text-center bg-gray-100/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-8 sm:p-12 border border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Ready to transform your research?
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-xl mx-auto">
              Join researchers who are reading smarter, not harder.
            </p>
            <Link
              href="/auth/signup"
              className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-lg font-medium transition-colors min-h-[48px]"
            >
              Start for Free
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-8 border-t border-gray-200 dark:border-gray-700">
          <div className="text-center">
            <a
              href="https://devswarm.ai/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-2 px-4 py-3 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300 transition-colors group min-h-[44px]"
            >
              <span>Powered by</span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://cdn.prod.website-files.com/684228174606b26ec8e3e29e/684b4952707b6e17b3ef79df_Logo.png"
                alt="DevSwarm"
                className="h-5 group-hover:opacity-80 transition-opacity"
              />
            </a>
          </div>
        </footer>
      </div>
    </div>
  );
}
