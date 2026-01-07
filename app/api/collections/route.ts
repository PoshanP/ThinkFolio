import { createServerClientSSR } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/utils/auth'
import { successResponse, errorResponse, handleError } from '@/lib/utils/api-response'
import { NextRequest } from 'next/server'
import { CreateCollectionSchema } from '@/lib/validation/collections'
import { MAX_COLLECTIONS_PER_USER, DEFAULT_COLLECTION_COLOR, DEFAULT_COLLECTION_ICON, DEFAULT_COLLECTIONS } from '@/lib/constants'
import { CollectionWithCount } from '@/lib/types/database'

// Seed default collections for new users
async function seedDefaultCollections(userId: string, supabase: Awaited<ReturnType<typeof createServerClientSSR>>) {
  // Check if already seeded
  const { data: settings } = await supabase
    .from('user_settings')
    .select('collections_seeded_at')
    .eq('user_id', userId)
    .single()

  if (settings?.collections_seeded_at) {
    // Already seeded, do nothing
    return
  }

  // Create default collections
  const collectionsToInsert = DEFAULT_COLLECTIONS.map((col, index) => ({
    user_id: userId,
    name: col.name,
    description: col.description,
    icon: col.icon,
    color: col.color,
    display_order: index,
    is_system: col.is_system,
  }))

  await supabase.from('collections').insert(collectionsToInsert)

  // Mark as seeded (upsert to handle race conditions)
  await supabase.from('user_settings').upsert({
    user_id: userId,
    collections_seeded_at: new Date().toISOString(),
  }, {
    onConflict: 'user_id',
  })
}

// GET /api/collections - List all user's collections with paper counts
export async function GET() {
  try {
    const user = await requireAuth()
    const supabase = await createServerClientSSR()

    // Seed default collections for new users (one-time operation)
    await seedDefaultCollections(user.id, supabase)

    // Get all collections for the user
    const { data: collections, error } = await supabase
      .from('collections')
      .select('*')
      .eq('user_id', user.id)
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    // Get paper counts for each collection
    const collectionsWithCounts: CollectionWithCount[] = await Promise.all(
      (collections || []).map(async (collection: { id: string; user_id: string; name: string; description: string | null; color: string; icon: string; display_order: number; is_system: boolean; created_at: string; updated_at: string }) => {
        const { count } = await supabase
          .from('paper_collections')
          .select('*', { count: 'exact', head: true })
          .eq('collection_id', collection.id)

        return {
          ...collection,
          paper_count: count || 0,
        }
      })
    )

    return successResponse(collectionsWithCounts)
  } catch (error) {
    return handleError(error)
  }
}

// POST /api/collections - Create a new collection
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const supabase = await createServerClientSSR()

    // Parse and validate request body
    const body = await request.json()
    const validationResult = CreateCollectionSchema.safeParse(body)

    if (!validationResult.success) {
      const errors = validationResult.error.errors.map((e: { message: string }) => e.message).join(', ')
      return errorResponse(errors, 400)
    }

    const { name, description, color, icon } = validationResult.data

    // Check collection limit
    const { count: existingCount } = await supabase
      .from('collections')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    if ((existingCount || 0) >= MAX_COLLECTIONS_PER_USER) {
      return errorResponse(`You can have a maximum of ${MAX_COLLECTIONS_PER_USER} collections`, 400)
    }

    // Check for duplicate name
    const { data: existingCollection } = await supabase
      .from('collections')
      .select('id')
      .eq('user_id', user.id)
      .eq('name', name)
      .single()

    if (existingCollection) {
      return errorResponse('A collection with this name already exists', 400)
    }

    // Get the highest display_order
    const { data: lastCollection } = await supabase
      .from('collections')
      .select('display_order')
      .eq('user_id', user.id)
      .order('display_order', { ascending: false })
      .limit(1)
      .single()

    const nextDisplayOrder = (lastCollection?.display_order ?? -1) + 1

    // Create the collection
    const { data: collection, error } = await supabase
      .from('collections')
      .insert({
        user_id: user.id,
        name,
        description: description || null,
        color: color || DEFAULT_COLLECTION_COLOR,
        icon: icon || DEFAULT_COLLECTION_ICON,
        display_order: nextDisplayOrder,
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    return successResponse({ ...collection, paper_count: 0 }, 201)
  } catch (error) {
    return handleError(error)
  }
}
