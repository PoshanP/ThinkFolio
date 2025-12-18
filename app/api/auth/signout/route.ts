import { createServerClientSSR } from '@/lib/supabase/server'
import { successResponse, handleError } from '@/lib/utils/api-response'

export async function POST() {
  try {
    const supabase = await createServerClientSSR()

    const { error } = await supabase.auth.signOut()

    if (error) {
      throw error
    }

    return successResponse({ message: 'Signed out successfully' })
  } catch (error) {
    return handleError(error)
  }
}