import { createServerClientSSR } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/utils/auth'
import { CreateSessionSchema } from '@/lib/types'
import { successResponse, errorResponse, handleError } from '@/lib/utils/api-response'
import { NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    const validatedData = CreateSessionSchema.parse(body)

    const supabase = await createServerClientSSR()

    // Verify paper belongs to user
    const { data: paper, error: paperError } = await supabase
      .from('papers')
      .select('id, title')
      .eq('id', validatedData.paperId)
      .eq('user_id', user.id)
      .single()

    if (paperError || !paper) {
      return errorResponse('Paper not found', 404)
    }

    // Create chat session
    const { data: session, error: sessionError } = await supabase
      .from('chat_sessions')
      .insert({
        user_id: user.id,
        paper_id: validatedData.paperId,
        title: validatedData.title || `Chat about ${(paper as any).title}`,
      } as any)
      .select()
      .single()

    if (sessionError) {
      throw sessionError
    }

    return successResponse(session, 201)
  } catch (error) {
    return handleError(error)
  }
}