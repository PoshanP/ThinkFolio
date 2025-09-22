import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { RateLimiterMemory } from 'rate-limiter-flexible'

const publicRoutes = ['/api/auth/signin', '/api/auth/signup', '/api/health']
const rateLimiters = new Map<string, RateLimiterMemory>()

function getRateLimiter(key: string, points: number, duration: number) {
  if (!rateLimiters.has(key)) {
    rateLimiters.set(key, new RateLimiterMemory({
      points,
      duration,
      blockDuration: duration * 2,
    }))
  }
  return rateLimiters.get(key)!
}

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const pathname = request.nextUrl.pathname
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'

  // CORS headers for API routes
  if (pathname.startsWith('/api/')) {
    response.headers.set('Access-Control-Allow-Origin', process.env.NEXT_PUBLIC_APP_URL || '*')
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('X-XSS-Protection', '1; mode=block')
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')

    if (request.method === 'OPTIONS') {
      return new NextResponse(null, { status: 200, headers: response.headers })
    }
  }

  // Rate limiting
  try {
    if (pathname.startsWith('/api/auth/')) {
      const authLimiter = getRateLimiter('auth', 5, 900) // 5 attempts per 15 minutes
      await authLimiter.consume(ip)
    } else if (pathname.startsWith('/api/papers/upload')) {
      const uploadLimiter = getRateLimiter('upload', 10, 3600) // 10 uploads per hour
      await uploadLimiter.consume(ip)
    } else if (pathname.startsWith('/api/')) {
      const apiLimiter = getRateLimiter('api', 100, 60) // 100 requests per minute
      await apiLimiter.consume(ip)
    }
  } catch (rejRes: any) {
    return NextResponse.json(
      { error: 'Too many requests', retryAfter: Math.round(rejRes.msBeforeNext / 1000) || 60 },
      { status: 429, headers: response.headers }
    )
  }

  // Skip auth for public routes
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return response
  }

  // Supabase auth check for protected routes
  if (pathname.startsWith('/api/') && !pathname.startsWith('/api/auth/')) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              request.cookies.set(name, value)
              response.cookies.set(name, value, options)
            })
          },
        },
      }
    )

    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 401 },
        { status: 401, headers: response.headers }
      )
    }

    // Add user ID to headers for downstream use
    response.headers.set('x-user-id', user.id)
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
    '/api/:path*',
  ],
}