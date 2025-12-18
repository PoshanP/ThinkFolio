import { createServerClientSSR } from '@/lib/supabase/server'
import { SignInSchema } from '@/lib/types'
import { errorResponse, successResponse, handleError } from '@/lib/utils/api-response'
import { NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = SignInSchema.parse(body)

    const supabase = await createServerClientSSR()

    const { data, error } = await supabase.auth.signInWithPassword({
      email: validatedData.email,
      password: validatedData.password,
    })

    if (error) {
      return errorResponse(error.message, 401)
    }

    return successResponse({
      user: data.user,
      session: data.session,
    })
  } catch (error) {
    return handleError(error)
  }
}