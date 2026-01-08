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
