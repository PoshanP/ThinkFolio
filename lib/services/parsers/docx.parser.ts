/**
 * DOCX (Word) document parser using mammoth
 */

import mammoth from 'mammoth'
import { DocumentParser, ParsedDocument, DocumentChunk } from '../document.service'

const PARAGRAPHS_PER_PAGE = 10
const CHUNK_SIZE = 1000 // characters

export class DocxParser implements DocumentParser {
  async parse(buffer: Buffer): Promise<ParsedDocument> {
    // Extract raw text for embedding/search
    const textResult = await mammoth.extractRawText({ buffer })
    const text = textResult.value

    // Generate HTML for preview
    const htmlResult = await mammoth.convertToHtml({ buffer })
    const previewHtml = this.wrapHtml(htmlResult.value)

    // Count paragraphs for page estimation
    const paragraphs = text.split(/\n\n+/).filter(p => p.trim())
    const pageCount = Math.ceil(paragraphs.length / PARAGRAPHS_PER_PAGE)

    // Create chunks
    const chunks = this.createChunks(text, paragraphs)

    return {
      text,
      pageCount,
      previewHtml,
      chunks,
      metadata: {
        messages: htmlResult.messages,
      },
    }
  }

  async generatePreviewHtml(buffer: Buffer): Promise<string> {
    const htmlResult = await mammoth.convertToHtml({ buffer })
    return this.wrapHtml(htmlResult.value)
  }

  private wrapHtml(html: string): string {
    return `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 14px; line-height: 1.6; padding: 24px; max-width: 800px; margin: 0 auto;">
        <style>
          .docx-preview h1 { font-size: 24px; margin: 24px 0 16px; }
          .docx-preview h2 { font-size: 20px; margin: 20px 0 12px; }
          .docx-preview h3 { font-size: 16px; margin: 16px 0 8px; }
          .docx-preview p { margin: 0 0 12px; }
          .docx-preview ul, .docx-preview ol { margin: 12px 0; padding-left: 24px; }
          .docx-preview li { margin: 4px 0; }
          .docx-preview table { border-collapse: collapse; margin: 16px 0; width: 100%; }
          .docx-preview th, .docx-preview td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          .docx-preview th { background: #f5f5f5; }
          .docx-preview img { max-width: 100%; height: auto; }
        </style>
        <div class="docx-preview">
          ${html}
        </div>
      </div>
    `
  }

  private createChunks(text: string, paragraphs: string[]): DocumentChunk[] {
    const chunks: DocumentChunk[] = []
    let currentChunk = ''
    let currentPageNo = 1
    let paragraphCount = 0

    for (const paragraph of paragraphs) {
      paragraphCount++
      currentChunk += paragraph + '\n\n'

      // Check if we need to create a new chunk
      if (currentChunk.length >= CHUNK_SIZE) {
        chunks.push({
          content: currentChunk.trim(),
          pageNo: currentPageNo,
        })
        currentChunk = ''
      }

      // Update page number based on paragraph count
      if (paragraphCount % PARAGRAPHS_PER_PAGE === 0) {
        currentPageNo++
      }
    }

    // Don't forget the last chunk
    if (currentChunk.trim()) {
      chunks.push({
        content: currentChunk.trim(),
        pageNo: currentPageNo,
      })
    }

    return chunks
  }
}
