import { createServerClientSSR } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/utils/auth'
import { successResponse, errorResponse, handleError } from '@/lib/utils/api-response'
import { NextRequest } from 'next/server'
import { MESSAGES_PER_PAGE } from '@/lib/constants'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    const { id: sessionId } = await params
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || String(MESSAGES_PER_PAGE))
    const offset = (page - 1) * limit

    const supabase = await createServerClientSSR()

    // Verify session belongs to user
    const { data: session, error: sessionError } = await supabase
      .from('chat_sessions')
      .select('id')
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .single()

    if (sessionError || !session) {
      return errorResponse('Session not found', 404)
    }

    // Get messages with citations
    const { data: messages, count, error } = await supabase
      .from('chat_messages')
      .select(`
        *,
        message_citations (
          id,
          chunk_id,
          score,
          page_no
        )
      `, { count: 'exact' })
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })
      .range(offset, offset + limit - 1)

    if (error) {
      throw error
    }

    return successResponse({
      messages,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    })
  } catch (error) {
    return handleError(error)
  }
}