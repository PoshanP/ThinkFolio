import { createServerClientSSR } from '@/lib/supabase/server'
import { getRAGAgent } from '@/lib/rag/agent'
import { requireAuth } from '@/lib/utils/auth'
import { ChatMessageSchema } from '@/lib/types'
import { successResponse, errorResponse, handleError } from '@/lib/utils/api-response'
import { NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    const validatedData = ChatMessageSchema.parse(body)

    const supabase = await createServerClientSSR()

    // Verify session belongs to user
    const { data: session, error: sessionError } = await supabase
      .from('chat_sessions')
      .select('id, paper_id')
      .eq('id', validatedData.sessionId)
      .eq('user_id', user.id)
      .single()

    if (sessionError || !session) {
      return errorResponse('Session not found', 404)
    }

    const ragAgent = getRAGAgent()
    const result = await ragAgent.query(
      validatedData.content,
      user.id,
      validatedData.sessionId,
      session.paper_id || undefined
    )

    const { data: latestMessages, error: latestMessagesError } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('session_id', validatedData.sessionId)
      .in('role', ['user', 'assistant'])
      .order('created_at', { ascending: false })
      .limit(4)

    if (latestMessagesError) {
      throw latestMessagesError
    }

    const userMessage =
      latestMessages?.find((message: any) => (
        message.role === 'user' && message.content === validatedData.content
      )) ||
      latestMessages?.find((message: any) => message.role === 'user') ||
      null

    const assistantMessage =
      latestMessages?.find((message: any) => message.role === 'assistant') ||
      null

    return successResponse({
      userMessage,
      assistantMessage,
      answer: result.answer,
      sources: result.sources,
      citations: result.citations,
      queryTime: result.queryTime,
      sessionId: result.sessionId,
    })
  } catch (error) {
    return handleError(error)
  }
}
