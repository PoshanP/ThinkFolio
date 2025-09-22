import { createServerClientSSR } from '@/lib/supabase/server'
import { successResponse, errorResponse, handleError } from '@/lib/utils/api-response'

export async function GET() {
  try {
    const supabase = await createServerClientSSR()

    const { data: { session }, error } = await supabase.auth.getSession()

    if (error) {
      throw error
    }

    if (!session) {
      return errorResponse('No active session', 401)
    }

    return successResponse({ session })
  } catch (error) {
    return handleError(error)
  }
}