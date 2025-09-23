"use client";

import { useEffect, useState } from "react";
import { UploadSection } from "@/frontend/components/UploadSection";
import { RecentPapers } from "@/frontend/components/RecentPapers";
import { StatsCard } from "@/frontend/components/StatsCard";
import { ProfileDialog } from "@/frontend/components/ProfileDialog";
import { FileText, MessageSquare, Clock, BookOpen, User, LogOut } from "lucide-react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useDashboardStats, useRecentChats } from "@/lib/hooks/useApi";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function Home() {
  const router = useRouter();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const { data: stats, error, isLoading: loading } = useDashboardStats();

  // Pre-load chat data in background
  useRecentChats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={() => router.push('/')}
            className="text-left hover:opacity-80 transition-opacity"
          >
            <h1 className="text-2xl font-semibold text-white">
              ThinkFolio
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              AI-powered document analysis and chat
            </p>
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-4">
          <Link
            href="/chat-new"
            prefetch={true}
            className="flex items-center space-x-2 px-3 py-2 text-sm bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors"
          >
            <MessageSquare className="h-4 w-4" />
            <span>Chats</span>
          </Link>

          <button
            onClick={() => setIsProfileOpen(true)}
            className="flex items-center space-x-2 px-3 py-2 text-sm bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors"
          >
            <User className="h-4 w-4" />
            <span>Account</span>
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-semibold text-white">
                {loading ? "..." : stats?.papers || 0}
              </p>
              <p className="text-xs text-gray-400">Documents</p>
            </div>
            <FileText className="h-4 w-4 text-gray-400" />
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-semibold text-white">
                {loading ? "..." : stats?.chats || 0}
              </p>
              <p className="text-xs text-gray-400">Chats</p>
            </div>
            <MessageSquare className="h-4 w-4 text-gray-400" />
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-semibold text-white">
                {loading ? "..." : stats?.hours || 0}
              </p>
              <p className="text-xs text-gray-400">Hours</p>
            </div>
            <Clock className="h-4 w-4 text-gray-400" />
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-semibold text-white">
                {loading ? "..." : stats?.pages || 0}
              </p>
              <p className="text-xs text-gray-400">Pages</p>
            </div>
            <BookOpen className="h-4 w-4 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Papers Section */}
        <div className="lg:col-span-2">
          <RecentPapers />
        </div>

        {/* Upload Section */}
        <div className="space-y-6">
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
            <h3 className="text-sm font-medium text-white mb-3">
              Upload Document
            </h3>
            <UploadSection />
          </div>
        </div>
      </div>

      {/* Powered by DevSwarm */}
      <div className="mt-12 pt-8 border-t border-gray-700">
        <div className="text-center">
          <a
            href="https://devswarm.ai/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-2 px-4 py-2 text-sm text-gray-400 hover:text-gray-300 transition-colors group"
          >
            <span>Powered by</span>
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