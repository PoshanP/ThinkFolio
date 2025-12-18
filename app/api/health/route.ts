import { NextResponse } from 'next/server'
import { DatabaseService } from '@/lib/db'
import { createRequestLogger } from '@/lib/logger'
import os from 'os'

const logger = createRequestLogger('HealthCheck')

export async function GET() {
  const startTime = Date.now()

  try {
    // Check database health
    const dbHealthy = await DatabaseService.healthCheck()
    const dbStats = await DatabaseService.getConnectionStats()

    // System metrics
    const systemMetrics = {
      uptime: process.uptime(),
      memory: {
        used: process.memoryUsage(),
        system: {
          total: os.totalmem(),
          free: os.freemem(),
          usage: ((os.totalmem() - os.freemem()) / os.totalmem() * 100).toFixed(2) + '%'
        }
      },
      cpu: {
        cores: os.cpus().length,
        model: os.cpus()[0]?.model,
        load: os.loadavg()
      },
      platform: {
        type: os.type(),
        platform: os.platform(),
        release: os.release(),
        hostname: os.hostname()
      }
    }

    const health = {
      status: dbHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      uptime: systemMetrics.uptime,
      responseTime: `${Date.now() - startTime}ms`,
      services: {
        database: {
          status: dbHealthy ? 'operational' : 'down',
          connections: dbStats
        },
        storage: {
          status: 'operational' // Assume storage is operational
        }
      },
      metrics: systemMetrics
    }

    const statusCode = health.status === 'healthy' ? 200 : 503

    logger.info({ health }, 'Health check completed')

    return NextResponse.json(health, {
      status: statusCode,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Response-Time': `${Date.now() - startTime}ms`
      }
    })
  } catch (error) {
    logger.error({ error }, 'Health check failed')

    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Health check failed',
        responseTime: `${Date.now() - startTime}ms`
      },
      { status: 503 }
    )
  }
}

export async function HEAD() {
  try {
    const dbHealthy = await DatabaseService.healthCheck()
    return new NextResponse(null, {
      status: dbHealthy ? 200 : 503,
      headers: {
        'X-Health-Status': dbHealthy ? 'healthy' : 'unhealthy'
      }
    })
  } catch {
    return new NextResponse(null, { status: 503 })
  }
}