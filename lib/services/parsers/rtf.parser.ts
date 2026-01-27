/**
 * RTF (Rich Text Format) parser
 * Extracts plain text from RTF files
 */

import { DocumentParser, ParsedDocument, DocumentChunk } from '../document.service'

const LINES_PER_PAGE = 50
const CHUNK_SIZE = 1000 // characters

export class RtfParser implements DocumentParser {
  async parse(buffer: Buffer): Promise<ParsedDocument> {
    const rtfContent = buffer.toString('utf-8')
    const text = this.stripRtf(rtfContent)
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
    const rtfContent = buffer.toString('utf-8')
    const text = this.stripRtf(rtfContent)
    return this.generatePreviewHtmlSync(text)
  }

  /**
   * Strip RTF formatting and extract plain text
   * This is a simplified RTF parser that handles common RTF constructs
   */
  private stripRtf(rtf: string): string {
    // Remove RTF header and font tables
    let text = rtf

    // Remove RTF groups like {\fonttbl...}, {\colortbl...}, etc.
    text = text.replace(/\{\\[a-z]+[^{}]*\}/gi, '')

    // Remove RTF control words (e.g., \par, \b, \i)
    text = text.replace(/\\[a-z]+\d*\s?/gi, ' ')

    // Handle special characters
    text = text.replace(/\\'/g, '') // Remove escaped quotes
    text = text.replace(/\\'([0-9a-f]{2})/gi, (match, hex) => {
      return String.fromCharCode(parseInt(hex, 16))
    })

    // Remove curly braces
    text = text.replace(/[{}]/g, '')

    // Convert \n and \r
    text = text.replace(/\\n/g, '\n')
    text = text.replace(/\\r/g, '\r')

    // Remove backslashes
    text = text.replace(/\\/g, '')

    // Clean up multiple spaces and newlines
    text = text.replace(/[ \t]+/g, ' ')
    text = text.replace(/\n\s*\n/g, '\n\n')

    // Trim and return
    return text.trim()
  }

  private generatePreviewHtmlSync(text: string): string {
    // Escape HTML entities
    const escaped = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')

    // Convert double newlines to paragraphs
    const paragraphs = escaped.split(/\n\n+/)
    const html = paragraphs
      .map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`)
      .join('\n')

    return `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 14px; line-height: 1.6; padding: 24px; max-width: 800px; margin: 0 auto;">
        ${html}
      </div>
    `
  }

  private createChunks(text: string, lines: string[]): DocumentChunk[] {
    const chunks: DocumentChunk[] = []
    let currentChunk = ''
    let currentPageNo = 1
    let lineCount = 0

    for (const line of lines) {
      lineCount++
      currentChunk += line + '\n'

      if (currentChunk.length >= CHUNK_SIZE) {
        chunks.push({
          content: currentChunk.trim(),
          pageNo: currentPageNo,
        })
        currentChunk = ''
      }

      if (lineCount % LINES_PER_PAGE === 0) {
        currentPageNo++
      }
    }

    if (currentChunk.trim()) {
      chunks.push({
        content: currentChunk.trim(),
        pageNo: currentPageNo,
      })
    }

    return chunks
  }
}
