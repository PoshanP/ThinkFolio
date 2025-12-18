import { createServerClientSSR } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
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

    const { data: paper, error } = await supabase
      .from('papers')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (error) {
      throw error
    }

    if (!paper) {
      return errorResponse('Paper not found', 404)
    }

    return successResponse(paper)
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
    const adminClient = createAdminClient()

    // Get paper details first
    const { data: paper, error: fetchError } = await supabase
      .from('papers')
      .select('storage_path')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (fetchError) {
      throw fetchError
    }

    if (!paper) {
      return errorResponse('Paper not found', 404)
    }

    // Delete from storage if file exists
    if ((paper as any).storage_path) {
      const { error: storageError } = await adminClient.storage
        .from('papers')
        .remove([(paper as any).storage_path])

      if (storageError) {
        console.error('Storage deletion error:', storageError)
      }
    }

    // Delete paper (cascades to chunks, sessions, messages, citations)
    const { error: deleteError } = await supabase
      .from('papers')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (deleteError) {
      throw deleteError
    }

    return successResponse({ message: 'Paper deleted successfully' })
  } catch (error) {
    return handleError(error)
  }
}