import { NextRequest } from 'next/server'
import { createServerClientSSR } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/utils/auth'
import { successResponse, handleError } from '@/lib/utils/api-response'
import { createRequestLogger } from '@/lib/logger'

const logger = createRequestLogger('Dashboard')

interface DashboardData {
  stats: {
    totalPapers: number
    totalChats: number
    totalPages: number
    hoursUsed: number
    recentPapersCount: number
  }
  recentPapers: Array<{
    id: string
    title: string
    source: string
    page_count: number
    created_at: string
    chatCount: number
  }>
  recentSessions: Array<{
    id: string
    title: string
    paper_title: string
    created_at: string
    updated_at: string
    messageCount: number
  }>
}

export async function GET(_request: NextRequest) {
  try {
    const user = await requireAuth()
    const supabase = await createServerClientSSR()

    // Get user papers
    const { data: papers, error: papersError } = await supabase
      .from('papers')
      .select('id, title, source, page_count, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (papersError) throw papersError

    // Get user chat sessions with paper titles
    const { data: sessions, error: sessionsError } = await supabase
      .from('chat_sessions')
      .select(`
        id,
        title,
        created_at,
        updated_at,
        papers!inner(title)
      `)
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })

    if (sessionsError) throw sessionsError

    // Get message counts for sessions
    const sessionIds = (sessions || []).map((s: any) => s.id)
    let messageCounts: Record<string, number> = {}

    if (sessionIds.length > 0) {
      const { data: messages, error: messagesError } = await supabase
        .from('chat_messages')
        .select('session_id')
        .in('session_id', sessionIds)

      if (messagesError) throw messagesError

      // Count messages per session
      messageCounts = (messages || []).reduce((acc, msg: any) => {
        acc[msg.session_id] = (acc[msg.session_id] || 0) + 1
        return acc
      }, {} as Record<string, number>)
    }

    // Get chat counts for papers
    const paperIds = (papers || []).map((p: any) => p.id)
    let chatCounts: Record<string, number> = {}

    if (paperIds.length > 0) {
      const { data: paperSessions, error: paperSessionsError } = await supabase
        .from('chat_sessions')
        .select('paper_id')
        .in('paper_id', paperIds)

      if (paperSessionsError) throw paperSessionsError

      chatCounts = (paperSessions || []).reduce((acc, session: any) => {
        acc[session.paper_id] = (acc[session.paper_id] || 0) + 1
        return acc
      }, {} as Record<string, number>)
    }

    // Calculate basic stats
    const totalPapers = (papers || []).length
    const totalChats = (sessions || []).length
    const totalPages = (papers || []).reduce((sum, paper: any) => sum + (paper.page_count || 0), 0)
    const totalMessages = Object.values(messageCounts).reduce((sum, count) => sum + count, 0)
    const hoursUsed = Math.round((totalMessages * 2) / 60 * 10) / 10

    // Get recent papers count (last 7 days)
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
    const recentPapersCount = (papers || []).filter((p: any) => new Date(p.created_at) > oneWeekAgo).length

    // Prepare recent papers with chat counts
    const recentPapers = (papers || []).slice(0, 5).map((paper: any) => ({
      ...paper,
      chatCount: chatCounts[paper.id] || 0
    }))

    // Prepare recent sessions with message counts
    const recentSessions = (sessions || []).slice(0, 5).map((session: any) => ({
      id: session.id,
      title: session.title,
      paper_title: session.papers.title,
      created_at: session.created_at,
      updated_at: session.updated_at,
      messageCount: messageCounts[session.id] || 0
    }))

    const dashboardData: DashboardData = {
      stats: {
        totalPapers,
        totalChats,
        totalPages,
        hoursUsed,
        recentPapersCount
      },
      recentPapers,
      recentSessions
    }

    logger.info({
      userId: user.id,
      totalPapers,
      totalChats,
      totalPages
    }, 'Retrieved dashboard data')

    return successResponse(dashboardData)

  } catch (error) {
    logger.error(error, 'Failed to get dashboard data')
    return handleError(error)
  }
}