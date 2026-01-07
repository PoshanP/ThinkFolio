import { createServerClientSSR } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/utils/auth'
import { successResponse, errorResponse, handleError } from '@/lib/utils/api-response'
import { NextRequest } from 'next/server'
import { AddPapersToCollectionSchema } from '@/lib/validation/collections'

// GET /api/collections/[id]/papers - List all papers in a collection
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    const { id: collectionId } = await params
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

    // Get all papers in the collection
    const { data: paperCollections, error } = await supabase
      .from('paper_collections')
      .select('paper_id, added_at')
      .eq('collection_id', collectionId)
      .order('added_at', { ascending: false })

    if (error) {
      throw error
    }

    if (!paperCollections || paperCollections.length === 0) {
      return successResponse([])
    }

    // Get paper details
    const paperIds = paperCollections.map((pc: { paper_id: string }) => pc.paper_id)
    const { data: papers, error: papersError } = await supabase
      .from('papers')
      .select('*')
      .in('id', paperIds)
      .eq('user_id', user.id)

    if (papersError) {
      throw papersError
    }

    // Merge paper data with added_at from junction table
    type PaperRow = { id: string; [key: string]: unknown }
    type PaperCollectionRow = { paper_id: string; added_at: string }
    const papersWithAddedAt = (papers || []).map((paper: PaperRow) => {
      const pc = paperCollections.find((pc: PaperCollectionRow) => pc.paper_id === paper.id)
      return {
        ...paper,
        added_to_collection_at: pc?.added_at,
      }
    })

    // Sort by added_at descending
    papersWithAddedAt.sort((a: { added_to_collection_at?: string }, b: { added_to_collection_at?: string }) => {
      const dateA = a.added_to_collection_at ? new Date(a.added_to_collection_at).getTime() : 0
      const dateB = b.added_to_collection_at ? new Date(b.added_to_collection_at).getTime() : 0
      return dateB - dateA
    })

    return successResponse(papersWithAddedAt)
  } catch (error) {
    return handleError(error)
  }
}

// POST /api/collections/[id]/papers - Add papers to a collection
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    const { id: collectionId } = await params
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

    // Parse and validate request body
    const body = await request.json()
    const validationResult = AddPapersToCollectionSchema.safeParse(body)

    if (!validationResult.success) {
      const errors = validationResult.error.errors.map((e: { message: string }) => e.message).join(', ')
      return errorResponse(errors, 400)
    }

    const { paperIds } = validationResult.data

    // Verify all papers belong to the user
    const { data: papers, error: papersError } = await supabase
      .from('papers')
      .select('id')
      .in('id', paperIds)
      .eq('user_id', user.id)

    if (papersError) {
      throw papersError
    }

    const validPaperIds = (papers || []).map((p: { id: string }) => p.id)
    const invalidPaperIds = paperIds.filter((id: string) => !validPaperIds.includes(id))

    if (invalidPaperIds.length > 0) {
      return errorResponse('Some papers were not found or do not belong to you', 400)
    }

    // Insert paper-collection relationships (upsert to handle duplicates)
    const insertData = paperIds.map((paperId: string) => ({
      paper_id: paperId,
      collection_id: collectionId,
    }))

    const { error: insertError } = await supabase
      .from('paper_collections')
      .upsert(insertData, {
        onConflict: 'paper_id,collection_id',
        ignoreDuplicates: true,
      })

    if (insertError) {
      throw insertError
    }

    return successResponse({ message: `Added ${paperIds.length} paper(s) to collection` })
  } catch (error) {
    return handleError(error)
  }
}
