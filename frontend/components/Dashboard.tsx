"use client";

import { useState } from "react";
import { UploadSection } from "@/frontend/components/UploadSection";
import { RecentPapers } from "@/frontend/components/RecentPapers";
import { NextReadList } from "@/frontend/components/NextReadList";
import { ProfileDialog } from "@/frontend/components/ProfileDialog";
import { CollectionsWidget } from "@/frontend/components/collections";
import { FileText, MessageSquare, BookOpen, User, FolderOpen } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useStats } from "@/lib/contexts/StatsContext";
import { useCollections } from "@/lib/hooks/useCollections";

export function Dashboard() {
  const router = useRouter();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const { stats, loading } = useStats();
  const { data: collections, isLoading: collectionsLoading } = useCollections();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <button
            onClick={() => router.push('/')}
            className="text-left hover:opacity-80 transition-opacity"
          >
            <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">
              ThinkFolio
            </h1>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-0.5 sm:mt-1 line-clamp-1 sm:line-clamp-none">
              Reading that talks back. Think faster. Struggle less.
            </p>
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
          <Link
            href="/papers"
            prefetch={true}
            className="flex items-center space-x-2 px-3 py-2.5 text-sm bg-gray-200 hover:bg-gray-300 text-gray-800 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-300 rounded-lg transition-colors min-h-[44px]"
          >
            <FileText className="h-4 w-4" />
            <span className="hidden xs:inline">My Library</span>
          </Link>

          <button
            onClick={() => setIsProfileOpen(true)}
            className="p-2.5 bg-gray-200 hover:bg-gray-300 text-gray-800 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-300 rounded-full transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <User className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3 sm:p-4 border border-gray-300 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">
                {loading ? "..." : stats?.papers || 0}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Documents</p>
            </div>
            <FileText className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          </div>
        </div>

        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3 sm:p-4 border border-gray-300 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">
                {loading ? "..." : stats?.chats || 0}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Chats</p>
            </div>
            <MessageSquare className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          </div>
        </div>

        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3 sm:p-4 border border-gray-300 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">
                {loading ? "..." : stats?.pages || 0}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Pages</p>
            </div>
            <BookOpen className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          </div>
        </div>

        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3 sm:p-4 border border-gray-300 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">
                {collectionsLoading ? "..." : collections?.length || 0}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Collections</p>
            </div>
            <FolderOpen className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          </div>
        </div>
      </div>

      {/* Main Content Grid - Upload first on mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Sidebar - Shows first on mobile, last on desktop */}
        <div className="space-y-4 sm:space-y-6 lg:order-last">
          <CollectionsWidget />
          <UploadSection />
          <NextReadList />
        </div>

        {/* Papers Section */}
        <div className="lg:col-span-2 lg:order-first">
          <RecentPapers />
        </div>
      </div>

      {/* Powered by DevSwarm */}
      <div className="mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-gray-300 dark:border-gray-700">
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
      </div>

      {/* Profile Dialog */}
      <ProfileDialog
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />
    </div>
  );
}
