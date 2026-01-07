import { createServerClientSSR } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/utils/auth'
import { successResponse, errorResponse, handleError } from '@/lib/utils/api-response'
import { NextRequest } from 'next/server'
import { UpdateCollectionSchema } from '@/lib/validation/collections'

// GET /api/collections/[id] - Get a single collection with paper count
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    const { id } = await params
    const supabase = await createServerClientSSR()

    const { data: collection, error } = await supabase
      .from('collections')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (error || !collection) {
      return errorResponse('Collection not found', 404)
    }

    // Get paper count
    const { count } = await supabase
      .from('paper_collections')
      .select('*', { count: 'exact', head: true })
      .eq('collection_id', id)

    return successResponse({ ...collection, paper_count: count || 0 })
  } catch (error) {
    return handleError(error)
  }
}

// PATCH /api/collections/[id] - Update a collection
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    const { id } = await params
    const supabase = await createServerClientSSR()

    // Verify collection exists and belongs to user
    const { data: existingCollection, error: fetchError } = await supabase
      .from('collections')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !existingCollection) {
      return errorResponse('Collection not found', 404)
    }

    // Parse and validate request body
    const body = await request.json()
    const validationResult = UpdateCollectionSchema.safeParse(body)

    if (!validationResult.success) {
      const errors = validationResult.error.errors.map((e: { message: string }) => e.message).join(', ')
      return errorResponse(errors, 400)
    }

    const updateData = validationResult.data

    // Check for duplicate name if name is being updated
    if (updateData.name && updateData.name !== existingCollection.name) {
      const { data: duplicateCollection } = await supabase
        .from('collections')
        .select('id')
        .eq('user_id', user.id)
        .eq('name', updateData.name)
        .single()

      if (duplicateCollection) {
        return errorResponse('A collection with this name already exists', 400)
      }
    }

    // Build update object (only include defined fields)
    const updates: Record<string, unknown> = {}
    if (updateData.name !== undefined) updates.name = updateData.name
    if (updateData.description !== undefined) updates.description = updateData.description
    if (updateData.color !== undefined) updates.color = updateData.color
    if (updateData.icon !== undefined) updates.icon = updateData.icon
    if (updateData.display_order !== undefined) updates.display_order = updateData.display_order

    // Update the collection
    const { data: collection, error } = await supabase
      .from('collections')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      throw error
    }

    // Get paper count
    const { count } = await supabase
      .from('paper_collections')
      .select('*', { count: 'exact', head: true })
      .eq('collection_id', id)

    return successResponse({ ...collection, paper_count: count || 0 })
  } catch (error) {
    return handleError(error)
  }
}

// DELETE /api/collections/[id] - Delete a collection (papers are NOT deleted)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    const { id } = await params
    const supabase = await createServerClientSSR()

    // Verify collection exists and belongs to user
    const { data: existingCollection, error: fetchError } = await supabase
      .from('collections')
      .select('id, is_system')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !existingCollection) {
      return errorResponse('Collection not found', 404)
    }

    // Prevent deleting system collections
    if (existingCollection.is_system) {
      return errorResponse('System collections cannot be deleted', 403)
    }

    // Delete the collection (CASCADE will remove paper_collections entries)
    const { error } = await supabase
      .from('collections')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      throw error
    }

    return successResponse({ message: 'Collection deleted successfully' })
  } catch (error) {
    return handleError(error)
  }
}
