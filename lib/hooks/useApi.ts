import useSWR from 'swr';
import { getSupabaseClient } from '@/lib/hooks/useSupabase';
import { useEffect, useState } from 'react';

const supabase = getSupabaseClient();

// Type definitions
interface DashboardStats {
  papers: number;
  chats: number;
  pages: number;
  hours: number;
  papersTrend: string;
  chatsTrend: string;
  pagesTrend: string;
  hoursTrend: string;
}

export interface Paper {
  id: string;
  title: string;
  source: string;
  page_count: number;
  created_at: string;
  updated_at: string;
  storage_path: string | null;
  user_id: string;
  chat_count: number;
  status: string;
  is_favorite: boolean;
  is_next_read: boolean;
  processing_status: 'pending' | 'processing' | 'completed' | 'failed';
  processing_error: string | null;
}

interface ProfileData {
  user: { id: string; email?: string; created_at: string };
  profile: { id: string; email: string | null; name: string | null; theme_preference: string | null; created_at: string; updated_at: string } | null;
  stats: {
    papers: number;
    chats: number;
    joinedDate: string;
  };
}

// Typed fetchers for SWR
const dashboardStatsFetcher = async (key: string): Promise<DashboardStats> => {
  const userId = key.split('|')[1];
  return fetchDashboardStats(userId);
};

const papersFetcher = async (key: string): Promise<Paper[]> => {
  const userId = key.split('|')[1];
  return fetchPapers(userId);
};

const profileDataFetcher = async (key: string): Promise<ProfileData> => {
  const userId = key.split('|')[1];
  return fetchProfileData(userId);
};

const recentReadsFetcher = async (key: string): Promise<Paper[]> => {
  const userId = key.split('|')[1];
  return fetchRecentReads(userId);
};

// Dashboard stats fetcher
async function fetchDashboardStats(userId: string): Promise<DashboardStats> {
  const [papersData, chatsData, papersWithPages] = await Promise.all([
    supabase.from('papers').select('*', { count: 'exact', head: true }).eq('user_id', userId),
    supabase.from('chat_sessions').select('*', { count: 'exact', head: true }).eq('user_id', userId),
    supabase.from('papers').select('page_count').eq('user_id', userId)
  ]);

  const totalPages = papersWithPages.data?.reduce((sum, paper) => sum + (paper.page_count || 0), 0) || 0;
  const hoursSaved = Math.round((totalPages * 3) / 60);

  // Get trends (last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const [recentPapers, recentChats] = await Promise.all([
    supabase.from('papers').select('*', { count: 'exact', head: true })
      .eq('user_id', userId).gte('created_at', sevenDaysAgo.toISOString()),
    supabase.from('chat_sessions').select('*', { count: 'exact', head: true })
      .eq('user_id', userId).gte('created_at', sevenDaysAgo.toISOString())
  ]);

  return {
    papers: papersData.count || 0,
    chats: chatsData.count || 0,
    pages: totalPages,
    hours: hoursSaved,
    papersTrend: `+${recentPapers.count || 0}`,
    chatsTrend: `+${recentChats.count || 0}`,
    pagesTrend: `+${Math.round(totalPages * 0.1)}`,
    hoursTrend: `+${Math.round(hoursSaved * 0.1)}`
  };
}

// Profile data fetcher
async function fetchProfileData(userId: string): Promise<ProfileData> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  const [papersCount, chatsCount] = await Promise.all([
    supabase.from('papers').select('*', { count: 'exact', head: true }).eq('user_id', userId),
    supabase.from('chat_sessions').select('*', { count: 'exact', head: true }).eq('user_id', userId)
  ]);

  return {
    user,
    profile,
    stats: {
      papers: papersCount.count || 0,
      chats: chatsCount.count || 0,
      joinedDate: new Date(user.created_at).toLocaleDateString()
    }
  };
}



