import { createServerClientSSR } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/utils/auth'
import { successResponse, handleError } from '@/lib/utils/api-response'
import { NextRequest } from 'next/server'
import { PAPERS_PER_PAGE } from '@/lib/constants'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || String(PAPERS_PER_PAGE))
    const offset = (page - 1) * limit

    const supabase = await createServerClientSSR()

    const { data: papers, count, error } = await supabase
      .from('papers')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      throw error
    }

    return successResponse({
      papers,
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