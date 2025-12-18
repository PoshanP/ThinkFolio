import useSWR from 'swr';
import { getSupabaseClient } from '@/lib/hooks/useSupabase';
import { useEffect, useState } from 'react';

const supabase = getSupabaseClient();

// Generic fetcher function for SWR
const fetcher = async (key: string) => {
  const [endpoint, userId] = key.split('|');

  switch (endpoint) {
    case 'dashboard-stats':
      return fetchDashboardStats(userId);
    case 'profile-data':
      return fetchProfileData(userId);
    case 'recent-chats':
      return fetchRecentChats(userId);
    case 'papers':
      return fetchPapers(userId);
    default:
      throw new Error(`Unknown endpoint: ${endpoint}`);
  }
};

// Dashboard stats fetcher
async function fetchDashboardStats(userId: string) {
  const [papersData, chatsData, papersWithPages] = await Promise.all([
    supabase.from('papers').select('*', { count: 'exact', head: true }).eq('user_id', userId),
    supabase.from('chat_sessions').select('*', { count: 'exact', head: true }).eq('user_id', userId),
    supabase.from('papers').select('page_count').eq('user_id', userId).returns<{ page_count: number }[]>()
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
async function fetchProfileData(userId: string) {
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

interface ChatSession {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  paper_id: string | null;
  papers: { title: string } | null;
}

// Recent chats fetcher
async function fetchRecentChats(userId: string) {
  const { data: sessions } = await supabase
    .from('chat_sessions')
    .select(`
      id,
      title,
      created_at,
      updated_at,
      paper_id,
      papers (title)
    `)
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(10)
    .returns<ChatSession[]>();

  if (!sessions?.length) return { sessions: [], messages: {} };

  // Fetch messages for top 10 sessions
  const sessionIds = sessions.map(s => s.id);
  const { data: messages } = await supabase
    .from('chat_messages')
    .select('*')
    .in('session_id', sessionIds)
    .order('created_at', { ascending: true });

  // Group messages by session
  const messagesBySession: Record<string, any[]> = {};
  (messages || []).forEach((msg: any) => {
    if (!messagesBySession[msg.session_id]) {
      messagesBySession[msg.session_id] = [];
    }
    messagesBySession[msg.session_id].push({
      id: `${msg.id}-${messagesBySession[msg.session_id].length}`,
      content: msg.content,
      role: msg.role,
      created_at: msg.created_at,
      session_id: msg.session_id,
      metadata: msg.metadata
    });
  });

  return { sessions, messages: messagesBySession };
}

interface PaperData {
  id: string;
  title: string;
  page_count: number;
  created_at: string;
  document_processing_status?: { status: string }[];
  [key: string]: any;
}

// Papers fetcher
async function fetchPapers(userId: string) {
  const { data: papersData, error } = await supabase
    .from('papers')
    .select(`
      *,
      document_processing_status (status)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .returns<PaperData[]>();

  if (error) throw error;

  // Get chat counts for each paper
  const papersWithChatCounts = await Promise.all(
    (papersData || []).map(async (paper: PaperData) => {
      const { count } = await supabase
        .from('chat_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('paper_id', paper.id);

      return {
        ...paper,
        chat_count: count || 0,
        status: paper.document_processing_status?.[0]?.status || 'completed'
      };
    })
  );

  return papersWithChatCounts;
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

  return useSWR(
    userId ? `dashboard-stats|${userId}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      revalidateIfStale: false,
      dedupingInterval: 300000, // 5 minutes
      keepPreviousData: true,
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

  return useSWR(
    userId ? `profile-data|${userId}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      revalidateIfStale: false,
      dedupingInterval: 600000, // 10 minutes
      keepPreviousData: true,
      onError: (error) => {
        if (error?.message?.includes('JWT') || error?.message?.includes('auth')) {
          setUserId(null);
        }
      }
    }
  );
}

export function useRecentChats() {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
    };
    getUser();
  }, []);

  return useSWR(
    userId ? `recent-chats|${userId}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      revalidateIfStale: false,
      dedupingInterval: 300000, // 5 minutes
      keepPreviousData: true,
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

  return useSWR(
    userId ? `papers|${userId}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      revalidateIfStale: false,
      dedupingInterval: 300000, // 5 minutes
      keepPreviousData: true,
      onError: (error) => {
        if (error?.message?.includes('JWT') || error?.message?.includes('auth')) {
          setUserId(null);
        }
      }
    }
  );
}