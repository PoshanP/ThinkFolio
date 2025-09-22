import { NextRequest } from 'next/server'
import { createServerClientSSR } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/utils/auth'
import { successResponse, errorResponse, handleError } from '@/lib/utils/api-response'
import { createRequestLogger } from '@/lib/logger'
import { z } from 'zod'

const logger = createRequestLogger('UserProfile')

const updateProfileSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  bio: z.string().max(500).optional(),
  avatar_url: z.string().url().optional(),
})

export async function GET() {
  try {
    const user = await requireAuth()
    const supabase = await createServerClientSSR()

    // Get user profile with stats
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError && profileError.code !== 'PGRST116') { // PGRST116 = not found
      throw profileError
    }

    // If no profile exists, create one from auth user data
    if (!profile) {
      const { data: newProfile, error: createError } = await (supabase as any)
        .from('profiles')
        .insert({
          id: user.id,
          email: user.email,
          name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (createError) {
        throw createError
      }

      logger.info({ userId: user.id }, 'Created new user profile')
      return successResponse(newProfile)
    }

    logger.info({ userId: user.id }, 'Retrieved user profile')
    return successResponse(profile)

  } catch (error) {
    logger.error(error, 'Failed to get user profile')
    return handleError(error)
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth()
    const body = await request.json()

    // Validate input
    const validatedData = updateProfileSchema.parse(body)

    const supabase = await createServerClientSSR()

    // Update user profile
    const { data: profile, error } = await (supabase as any)
      .from('profiles')
      .update({
        ...validatedData,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)
      .select()
      .single()

    if (error) {
      throw error
    }

    logger.info({ userId: user.id, updates: Object.keys(validatedData) }, 'Updated user profile')
    return successResponse(profile)

  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse('Invalid profile data', 400)
    }
    logger.error(error, 'Failed to update user profile')
    return handleError(error)
  }
}