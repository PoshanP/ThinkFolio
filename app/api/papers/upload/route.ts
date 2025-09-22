import { createServerClientSSR } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/utils/auth'
import { successResponse, errorResponse, handleError } from '@/lib/utils/api-response'
import { NextRequest } from 'next/server'
import { PDFService } from '@/lib/services/pdf.service'
import { StorageService } from '@/lib/services/storage.service'
import { DatabaseService } from '@/lib/db'
import { validateFileName, InputSanitizer } from '@/lib/validation'
import { createRequestLogger } from '@/lib/logger'
import { z } from 'zod'

const logger = createRequestLogger('PaperUpload')

const uploadSchema = z.object({
  title: z.string().min(1).max(255).transform(s => InputSanitizer.sanitizeString(s, 255)),
  source: z.enum(['upload', 'url']),
  url: z.string().url().optional().transform(u => u ? InputSanitizer.sanitizeUrl(u) : undefined),
})

export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    const user = await requireAuth()
    const formData = await request.formData()

    const title = formData.get('title') as string
    const source = formData.get('source') as string
    const file = formData.get('file') as File | null
    const url = formData.get('url') as string | null

    // Validate input
    const validatedData = uploadSchema.parse({ title, source, url })

    logger.info({
      userId: user.id,
      source: validatedData.source,
      title: validatedData.title
    }, 'Paper upload initiated')

    const supabase = await createServerClientSSR()

    let storagePath: string | null = null
    let pageCount = 0
    let pdfMetadata: any = null
    let chunks: any[] = []

    if (validatedData.source === 'upload' && file) {
      // Validate file
      if (!validateFileName(file.name)) {
        logger.warn({ fileName: file.name }, 'Invalid file name')
        return errorResponse('Invalid file name', 400)
      }

      if (file.type !== 'application/pdf') {
        return errorResponse('Only PDF files are allowed', 400)
      }

      // Convert to buffer
      const buffer = Buffer.from(await file.arrayBuffer())

      // Validate and sanitize PDF
      StorageService.validateFile(buffer, file.type)
      const sanitizedBuffer = await PDFService.sanitizePDF(buffer)

      // Extract PDF metadata and chunks
      pdfMetadata = await PDFService.extractMetadata(sanitizedBuffer)
      pageCount = pdfMetadata.pageCount
      chunks = pdfMetadata.chunks

      // Upload to storage
      const { path } = await StorageService.uploadFile(sanitizedBuffer, {
        bucket: 'papers',
        path: user.id,
        contentType: 'application/pdf'
      })

      storagePath = path

      logger.info({
        userId: user.id,
        fileName: file.name,
        pageCount,
        chunksCreated: chunks.length,
        storagePath
      }, 'PDF processed and uploaded')

    } else if (validatedData.source === 'url' && validatedData.url) {
      // For URL-based papers, we'll fetch and process later
      // This is a placeholder for future implementation
      logger.info({ url: validatedData.url }, 'URL-based paper upload requested')
      pageCount = 1
    } else {
      return errorResponse('Invalid upload source or missing file/URL', 400)
    }

    // Use transaction for atomicity
    const result = await DatabaseService.transaction(async (_client) => {
      // Save paper to database
      const { data: paper, error: dbError } = await supabase
        .from('papers')
        .insert({
          user_id: user.id,
          title: validatedData.title,
          source: validatedData.source,
          storage_path: storagePath,
          page_count: pageCount,
        } as any)
        .select()
        .single()

      if (dbError) {
        // Cleanup storage if database insert fails
        if (storagePath) {
          await StorageService.deleteFile('papers', storagePath)
        }
        throw dbError
      }

      // Store chunks if available
      if (chunks.length > 0) {
        const chunkRecords = chunks.map(chunk => ({
          paper_id: (paper as any).id,
          page_no: chunk.pageNumber,
          content: chunk.content,
          // Embeddings will be generated when RAG is implemented
          embedding: null
        }))

        await DatabaseService.batchInsert('paper_chunks', chunkRecords)

        logger.info({
          paperId: (paper as any).id,
          chunksStored: chunkRecords.length
        }, 'Paper chunks stored')
      }

      return paper
    })

    // Record metrics
    await fetch('/api/metrics', {
      method: 'POST',
      body: JSON.stringify({ type: 'upload', endpoint: '/api/papers/upload' })
    }).catch(() => {})

    const duration = Date.now() - startTime
    logger.info({
      paperId: (result as any).id,
      duration,
      success: true
    }, 'Paper upload completed')

    return successResponse(result, 201)
  } catch (error) {
    logger.error({ error }, 'Paper upload failed')

    // Record error metric
    await fetch('/api/metrics', {
      method: 'POST',
      body: JSON.stringify({ type: 'error', endpoint: '/api/papers/upload' })
    }).catch(() => {})

    return handleError(error)
  }
}

export const runtime = 'nodejs'