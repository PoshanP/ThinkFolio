"use client";

import { useEffect, useState } from "react";
import { UploadSection } from "@/frontend/components/UploadSection";
import { RecentPapers } from "@/frontend/components/RecentPapers";
import { StatsCard } from "@/frontend/components/StatsCard";
import { FileText, MessageSquare, Clock, BookOpen } from "lucide-react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function Home() {
  const [stats, setStats] = useState({
    papers: 0,
    chats: 0,
    pages: 0,
    hours: 0,
    papersTrend: "+0",
    chatsTrend: "+0",
    pagesTrend: "+0",
    hoursTrend: "+0"
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      // Fetch papers count
      const { count: papersCount } = await supabase
        .from('papers')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      // Fetch chat sessions count
      const { count: chatsCount } = await supabase
        .from('chat_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      // Fetch total pages
      const { data: papersData } = await supabase
        .from('papers')
        .select('page_count')
        .eq('user_id', user.id);

      const totalPages = papersData?.reduce((sum, paper) => sum + (paper.page_count || 0), 0) || 0;

      // Calculate hours saved (estimate: 1 page = 3 minutes reading)
      const hoursSaved = Math.round((totalPages * 3) / 60);

      // Get trends (papers added in last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { count: recentPapers } = await supabase
        .from('papers')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', sevenDaysAgo.toISOString());

      const { count: recentChats } = await supabase
        .from('chat_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', sevenDaysAgo.toISOString());

      setStats({
        papers: papersCount || 0,
        chats: chatsCount || 0,
        pages: totalPages,
        hours: hoursSaved,
        papersTrend: `+${recentPapers || 0}`,
        chatsTrend: `+${recentChats || 0}`,
        pagesTrend: `+${Math.round(totalPages * 0.1)}`, // Estimate 10% recent
        hoursTrend: `+${Math.round(hoursSaved * 0.1)}`
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

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
              value={loading ? "..." : stats.papers.toString()}
              icon={<FileText className="h-4 w-4" />}
              trend={stats.papersTrend}
            />
            <StatsCard
              title="Chats"
              value={loading ? "..." : stats.chats.toString()}
              icon={<MessageSquare className="h-4 w-4" />}
              trend={stats.chatsTrend}
            />
            <StatsCard
              title="Hours Saved"
              value={loading ? "..." : stats.hours.toString()}
              icon={<Clock className="h-4 w-4" />}
              trend={stats.hoursTrend}
            />
            <StatsCard
              title="Pages"
              value={loading ? "..." : stats.pages.toString()}
              icon={<BookOpen className="h-4 w-4" />}
              trend={stats.pagesTrend}
            />
          </div>

          <RecentPapers />
        </div>

        <div className="space-y-6">
          <UploadSection />
        </div>
      </div>
    </div>
  );
}