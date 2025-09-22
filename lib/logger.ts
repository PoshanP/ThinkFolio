import pino from 'pino'

const isDevelopment = process.env.NODE_ENV === 'development'

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: isDevelopment
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          ignore: 'pid,hostname',
          translateTime: 'SYS:standard',
        },
      }
    : undefined,
  base: {
    env: process.env.NODE_ENV,
    revision: process.env.VERCEL_GIT_COMMIT_SHA,
  },
  redact: {
    paths: ['req.headers.authorization', 'req.headers.cookie', '*.password', '*.token', '*.key'],
    censor: '[REDACTED]',
  },
  serializers: {
    req: (req) => ({
      method: req.method,
      url: req.url,
      headers: req.headers,
      ip: req.headers?.['x-forwarded-for'] || req.headers?.['x-real-ip'],
    }),
    res: (res) => ({
      statusCode: res.statusCode,
    }),
    err: pino.stdSerializers.err,
  },
})

export function createRequestLogger(context: string) {
  return logger.child({ context })
}

export function logApiRequest(req: Request, res: Response, duration: number, context: string) {
  const log = createRequestLogger(context)
  const level = res.status >= 400 ? 'error' : 'info'

  log[level]({
    method: req.method,
    url: req.url,
    status: res.status,
    duration: `${duration}ms`,
    userAgent: req.headers.get('user-agent'),
  }, `API ${req.method} ${new URL(req.url).pathname}`)
}