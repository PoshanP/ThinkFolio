"use client";

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import { getSupabaseClient } from "@/lib/hooks/useSupabase";

interface DashboardStats {
  papers: number;
  chats: number;
  pages: number;
  nextReads: number;
  papersTrend: string;
  chatsTrend: string;
  pagesTrend: string;
  nextReadsTrend: string;
}

interface StatsContextType {
  stats: DashboardStats | null;
  loading: boolean;
  refreshStats: () => Promise<void>;
}

const defaultStats: DashboardStats = {
  papers: 0,
  chats: 0,
  pages: 0,
  nextReads: 0,
  papersTrend: "+0",
  chatsTrend: "+0",
  pagesTrend: "+0",
  nextReadsTrend: "+0",
};

const StatsContext = createContext<StatsContextType>({
  stats: null,
  loading: true,
  refreshStats: async () => {},
});

export function StatsProvider({ children }: { children: ReactNode }) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    const supabase = getSupabaseClient();

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setStats(defaultStats);
        setLoading(false);
        return;
      }

      const [papersData, chatsData, papersWithPages, nextReadsData] = await Promise.all([
        supabase.from('papers').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('chat_sessions').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('papers').select('page_count').eq('user_id', user.id),
        supabase.from('papers').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('is_next_read', true)
      ]);

      const totalPages = papersWithPages.data?.reduce((sum, paper) => sum + (paper.page_count || 0), 0) || 0;
      const nextReadsCount = nextReadsData.count || 0;

      // Get trends (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const [recentPapers, recentChats] = await Promise.all([
        supabase.from('papers').select('*', { count: 'exact', head: true })
          .eq('user_id', user.id).gte('created_at', sevenDaysAgo.toISOString()),
        supabase.from('chat_sessions').select('*', { count: 'exact', head: true })
          .eq('user_id', user.id).gte('created_at', sevenDaysAgo.toISOString())
      ]);

      setStats({
        papers: papersData.count || 0,
        chats: chatsData.count || 0,
        pages: totalPages,
        nextReads: nextReadsCount,
        papersTrend: `+${recentPapers.count || 0}`,
        chatsTrend: `+${recentChats.count || 0}`,
        pagesTrend: `+${Math.round(totalPages * 0.1)}`,
        nextReadsTrend: `${nextReadsCount}`
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      setStats(defaultStats);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshStats = useCallback(async () => {
    // Don't set loading to true for refreshes to avoid UI flicker
    await fetchStats();
  }, [fetchStats]);

  // Initial fetch
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return (
    <StatsContext.Provider value={{ stats, loading, refreshStats }}>
      {children}
    </StatsContext.Provider>
  );
}

export function useStats() {
  const context = useContext(StatsContext);
  if (!context) {
    throw new Error('useStats must be used within a StatsProvider');
  }
  return context;
}

// Export a standalone refresh function for use outside of React components
let refreshStatsCallback: (() => Promise<void>) | null = null;

export function setRefreshStatsCallback(callback: () => Promise<void>) {
  refreshStatsCallback = callback;
}

export async function refreshStatsGlobal() {
  if (refreshStatsCallback) {
    await refreshStatsCallback();
  }
}
