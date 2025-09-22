import { createServerClientSSR } from '@/lib/supabase/server'
import { SignUpSchema } from '@/lib/types'
import { errorResponse, successResponse, handleError } from '@/lib/utils/api-response'
import { NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = SignUpSchema.parse(body)

    const supabase = await createServerClientSSR()

    const { data, error } = await supabase.auth.signUp({
      email: validatedData.email,
      password: validatedData.password,
      options: {
        data: {
          full_name: validatedData.fullName,
        },
      },
    })

    if (error) {
      return errorResponse(error.message, 400)
    }

    return successResponse({
      user: data.user,
      session: data.session,
    })
  } catch (error) {
    return handleError(error)
  }
}