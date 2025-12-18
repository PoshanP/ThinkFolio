import { createServerClientSSR } from '@/lib/supabase/server'
import { successResponse, errorResponse } from '@/lib/utils/api-response'

export async function GET() {
  try {
    const supabase = await createServerClientSSR()

    // Try to check if core tables exist
    const { error: profilesError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1)

    const { error: papersError } = await supabase
      .from('papers')
      .select('id')
      .limit(1)

    const tablesExist = !profilesError && !papersError
    const missingTables = []

    if (profilesError) missingTables.push('profiles')
    if (papersError) missingTables.push('papers')

    return successResponse({
      ready: tablesExist,
      missingTables,
      message: tablesExist
        ? 'Database is ready'
        : `Database not ready. Missing tables: ${missingTables.join(', ')}`
    })

  } catch {
    return errorResponse('Failed to check database status', 500)
  }
}