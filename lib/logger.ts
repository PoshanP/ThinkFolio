const isDevelopment = process.env.NODE_ENV === 'development'

// Simple console-based logger to avoid worker thread issues
export const logger = {
  info: (data: any, message?: string) => {
    if (isDevelopment) {
      console.log(`[INFO] ${message || ''}`, data)
    }
  },
  error: (data: any, message?: string) => {
    console.error(`[ERROR] ${message || ''}`, data)
  },
  warn: (data: any, message?: string) => {
    console.warn(`[WARN] ${message || ''}`, data)
  },
  debug: (data: any, message?: string) => {
    if (isDevelopment) {
      console.debug(`[DEBUG] ${message || ''}`, data)
    }
  }
}

export function createRequestLogger(context: string) {
  return {
    info: (data: any, message?: string) => logger.info(data, `[${context}] ${message || ''}`),
    error: (data: any, message?: string) => logger.error(data, `[${context}] ${message || ''}`),
    warn: (data: any, message?: string) => logger.warn(data, `[${context}] ${message || ''}`),
    debug: (data: any, message?: string) => logger.debug(data, `[${context}] ${message || ''}`)
  }
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