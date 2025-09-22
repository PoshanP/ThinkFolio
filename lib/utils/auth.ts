import { createServerClientSSR } from '@/lib/supabase/server'
import { User } from '@supabase/supabase-js'

export async function getCurrentUser(): Promise<User | null> {
  const supabase = await createServerClientSSR()

  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return null
  }

  return user
}

export async function requireAuth(): Promise<User> {
  const user = await getCurrentUser()

  if (!user) {
    const error = new Error('Unauthorized') as any
    error.status = 401
    throw error
  }

  return user
}