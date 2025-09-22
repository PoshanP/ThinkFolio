import { NextRequest } from 'next/server'
import { createServerClientSSR } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/utils/auth'
import { successResponse, handleError } from '@/lib/utils/api-response'
import { createRequestLogger } from '@/lib/logger'

const logger = createRequestLogger('UserStats')

interface UserStats {
  totalPapers: number
  totalChats: number
  totalMessages: number
  totalPages: number
  hoursUsed: number
  avgChatLength: number
  recentActivity: {
    papersThisWeek: number
    chatsThisWeek: number
    messagesThisWeek: number
  }
  topPapers: Array<{
    id: string
    title: string
    chatCount: number
    messageCount: number
  }>
  activityTimeline: Array<{
    date: string
    papers: number
    chats: number
    messages: number
  }>
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()
    const supabase = await createServerClientSSR()

    const url = new URL(request.url)
    const timeframe = url.searchParams.get('timeframe') || '30' // days

    const timeframeDate = new Date()
    timeframeDate.setDate(timeframeDate.getDate() - parseInt(timeframe))

    // Get all user papers
    const { data: papers, error: papersError } = await supabase
      .from('papers')
      .select('id, title, page_count, created_at')
      .eq('user_id', user.id)

    if (papersError) throw papersError

    // Get all user chat sessions
    const { data: sessions, error: sessionsError } = await supabase
      .from('chat_sessions')
      .select('id, paper_id, created_at, updated_at')
      .eq('user_id', user.id)

    if (sessionsError) throw sessionsError

    // Get all messages from user sessions
    const sessionIds = (sessions || []).map((s: any) => s.id)
    let messages: any[] = []

    if (sessionIds.length > 0) {
      const { data: messageData, error: messagesError } = await supabase
        .from('chat_messages')
        .select('id, session_id, role, created_at')
        .in('session_id', sessionIds)

      if (messagesError) throw messagesError
      messages = messageData || []
    }

    // Calculate basic stats
    const totalPapers = (papers || []).length
    const totalChats = (sessions || []).length
    const totalMessages = messages.length
    const totalPages = (papers || []).reduce((sum, paper: any) => sum + (paper.page_count || 0), 0)

    // Estimate hours used (assuming 2 minutes per message exchange)
    const hoursUsed = Math.round((totalMessages * 2) / 60 * 10) / 10

    // Calculate average chat length
    const avgChatLength = totalChats > 0 ? Math.round(totalMessages / totalChats * 10) / 10 : 0

    // Recent activity (last week)
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

    const papersThisWeek = (papers || []).filter((p: any) => new Date(p.created_at) > oneWeekAgo).length
    const chatsThisWeek = (sessions || []).filter((s: any) => new Date(s.created_at) > oneWeekAgo).length
    const messagesThisWeek = messages.filter((m: any) => new Date(m.created_at) > oneWeekAgo).length

    // Top papers by activity
    const paperStats = (papers || []).map((paper: any) => {
      const paperSessions = (sessions || []).filter((s: any) => s.paper_id === paper.id)
      const paperMessages = messages.filter((m: any) =>
        paperSessions.some((s: any) => s.id === m.session_id)
      )

      return {
        id: paper.id,
        title: paper.title,
        chatCount: paperSessions.length,
        messageCount: paperMessages.length
      }
    })

    const topPapers = paperStats
      .sort((a, b) => (b.chatCount + b.messageCount) - (a.chatCount + a.messageCount))
      .slice(0, 5)

    // Activity timeline (last 30 days)
    const activityTimeline = []
    for (let i = parseInt(timeframe); i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]

      const dayPapers = (papers || []).filter((p: any) =>
        p.created_at.split('T')[0] === dateStr
      ).length

      const daySessions = (sessions || []).filter((s: any) =>
        s.created_at.split('T')[0] === dateStr
      ).length

      const dayMessages = messages.filter((m: any) =>
        m.created_at.split('T')[0] === dateStr
      ).length

      activityTimeline.push({
        date: dateStr,
        papers: dayPapers,
        chats: daySessions,
        messages: dayMessages
      })
    }

    const stats: UserStats = {
      totalPapers,
      totalChats,
      totalMessages,
      totalPages,
      hoursUsed,
      avgChatLength,
      recentActivity: {
        papersThisWeek,
        chatsThisWeek,
        messagesThisWeek
      },
      topPapers,
      activityTimeline
    }

    logger.info({
      userId: user.id,
      totalPapers,
      totalChats,
      totalMessages,
      timeframe
    }, 'Retrieved user stats')

    return successResponse(stats)

  } catch (error) {
    logger.error(error, 'Failed to get user stats')
    return handleError(error)
  }
}