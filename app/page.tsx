"use client";

import { useState, useEffect } from "react";
import { UploadSection } from "@/frontend/components/UploadSection";
import { RecentPapers } from "@/frontend/components/RecentPapers";
import { StatsCard } from "@/frontend/components/StatsCard";
import { FileText, MessageSquare, Clock, BookOpen, TrendingUp } from "lucide-react";

interface DashboardStats {
  totalPapers: number;
  totalChats: number;
  totalPages: number;
  hoursUsed: number;
  recentPapersCount: number;
}

interface DashboardData {
  stats: DashboardStats;
  recentPapers: any[];
  recentSessions: any[];
}

export default function Home() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async (retryCount = 0) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/dashboard', {
        credentials: 'include', // Include cookies for authentication
        headers: {
          'Cache-Control': 'no-cache'
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          // If this is the first retry and we got unauthorized, wait a bit and try again
          // This helps with timing issues after login
          if (retryCount === 0) {
            setTimeout(() => fetchDashboardData(1), 2000);
            return;
          }
          // User not authenticated - redirect to login
          console.log('Redirecting to login due to 401');
          window.location.href = '/auth/login';
          return;
        }
        throw new Error(`Failed to fetch dashboard data: ${response.status}`);
      }

      const data = await response.json();
      setDashboardData(data.data || {
        stats: {
          totalPapers: 0,
          totalChats: 0,
          totalPages: 0,
          hoursUsed: 0,
          recentPapersCount: 0
        },
        recentPapers: [],
        recentSessions: []
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // If we're getting errors, it might be due to missing database tables
      setError('Database not set up yet. Please run the database setup first.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaperUploaded = () => {
    fetchDashboardData();
  };

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <FileText className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Error Loading Dashboard
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <button
            onClick={fetchDashboardData}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-left space-y-2 mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage your research papers and chat sessions
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatsCard
              title="Papers"
              value={isLoading ? "..." : dashboardData?.stats.totalPapers.toString() || "0"}
              icon={<FileText className="h-4 w-4" />}
              trend={dashboardData?.stats.recentPapersCount ? `+${dashboardData.stats.recentPapersCount}` : ""}
            />
            <StatsCard
              title="Chats"
              value={isLoading ? "..." : dashboardData?.stats.totalChats.toString() || "0"}
              icon={<MessageSquare className="h-4 w-4" />}
              trend=""
            />
            <StatsCard
              title="Hours Used"
              value={isLoading ? "..." : dashboardData?.stats.hoursUsed.toString() || "0"}
              icon={<Clock className="h-4 w-4" />}
              trend=""
            />
            <StatsCard
              title="Pages"
              value={isLoading ? "..." : dashboardData?.stats.totalPages.toString() || "0"}
              icon={<BookOpen className="h-4 w-4" />}
              trend=""
            />
          </div>

          <RecentPapers onRefresh={fetchDashboardData} />

          {/* Recent Sessions */}
          {dashboardData?.recentSessions && dashboardData.recentSessions.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Recent Chat Sessions
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Your latest conversations with papers
                  </p>
                </div>
                <TrendingUp className="h-5 w-5 text-gray-400" />
              </div>
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {dashboardData.recentSessions.slice(0, 3).map((session) => (
                  <div key={session.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 dark:text-white truncate">
                          {session.title}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          Paper: {session.paper_title}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                          <span className="flex items-center gap-1">
                            <MessageSquare className="h-3 w-3" />
                            {session.messageCount} messages
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(session.updated_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-1">
          <UploadSection onUploadSuccess={handlePaperUploaded} />
        </div>
      </div>
    </div>
  );
}