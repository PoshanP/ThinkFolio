import { createServerClientSSR } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/utils/auth'
import { successResponse, errorResponse, handleError } from '@/lib/utils/api-response'
import { NextRequest } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    const { id } = await params
    const supabase = await createServerClientSSR()

    const { data: session, error } = await supabase
      .from('chat_sessions')
      .select(`
        *,
        papers!inner (
          id,
          title,
          page_count
        )
      `)
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (error) {
      throw error
    }

    if (!session) {
      return errorResponse('Session not found', 404)
    }

    return successResponse(session)
  } catch (error) {
    return handleError(error)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    const { id } = await params
    const supabase = await createServerClientSSR()

    const { error } = await supabase
      .from('chat_sessions')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      throw error
    }

    return successResponse({ message: 'Session deleted successfully' })
  } catch (error) {
    return handleError(error)
  }
}