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
import { parseDocument, generatePreview } from '@/lib/services/document.service'
import {
  getFileTypeFromMime,
  getFileTypeFromExtension,
  isSupportedMimeType,
  FileType,
  getMaxFileSize,
} from '@/lib/utils/mimeTypes'

const logger = createRequestLogger('PaperUpload')

const uploadSchema = z.object({
  title: z.string().min(1).max(255).transform(s => InputSanitizer.sanitizeString(s, 255)),
  source: z.enum(['upload', 'url']),
  url: z.string().url().optional().nullable().transform(u => u ? InputSanitizer.sanitizeUrl(u) : undefined),
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
    let fileType: FileType = 'pdf'
    let previewHtml: string | null = null
    let previewImagePath: string | null = null
    let chunks: Array<{ content: string; pageNo: number }> = []

    if (validatedData.source === 'upload' && file) {
      // Validate file name
      if (!validateFileName(file.name)) {
        logger.warn({ fileName: file.name }, 'Invalid file name')
        return errorResponse('Invalid file name', 400)
      }

      // Determine file type from MIME type or extension
      const detectedFileType = getFileTypeFromMime(file.type) || getFileTypeFromExtension(file.name)

      if (!detectedFileType) {
        return errorResponse(
          `Unsupported file type. Supported formats: PDF, DOCX, TXT, RTF, PPTX, CSV, EPUB, HTML`,
          400
        )
      }

      fileType = detectedFileType

      // Convert to buffer
      const buffer = Buffer.from(await file.arrayBuffer())

      // Check file size against type-specific limits
      const maxSize = getMaxFileSize(fileType)
      if (buffer.length > maxSize) {
        return errorResponse(
          `File size exceeds ${Math.round(maxSize / (1024 * 1024))}MB limit for ${fileType.toUpperCase()} files`,
          400
        )
      }

      logger.info({
        userId: user.id,
        fileName: file.name,
        fileType,
        fileSize: buffer.length,
      }, 'Processing file')

      // Handle PDF files with special sanitization
      let processBuffer: Buffer = buffer
      if (fileType === 'pdf') {
        // Validate and sanitize PDF
        StorageService.validateFile(buffer, file.type)
        processBuffer = await PDFService.sanitizePDF(buffer) as Buffer
      }

      // Parse document to extract text and chunks
      const parsedDoc = await parseDocument(processBuffer, file.type, file.name)
      pageCount = parsedDoc.pageCount
      previewHtml = parsedDoc.previewHtml || null

      // Create chunks from parsed document
      if (parsedDoc.chunks && parsedDoc.chunks.length > 0) {
        chunks = parsedDoc.chunks.map(chunk => ({
          content: chunk.content,
          pageNo: chunk.pageNo,
        }))
      } else {
        // Fallback: create basic chunks if parser didn't provide them
        chunks = PDFService.createChunks(parsedDoc.text, pageCount).map(chunk => ({
          content: chunk.content,
          pageNo: chunk.pageNumber,
        }))
      }

      // Generate preview image for PPTX
      if (fileType === 'pptx') {
        const preview = await generatePreview(processBuffer, fileType, file.name)
        if (preview.previewImageBuffer) {
          // Upload preview image to storage
          const { path: imagePath } = await StorageService.uploadFile(preview.previewImageBuffer, {
            bucket: 'papers',
            path: `${user.id}/previews`,
            contentType: 'image/png'
          })
          previewImagePath = imagePath
        }
      }

      // Upload original file to storage
      const contentType = file.type || 'application/octet-stream'
      const { path } = await StorageService.uploadFile(processBuffer, {
        bucket: 'papers',
        path: user.id,
        contentType
      })

      storagePath = path

      logger.info({
        userId: user.id,
        fileName: file.name,
        fileType,
        pageCount,
        chunksCreated: chunks.length,
        storagePath,
        hasPreviewHtml: !!previewHtml,
        hasPreviewImage: !!previewImagePath,
      }, 'Document processed and uploaded')

    } else if (validatedData.source === 'url' && validatedData.url) {
      // For URL-based papers, we'll fetch and process later
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
          file_type: fileType,
          preview_html: previewHtml,
          preview_image_path: previewImagePath,
        } as any)
        .select()
        .single()

      if (dbError) {
        // Cleanup storage if database insert fails
        if (storagePath) {
          await StorageService.deleteFile('papers', storagePath)
        }
        if (previewImagePath) {
          await StorageService.deleteFile('papers', previewImagePath)
        }
        throw dbError
      }

      // Store chunks if available
      if (chunks.length > 0) {
        const chunkRecords = chunks.map(chunk => ({
          paper_id: (paper as any).id,
          page_no: chunk.pageNo,
          content: chunk.content,
          // Embeddings will be generated when RAG processing runs
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
      fileType,
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
