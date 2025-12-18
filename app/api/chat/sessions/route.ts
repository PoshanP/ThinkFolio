import { createServerClientSSR } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/utils/auth'
import { successResponse, handleError } from '@/lib/utils/api-response'
import { NextRequest } from 'next/server'
import { SESSIONS_PER_PAGE } from '@/lib/constants'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || String(SESSIONS_PER_PAGE))
    const paperId = searchParams.get('paperId')
    const offset = (page - 1) * limit

    const supabase = await createServerClientSSR()

    let query = supabase
      .from('chat_sessions')
      .select(`
        *,
        papers!inner (
          id,
          title
        )
      `, { count: 'exact' })
      .eq('user_id', user.id)

    if (paperId) {
      query = query.eq('paper_id', paperId)
    }

    const { data: sessions, count, error } = await query
      .order('updated_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      throw error
    }

    return successResponse({
      sessions,
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