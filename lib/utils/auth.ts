import { createServerClientSSR } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { User } from '@supabase/supabase-js'
import { headers } from 'next/headers'

export async function getCurrentUser(): Promise<User | null> {
  const supabase = await createServerClientSSR()

  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return null
  }

  return user
}

export async function getCurrentUserFromRequest(): Promise<User | null> {
  try {
    const headersList = await headers()
    const authorization = headersList.get('authorization')

    if (authorization && authorization.startsWith('Bearer ')) {
      const token = authorization.split(' ')[1]

      // Create Supabase client with service role for token verification
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )

      const { data: { user }, error } = await supabase.auth.getUser(token)

      if (error || !user) {
        return null
      }

      return user
    }

    // Fallback to cookie-based auth
    return await getCurrentUser()
  } catch (error) {
    console.error('Error getting user from request:', error)
    return null
  }
}

export async function requireAuth(): Promise<User> {
  const user = await getCurrentUserFromRequest()

  if (!user) {
    const error = new Error('Unauthorized') as any
    error.status = 401
    throw error
  }

  return user
}