import { createServerClientSSR } from '@/lib/supabase/server'
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

    // Save user message
    const { data: userMessage, error: userMessageError } = await supabase
      .from('chat_messages')
      .insert({
        session_id: validatedData.sessionId,
        role: 'user' as const,
        content: validatedData.content,
      } as any)
      .select()
      .single()

    if (userMessageError) {
      throw userMessageError
    }

    // TODO: Implement RAG pipeline
    // 1. Retrieve relevant chunks from paper_chunks using vector similarity
    // 2. Build context with citations
    // 3. Generate response using GPT-4o-mini
    // 4. Save assistant message with citations

    // For now, return a placeholder response
    const placeholderResponse = "I'm ready to help you understand this paper! However, the RAG (Retrieval Augmented Generation) system is not yet implemented. Once it's ready, I'll be able to:\n\n1. Search through the paper content\n2. Find relevant sections to answer your question\n3. Provide accurate responses with citations\n\nPlease check back soon!"

    // Save assistant message (placeholder)
    const { data: assistantMessage, error: assistantMessageError } = await supabase
      .from('chat_messages')
      .insert({
        session_id: validatedData.sessionId,
        role: 'assistant' as const,
        content: placeholderResponse,
      } as any)
      .select()
      .single()

    if (assistantMessageError) {
      throw assistantMessageError
    }

    // Update session's updated_at timestamp
    await (supabase
      .from('chat_sessions') as any)
      .update({ updated_at: new Date().toISOString() })
      .eq('id', validatedData.sessionId)

    return successResponse({
      userMessage,
      assistantMessage,
    })
  } catch (error) {
    return handleError(error)
  }
}