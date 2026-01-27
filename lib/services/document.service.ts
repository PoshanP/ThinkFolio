/**
 * Document Service Factory
 * Routes document processing to the correct parser based on file type
 */

import { FileType, getFileTypeFromMime } from '@/lib/utils/mimeTypes'
import { TxtParser } from './parsers/txt.parser'
import { DocxParser } from './parsers/docx.parser'
import { RtfParser } from './parsers/rtf.parser'
import { CsvParser } from './parsers/csv.parser'
import { HtmlParser } from './parsers/html.parser'
import { PptxParser } from './parsers/pptx.parser'
import { EpubParser } from './parsers/epub.parser'
import { PDFService } from './pdf.service'
import { createRequestLogger } from '@/lib/logger'

const logger = createRequestLogger('DocumentService')

export interface ParsedDocument {
  text: string
  pageCount: number
  previewHtml?: string
  previewImageBuffer?: Buffer
  metadata?: Record<string, unknown>
  chunks?: DocumentChunk[]
}

export interface DocumentChunk {
  content: string
  pageNo: number
  metadata?: Record<string, unknown>
}

export interface DocumentParser {
  parse(buffer: Buffer, filename?: string): Promise<ParsedDocument>
  generatePreviewHtml?(buffer: Buffer): Promise<string>
  generatePreviewImage?(buffer: Buffer): Promise<Buffer>
}

/**
 * Get the appropriate parser for a file type
 */
export function getParser(fileType: FileType): DocumentParser {
  switch (fileType) {
    case 'txt':
      return new TxtParser()
    case 'docx':
      return new DocxParser()
    case 'rtf':
      return new RtfParser()
    case 'csv':
      return new CsvParser()
    case 'html':
      return new HtmlParser()
    case 'pptx':
      return new PptxParser()
    case 'epub':
      return new EpubParser()
    case 'pdf':
    default:
      return new PdfParserAdapter()
  }
}

/**
 * Parse a document and return extracted content
 */
export async function parseDocument(
  buffer: Buffer,
  mimeType: string,
  filename?: string
): Promise<ParsedDocument & { fileType: FileType }> {
  const fileType = getFileTypeFromMime(mimeType)

  if (!fileType) {
    throw new Error(`Unsupported file type: ${mimeType}`)
  }

  logger.info({ fileType, mimeType, filename }, 'Parsing document')

  const parser = getParser(fileType)
  const result = await parser.parse(buffer, filename)

  return {
    ...result,
    fileType,
  }
}

/**
 * Generate preview HTML for a document
 */
export async function generatePreview(
  buffer: Buffer,
  fileType: FileType,
  filename?: string
): Promise<{ previewHtml?: string; previewImageBuffer?: Buffer }> {
  const parser = getParser(fileType)

  const result: { previewHtml?: string; previewImageBuffer?: Buffer } = {}

  if (parser.generatePreviewHtml) {
    result.previewHtml = await parser.generatePreviewHtml(buffer)
  }

  if (parser.generatePreviewImage) {
    result.previewImageBuffer = await parser.generatePreviewImage(buffer)
  }

  return result
}

/**
 * Adapter for existing PDFService to match DocumentParser interface
 */
class PdfParserAdapter implements DocumentParser {
  async parse(buffer: Buffer): Promise<ParsedDocument> {
    const metadata = await PDFService.extractMetadata(buffer)

    return {
      text: metadata.textContent,
      pageCount: metadata.pageCount,
      metadata: {
        title: metadata.title,
        author: metadata.author,
        subject: metadata.subject,
        creationDate: metadata.creationDate,
        modificationDate: metadata.modificationDate,
      },
      chunks: metadata.chunks.map(chunk => ({
        content: chunk.content,
        pageNo: chunk.pageNumber,
      })),
    }
  }
}

export type { FileType }
