import { NextResponse } from 'next/server'
import { ApiResponse } from '@/lib/types'

export function successResponse<T = any>(data: T, status = 200): NextResponse<ApiResponse<T>> {
  return NextResponse.json({ data }, { status })
}

export function errorResponse(error: string, code = 400): NextResponse<ApiResponse> {
  return NextResponse.json({ error, code }, { status: code })
}

export function handleError(error: unknown): NextResponse<ApiResponse> {
  console.error('API Error:', error)

  if (error instanceof Error) {
    const status = (error as any).status || 500
    return errorResponse(error.message, status)
  }

  return errorResponse('An unexpected error occurred', 500)
}