// Papers fetcher
async function fetchPapers(userId: string): Promise<Paper[]> {
  // Define a type for raw paper data from the database
  type RawPaper = {
    id: string;
    user_id: string;
    title: string;
    source: string;
    storage_path: string | null;
    page_count: number;
    created_at: string;
    updated_at: string;
    is_next_read: boolean;
    processing_status: 'pending' | 'processing' | 'completed' | 'failed';
    processing_error: string | null;
    document_processing_status?: Array<{ status: string }>;
  };

  const [{ data: papersData, error }, favoritesResult] = await Promise.all([
    supabase
      .from('papers')
      .select(`
        *,
        document_processing_status (status)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false }),
    supabase
      .from('paper_favorites')
      .select('paper_id')
      .eq('user_id', userId)
  ]);

  let papersResult: RawPaper[] | null = papersData as RawPaper[] | null;
  if (error) {
    if (error.message?.includes('document_processing_status')) {
      console.warn('document_processing_status table missing, retrying without status join');
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('papers')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (fallbackError) throw fallbackError;
      papersResult = fallbackData as RawPaper[] | null;
    } else {
      throw error;
    }
  }

  const favoritesData = favoritesResult?.data || [];
  if (favoritesResult?.error) {
    console.warn('Favorites table not available, continuing without favorites:', favoritesResult.error.message);
  }

  const favoriteIds = new Set(favoritesData.map(fav => fav.paper_id));

  // Get chat counts for each paper
  const papersWithChatCounts = await Promise.all(
    (papersResult || []).map(async (paper) => {
      const { count } = await supabase
        .from('chat_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('paper_id', paper.id);

      return {
        ...paper,
        chat_count: count || 0,
        status: paper.document_processing_status?.[0]?.status || 'completed',
        is_favorite: favoriteIds.has(paper.id),
        is_next_read: paper.is_next_read ?? false,
        processing_status: paper.processing_status ?? 'completed',
        processing_error: paper.processing_error ?? null
      };
    })
  );

  return papersWithChatCounts;
}

// Recent reads fetcher - papers with chat activity in the last 7 days
async function fetchRecentReads(userId: string): Promise<Paper[]> {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  // Get chat sessions from the last 7 days with their paper IDs
  const { data: recentSessions, error: sessionsError } = await supabase
    .from('chat_sessions')
    .select('paper_id, updated_at')
    .eq('user_id', userId)
    .gte('updated_at', sevenDaysAgo.toISOString())
    .order('updated_at', { ascending: false });

  if (sessionsError) {
    console.error('Error fetching recent sessions:', sessionsError);
    return [];
  }

  if (!recentSessions || recentSessions.length === 0) {
    return [];
  }

  // Get unique paper IDs, maintaining order by most recent activity
  const paperIdMap = new Map<string, string>();
  recentSessions.forEach(session => {
    if (session.paper_id && !paperIdMap.has(session.paper_id)) {
      paperIdMap.set(session.paper_id, session.updated_at);
    }
  });
  const uniquePaperIds = Array.from(paperIdMap.keys());

  // Fetch paper details (exclude next_read papers)
  const { data: papersData, error: papersError } = await supabase
    .from('papers')
    .select('*')
    .in('id', uniquePaperIds)
    .eq('is_next_read', false);

  if (papersError || !papersData) {
    console.error('Error fetching papers:', papersError);
    return [];
  }

  // Get favorites
  const { data: favoritesData } = await supabase
    .from('paper_favorites')
    .select('paper_id')
    .eq('user_id', userId);

  const favoriteIds = new Set((favoritesData || []).map(fav => fav.paper_id));

  // Get chat counts and build final result
  const papersWithDetails = await Promise.all(
    papersData.map(async (paper) => {
      const { count } = await supabase
        .from('chat_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('paper_id', paper.id);

      return {
        ...paper,
        chat_count: count || 0,
        status: 'completed',
        is_favorite: favoriteIds.has(paper.id),
        is_next_read: paper.is_next_read ?? false,
        processing_status: paper.processing_status ?? 'completed',
        processing_error: paper.processing_error ?? null,
        last_read_at: paperIdMap.get(paper.id)
      };
    })
  );

  // Sort by last read time (most recent first)
  papersWithDetails.sort((a, b) => {
    const timeA = a.last_read_at ? new Date(a.last_read_at).getTime() : 0;
    const timeB = b.last_read_at ? new Date(b.last_read_at).getTime() : 0;
    return timeB - timeA;
  });

  return papersWithDetails;
}

// Custom hooks
export function useDashboardStats() {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
    };
    getUser();
  }, []);

  return useSWR<DashboardStats>(
    userId ? `dashboard-stats|${userId}` : null,
    dashboardStatsFetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      revalidateIfStale: false,
      dedupingInterval: 60000, // 1 minute
      onError: (error) => {
        if (error?.message?.includes('JWT') || error?.message?.includes('auth')) {
          setUserId(null);
        }
      }
    }
  );
}

export function useProfileData() {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
    };
    getUser();
  }, []);

  return useSWR<ProfileData>(
    userId ? `profile-data|${userId}` : null,
    profileDataFetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      revalidateIfStale: false,
      dedupingInterval: 300000, // 5 minutes
      onError: (error) => {
        if (error?.message?.includes('JWT') || error?.message?.includes('auth')) {
          setUserId(null);
        }
      }
    }
  );
}



export function usePapers() {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
    };
    getUser();
  }, []);

  return useSWR<Paper[]>(
    userId ? `papers|${userId}` : null,
    papersFetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      revalidateIfStale: false,
      dedupingInterval: 120000, // 2 minutes
      onError: (error) => {
        if (error?.message?.includes('JWT') || error?.message?.includes('auth')) {
          setUserId(null);
        }
      }
    }
  );
}

export function useRecentReads() {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
    };
    getUser();
  }, []);

  return useSWR<Paper[]>(
    userId ? `recent-reads|${userId}` : null,
    recentReadsFetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      revalidateIfStale: false,
      dedupingInterval: 60000, // 1 minute
      onError: (error) => {
        if (error?.message?.includes('JWT') || error?.message?.includes('auth')) {
          setUserId(null);
        }
      }
    }
  );
}

