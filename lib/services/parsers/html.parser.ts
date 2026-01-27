/**
 * HTML document parser using cheerio
 */

import * as cheerio from 'cheerio'
import { convert as htmlToText } from 'html-to-text'
import DOMPurify from 'isomorphic-dompurify'
import { DocumentParser, ParsedDocument, DocumentChunk } from '../document.service'

const SECTIONS_PER_PAGE = 5
const CHUNK_SIZE = 1000 // characters

export class HtmlParser implements DocumentParser {
  async parse(buffer: Buffer): Promise<ParsedDocument> {
    const htmlContent = buffer.toString('utf-8')
    const $ = cheerio.load(htmlContent)

    // Remove script and style tags
    $('script, style, noscript').remove()

    // Extract text content
    const text = htmlToText($.html(), {
      wordwrap: false,
      preserveNewlines: true,
      selectors: [
        { selector: 'a', options: { ignoreHref: true } },
        { selector: 'img', format: 'skip' },
      ],
    })

    // Count sections for page estimation
    const sections = this.extractSections($)
    const pageCount = Math.ceil(sections.length / SECTIONS_PER_PAGE) || 1

    // Create chunks based on sections
    const chunks = this.createChunks(sections)

    // Generate sanitized preview HTML
    const previewHtml = this.sanitizeHtml(htmlContent)

    // Extract metadata
    const metadata = this.extractMetadata($)

    return {
      text,
      pageCount,
      previewHtml,
      chunks,
      metadata,
    }
  }

  async generatePreviewHtml(buffer: Buffer): Promise<string> {
    const htmlContent = buffer.toString('utf-8')
    return this.sanitizeHtml(htmlContent)
  }

  private sanitizeHtml(html: string): string {
    const $ = cheerio.load(html)

    // Remove potentially dangerous elements
    $('script, style, noscript, iframe, object, embed, form, input, button').remove()

    // Get body content or full HTML if no body
    let content = $('body').html() || $.html()

    // Sanitize with DOMPurify
    content = DOMPurify.sanitize(content, {
      ALLOWED_TAGS: [
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'p', 'br', 'hr',
        'ul', 'ol', 'li',
        'table', 'thead', 'tbody', 'tr', 'th', 'td',
        'blockquote', 'pre', 'code',
        'strong', 'b', 'em', 'i', 'u', 's', 'mark',
        'a', 'img',
        'div', 'span',
        'article', 'section', 'header', 'footer', 'main', 'nav', 'aside',
        'figure', 'figcaption',
        'dl', 'dt', 'dd',
        'sub', 'sup',
      ],
      ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'id'],
      ALLOW_DATA_ATTR: false,
    })

    return `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 14px; line-height: 1.6; padding: 24px; max-width: 900px; margin: 0 auto;">
        <style>
          .html-preview h1 { font-size: 28px; margin: 24px 0 16px; }
          .html-preview h2 { font-size: 22px; margin: 20px 0 12px; }
          .html-preview h3 { font-size: 18px; margin: 16px 0 8px; }
          .html-preview p { margin: 0 0 12px; }
          .html-preview ul, .html-preview ol { margin: 12px 0; padding-left: 24px; }
          .html-preview li { margin: 4px 0; }
          .html-preview table { border-collapse: collapse; margin: 16px 0; width: 100%; }
          .html-preview th, .html-preview td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          .html-preview th { background: #f5f5f5; }
          .html-preview img { max-width: 100%; height: auto; }
          .html-preview a { color: #0066cc; text-decoration: none; }
          .html-preview a:hover { text-decoration: underline; }
          .html-preview blockquote { border-left: 4px solid #ddd; margin: 16px 0; padding-left: 16px; color: #666; }
          .html-preview pre { background: #f5f5f5; padding: 12px; overflow-x: auto; border-radius: 4px; }
          .html-preview code { background: #f5f5f5; padding: 2px 4px; border-radius: 3px; font-family: monospace; }
        </style>
        <div class="html-preview">
          ${content}
        </div>
      </div>
    `
  }

  private extractMetadata($: cheerio.CheerioAPI): Record<string, unknown> {
    return {
      title: $('title').text() || $('h1').first().text() || null,
      description: $('meta[name="description"]').attr('content') || null,
      author: $('meta[name="author"]').attr('content') || null,
      keywords: $('meta[name="keywords"]').attr('content') || null,
    }
  }

  private extractSections($: cheerio.CheerioAPI): string[] {
    const sections: string[] = []

    // Try to split by headings
    $('h1, h2, h3, h4, h5, h6').each((_, el) => {
      let content = $(el).text()
      let sibling = $(el).next()

      while (sibling.length && !sibling.is('h1, h2, h3, h4, h5, h6')) {
        content += '\n' + sibling.text()
        sibling = sibling.next()
      }

      if (content.trim()) {
        sections.push(content.trim())
      }
    })

    // If no headings, split by paragraphs
    if (sections.length === 0) {
      $('p').each((_, el) => {
        const text = $(el).text().trim()
        if (text) {
          sections.push(text)
        }
      })
    }

    // Fallback to body text split by double newlines
    if (sections.length === 0) {
      const bodyText = $('body').text() || $.text()
      const parts = bodyText.split(/\n\n+/).filter(p => p.trim())
      sections.push(...parts)
    }

    return sections
  }

  private createChunks(sections: string[]): DocumentChunk[] {
    const chunks: DocumentChunk[] = []
    let currentChunk = ''
    let currentPageNo = 1
    let sectionCount = 0

    for (const section of sections) {
      sectionCount++
      currentChunk += section + '\n\n'

      if (currentChunk.length >= CHUNK_SIZE) {
        chunks.push({
          content: currentChunk.trim(),
          pageNo: currentPageNo,
        })
        currentChunk = ''
      }

      if (sectionCount % SECTIONS_PER_PAGE === 0) {
        currentPageNo++
      }
    }

    if (currentChunk.trim()) {
      chunks.push({
        content: currentChunk.trim(),
        pageNo: currentPageNo,
      })
    }

    return chunks.length > 0 ? chunks : [{ content: sections.join('\n\n'), pageNo: 1 }]
  }
}
