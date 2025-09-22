import { NextResponse, NextRequest } from 'next/server'
import { createRequestLogger } from '@/lib/logger'

const logger = createRequestLogger('Metrics')

// In-memory metrics storage (in production, use Redis or similar)
const metrics = {
  requests: new Map<string, number>(),
  errors: new Map<string, number>(),
  latency: new Map<string, number[]>(),
  activeUsers: new Set<string>(),
  uploads: 0,
  downloads: 0
}

export async function GET(request: NextRequest) {
  try {
    // Aggregate metrics
    const aggregated = {
      timestamp: new Date().toISOString(),
      period: '1h', // Last hour
      requests: {
        total: Array.from(metrics.requests.values()).reduce((a, b) => a + b, 0),
        byEndpoint: Object.fromEntries(metrics.requests)
      },
      errors: {
        total: Array.from(metrics.errors.values()).reduce((a, b) => a + b, 0),
        byEndpoint: Object.fromEntries(metrics.errors)
      },
      latency: {
        byEndpoint: Object.fromEntries(
          Array.from(metrics.latency.entries()).map(([endpoint, values]) => [
            endpoint,
            {
              avg: values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0,
              min: values.length ? Math.min(...values) : 0,
              max: values.length ? Math.max(...values) : 0,
              p50: values.length ? percentile(values, 0.5) : 0,
              p95: values.length ? percentile(values, 0.95) : 0,
              p99: values.length ? percentile(values, 0.99) : 0
            }
          ])
        )
      },
      users: {
        active: metrics.activeUsers.size
      },
      storage: {
        uploads: metrics.uploads,
        downloads: metrics.downloads
      }
    }

    logger.info({ metrics: aggregated }, 'Metrics retrieved')

    return NextResponse.json(aggregated, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    })
  } catch (error) {
    logger.error({ error }, 'Failed to retrieve metrics')
    return NextResponse.json(
      { error: 'Failed to retrieve metrics' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, endpoint, value, userId } = body

    switch (type) {
      case 'request':
        metrics.requests.set(endpoint, (metrics.requests.get(endpoint) || 0) + 1)
        break
      case 'error':
        metrics.errors.set(endpoint, (metrics.errors.get(endpoint) || 0) + 1)
        break
      case 'latency':
        if (!metrics.latency.has(endpoint)) {
          metrics.latency.set(endpoint, [])
        }
        metrics.latency.get(endpoint)?.push(value)
        // Keep only last 1000 values
        const latencyValues = metrics.latency.get(endpoint)
        if (latencyValues && latencyValues.length > 1000) {
          metrics.latency.set(endpoint, latencyValues.slice(-1000))
        }
        break
      case 'user':
        if (userId) {
          metrics.activeUsers.add(userId)
          // Clear old users after 1 hour
          setTimeout(() => metrics.activeUsers.delete(userId), 3600000)
        }
        break
      case 'upload':
        metrics.uploads++
        break
      case 'download':
        metrics.downloads++
        break
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error({ error }, 'Failed to record metric')
    return NextResponse.json(
      { error: 'Failed to record metric' },
      { status: 500 }
    )
  }
}

function percentile(values: number[], p: number): number {
  if (!values.length) return 0
  const sorted = values.slice().sort((a, b) => a - b)
  const index = Math.ceil(sorted.length * p) - 1
  return sorted[index] || 0
}