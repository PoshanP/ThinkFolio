import { z } from 'zod'
import { NextRequest } from 'next/server'
import { createRequestLogger } from '@/lib/logger'

const logger = createRequestLogger('Validation')

export class ValidationError extends Error {
  constructor(public errors: z.ZodError) {
    super('Validation failed')
    this.name = 'ValidationError'
  }
}

export async function validateRequest<T>(
  request: NextRequest,
  schema: z.ZodSchema<T>
): Promise<T> {
  try {
    const body = await request.json()
    const validated = schema.parse(body)
    return validated
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.warn({ errors: error.errors }, 'Request validation failed')
      throw new ValidationError(error)
    }
    throw error
  }
}

export function validateQuery<T>(
  searchParams: URLSearchParams,
  schema: z.ZodSchema<T>
): T {
  try {
    const params = Object.fromEntries(searchParams.entries())
    const validated = schema.parse(params)
    return validated
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.warn({ errors: error.errors }, 'Query validation failed')
      throw new ValidationError(error)
    }
    throw error
  }
}

export const fileValidation = {
  pdf: z.object({
    type: z.literal('application/pdf'),
    size: z.number().max(50 * 1024 * 1024, 'File size must be less than 50MB'),
  }),
  image: z.object({
    type: z.enum(['image/jpeg', 'image/png', 'image/webp']),
    size: z.number().max(10 * 1024 * 1024, 'Image size must be less than 10MB'),
  }),
}

export const paginationSchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().min(1)).default('1'),
  limit: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().min(1).max(100)).default('20'),
})

export const uuidSchema = z.string().uuid()

export const emailSchema = z.string().email().toLowerCase()

export const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character')

export function sanitizeInput(input: string): string {
  // Remove any potential SQL injection attempts
  const sqlPatterns = /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE)\b)/gi
  let sanitized = input.replace(sqlPatterns, '')

  // Remove any potential XSS attempts
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
  sanitized = sanitized.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
  sanitized = sanitized.replace(/javascript:/gi, '')
  sanitized = sanitized.replace(/on\w+\s*=/gi, '')

  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, '')

  // Trim whitespace
  sanitized = sanitized.trim()

  return sanitized
}

export function validateFileName(fileName: string): boolean {
  // Check for path traversal attempts
  if (fileName.includes('..') || fileName.includes('/') || fileName.includes('\\')) {
    return false
  }

  // Check for valid characters
  const validPattern = /^[a-zA-Z0-9_\-\.]+$/
  if (!validPattern.test(fileName)) {
    return false
  }

  // Check file extension
  const allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.png', '.webp']
  const hasValidExtension = allowedExtensions.some(ext => fileName.toLowerCase().endsWith(ext))

  return hasValidExtension
}

export class InputSanitizer {
  static sanitizeString(input: string, maxLength: number = 1000): string {
    if (!input) return ''
    return sanitizeInput(input).slice(0, maxLength)
  }

  static sanitizeEmail(email: string): string {
    return email.toLowerCase().trim()
  }

  static sanitizeUrl(url: string): string {
    try {
      const parsed = new URL(url)
      // Only allow http and https protocols
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        throw new Error('Invalid protocol')
      }
      return parsed.toString()
    } catch {
      throw new Error('Invalid URL')
    }
  }

  static sanitizeFilePath(path: string): string {
    // Remove any directory traversal attempts
    return path.replace(/\.\./g, '').replace(/[\/\\]/g, '_')
  }
}