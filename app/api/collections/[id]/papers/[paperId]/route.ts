import { createServerClientSSR } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/utils/auth'
import { successResponse, errorResponse, handleError } from '@/lib/utils/api-response'
import { NextRequest } from 'next/server'

// DELETE /api/collections/[id]/papers/[paperId] - Remove a paper from a collection
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; paperId: string }> }
) {
  try {
    const user = await requireAuth()
    const { id: collectionId, paperId } = await params
    const supabase = await createServerClientSSR()

    // Verify collection belongs to user
    const { data: collection, error: collectionError } = await supabase
      .from('collections')
      .select('id')
      .eq('id', collectionId)
      .eq('user_id', user.id)
      .single()

    if (collectionError || !collection) {
      return errorResponse('Collection not found', 404)
    }

    // Verify paper belongs to user
    const { data: paper, error: paperError } = await supabase
      .from('papers')
      .select('id')
      .eq('id', paperId)
      .eq('user_id', user.id)
      .single()

    if (paperError || !paper) {
      return errorResponse('Paper not found', 404)
    }

    // Remove the paper from the collection
    const { error: deleteError } = await supabase
      .from('paper_collections')
      .delete()
      .eq('collection_id', collectionId)
      .eq('paper_id', paperId)

    if (deleteError) {
      throw deleteError
    }

    return successResponse({ message: 'Paper removed from collection' })
  } catch (error) {
    return handleError(error)
  }
}
