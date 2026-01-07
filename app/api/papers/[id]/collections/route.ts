import { createServerClientSSR } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/utils/auth'
import { successResponse, errorResponse, handleError } from '@/lib/utils/api-response'
import { NextRequest } from 'next/server'
import { UpdatePaperCollectionsSchema } from '@/lib/validation/collections'

// GET /api/papers/[id]/collections - Get all collections a paper belongs to
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    const { id: paperId } = await params
    const supabase = await createServerClientSSR()

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

    // Get all collection IDs for this paper
    const { data: paperCollections, error: pcError } = await supabase
      .from('paper_collections')
      .select('collection_id, added_at')
      .eq('paper_id', paperId)

    if (pcError) {
      throw pcError
    }

    if (!paperCollections || paperCollections.length === 0) {
      return successResponse([])
    }

    // Get collection details
    type PaperCollectionRow = { collection_id: string; added_at: string }
    const collectionIds = paperCollections.map((pc: PaperCollectionRow) => pc.collection_id)
    const { data: collections, error: collectionsError } = await supabase
      .from('collections')
      .select('*')
      .in('id', collectionIds)
      .eq('user_id', user.id)
      .order('display_order', { ascending: true })

    if (collectionsError) {
      throw collectionsError
    }

    // Merge collection data with added_at from junction table
    type CollectionRow = { id: string; [key: string]: unknown }
    const collectionsWithAddedAt = (collections || []).map((collection: CollectionRow) => {
      const pc = paperCollections.find((pc: PaperCollectionRow) => pc.collection_id === collection.id)
      return {
        ...collection,
        added_at: pc?.added_at,
      }
    })

    return successResponse(collectionsWithAddedAt)
  } catch (error) {
    return handleError(error)
  }
}

// POST /api/papers/[id]/collections - Replace all collection assignments for a paper
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    const { id: paperId } = await params
    const supabase = await createServerClientSSR()

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

    // Parse and validate request body
    const body = await request.json()
    const validationResult = UpdatePaperCollectionsSchema.safeParse(body)

    if (!validationResult.success) {
      const errors = validationResult.error.errors.map((e: { message: string }) => e.message).join(', ')
      return errorResponse(errors, 400)
    }

    const { collectionIds } = validationResult.data

    // Verify all collections belong to the user
    if (collectionIds.length > 0) {
      const { data: collections, error: collectionsError } = await supabase
        .from('collections')
        .select('id')
        .in('id', collectionIds)
        .eq('user_id', user.id)

      if (collectionsError) {
        throw collectionsError
      }

      const validCollectionIds = (collections || []).map((c: { id: string }) => c.id)
      const invalidCollectionIds = collectionIds.filter((id: string) => !validCollectionIds.includes(id))

      if (invalidCollectionIds.length > 0) {
        return errorResponse('Some collections were not found or do not belong to you', 400)
      }
    }

    // Delete all existing assignments for this paper
    const { error: deleteError } = await supabase
      .from('paper_collections')
      .delete()
      .eq('paper_id', paperId)

    if (deleteError) {
      throw deleteError
    }

    // Insert new assignments if any
    if (collectionIds.length > 0) {
      const insertData = collectionIds.map((collectionId: string) => ({
        paper_id: paperId,
        collection_id: collectionId,
      }))

      const { error: insertError } = await supabase
        .from('paper_collections')
        .insert(insertData)

      if (insertError) {
        throw insertError
      }
    }

    return successResponse({ message: `Paper assigned to ${collectionIds.length} collection(s)` })
  } catch (error) {
    return handleError(error)
  }
}
