/**
 * Plain text file parser
 */

import { DocumentParser, ParsedDocument, DocumentChunk } from '../document.service'

const LINES_PER_PAGE = 50
const CHUNK_SIZE = 1000 // characters

export class TxtParser implements DocumentParser {
  async parse(buffer: Buffer): Promise<ParsedDocument> {
    const text = buffer.toString('utf-8')
    const lines = text.split('\n')
    const pageCount = Math.ceil(lines.length / LINES_PER_PAGE)
    const chunks = this.createChunks(text, lines)

    return {
      text,
      pageCount,
      previewHtml: this.generatePreviewHtmlSync(text),
      chunks,
    }
  }

  async generatePreviewHtml(buffer: Buffer): Promise<string> {
    const text = buffer.toString('utf-8')
    return this.generatePreviewHtmlSync(text)
  }

  private generatePreviewHtmlSync(text: string): string {
    // Escape HTML entities
    const escaped = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')

    return `<pre style="white-space: pre-wrap; word-wrap: break-word; font-family: monospace; font-size: 14px; line-height: 1.5; padding: 16px;">${escaped}</pre>`
  }

  private createChunks(text: string, lines: string[]): DocumentChunk[] {
    const chunks: DocumentChunk[] = []
    let currentChunk = ''
    let currentPageNo = 1
    let lineCount = 0

    for (const line of lines) {
      lineCount++
      currentChunk += line + '\n'

      // Check if we need to create a new chunk
      if (currentChunk.length >= CHUNK_SIZE) {
        chunks.push({
          content: currentChunk.trim(),
          pageNo: currentPageNo,
        })
        currentChunk = ''
      }

      // Update page number based on line count
      if (lineCount % LINES_PER_PAGE === 0) {
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
