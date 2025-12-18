import pdf from 'pdf-parse'
import { createRequestLogger } from '@/lib/logger'

const logger = createRequestLogger('PDFService')

export interface PDFMetadata {
  pageCount: number
  title: string
  author?: string
  subject?: string
  keywords?: string
  creationDate?: Date
  modificationDate?: Date
  producer?: string
  textContent: string
  chunks: PDFChunk[]
}

export interface PDFChunk {
  pageNumber: number
  content: string
  startIndex: number
  endIndex: number
}

export class PDFService {
  private static readonly CHUNK_SIZE = 500
  private static readonly CHUNK_OVERLAP = 50
  private static readonly MAX_CHUNK_SIZE = 1000
  private static readonly MIN_CHUNK_SIZE = 100

  static async extractMetadata(buffer: Buffer): Promise<PDFMetadata> {
    try {
      logger.info('Extracting PDF metadata')

      const data = await pdf(buffer, {
        max: 0, // Parse all pages
        version: 'v2.0.550'
      })

      const metadata: PDFMetadata = {
        pageCount: data.numpages,
        title: data.info?.Title || 'Untitled Document',
        author: data.info?.Author,
        subject: data.info?.Subject,
        keywords: data.info?.Keywords,
        creationDate: data.info?.CreationDate,
        modificationDate: data.info?.ModDate,
        producer: data.info?.Producer,
        textContent: data.text,
        chunks: []
      }

      // Generate chunks
      metadata.chunks = this.createChunks(data.text, data.numpages)

      logger.info({
        pageCount: metadata.pageCount,
        chunksCreated: metadata.chunks.length
      }, 'PDF metadata extracted successfully')

      return metadata
    } catch (error) {
      logger.error({ error }, 'Failed to extract PDF metadata')
      throw new Error('Failed to process PDF file')
    }
  }

  private static createChunks(text: string, pageCount: number): PDFChunk[] {
    const chunks: PDFChunk[] = []
    const lines = text.split('\n')
    let currentChunk = ''
    let currentPage = 1
    let charCount = 0
    let chunkStartIndex = 0

    for (const line of lines) {
      // Estimate page number based on position in text
      const estimatedPage = Math.ceil((charCount / text.length) * pageCount) || 1

      if (currentChunk.length + line.length > this.CHUNK_SIZE && currentChunk.length >= this.MIN_CHUNK_SIZE) {
        // Save current chunk
        chunks.push({
          pageNumber: currentPage,
          content: currentChunk.trim(),
          startIndex: chunkStartIndex,
          endIndex: charCount
        })

        // Start new chunk with overlap
        const overlapText = currentChunk.slice(-this.CHUNK_OVERLAP)
        currentChunk = overlapText + line + '\n'
        chunkStartIndex = charCount - this.CHUNK_OVERLAP
        currentPage = estimatedPage
      } else {
        currentChunk += line + '\n'
      }

      charCount += line.length + 1
    }

    // Add the last chunk
    if (currentChunk.trim()) {
      chunks.push({
        pageNumber: currentPage,
        content: currentChunk.trim(),
        startIndex: chunkStartIndex,
        endIndex: charCount
      })
    }

    return chunks
  }

  static validatePDF(buffer: Buffer): boolean {
    try {
      // Check PDF signature
      const signature = buffer.slice(0, 5).toString()
      return signature === '%PDF-'
    } catch {
      return false
    }
  }

  static async sanitizePDF(buffer: Buffer): Promise<Buffer> {
    // In production, you might want to use a service like VirusTotal API
    // or ClamAV to scan for malware

    if (!this.validatePDF(buffer)) {
      throw new Error('Invalid PDF file')
    }

    // Check for suspicious patterns
    const content = buffer.toString('utf8', 0, Math.min(buffer.length, 10000))
    const suspiciousPatterns = [
      /\/JavaScript/i,
      /\/JS/i,
      /\/Launch/i,
      /\/EmbeddedFile/i,
      /\/OpenAction/i,
      /\/AA/i, // Additional Actions
    ]

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(content)) {
        logger.warn({ pattern: pattern.toString() }, 'Suspicious PDF pattern detected')
        // In production, you might want to reject these files
        // throw new Error('PDF contains potentially harmful content')
      }
    }

    return buffer
  }

  static estimateTokenCount(text: string): number {
    // Rough estimate: 1 token ≈ 4 characters
    return Math.ceil(text.length / 4)
  }
}