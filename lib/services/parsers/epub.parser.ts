/**
 * EPUB book parser using epub2
 * Extracts chapters and generates HTML preview
 */

import EPub from 'epub2'
import { convert as htmlToText } from 'html-to-text'
import * as cheerio from 'cheerio'
import DOMPurify from 'isomorphic-dompurify'
import { DocumentParser, ParsedDocument, DocumentChunk } from '../document.service'
import { promisify } from 'util'
import { writeFile, unlink } from 'fs/promises'
import { tmpdir } from 'os'
import { join } from 'path'
import { randomUUID } from 'crypto'

const CHUNK_SIZE = 1500 // characters per chunk

interface EpubChapter {
  id: string
  title: string
  content: string
  order: number
}

export class EpubParser implements DocumentParser {
  async parse(buffer: Buffer): Promise<ParsedDocument> {
    const chapters = await this.extractChapters(buffer)
    const pageCount = chapters.length || 1

    // Combine all chapter text
    const text = chapters
      .map(ch => `${ch.title}\n\n${ch.content}`)
      .join('\n\n---\n\n')

    // Create chunks
    const chunks = this.createChunks(chapters)

    // Generate preview HTML
    const previewHtml = this.generatePreviewHtmlSync(chapters)

    // Extract metadata
    const metadata = await this.extractMetadata(buffer)

    return {
      text,
      pageCount,
      previewHtml,
      chunks,
      metadata,
    }
  }

  async generatePreviewHtml(buffer: Buffer): Promise<string> {
    const chapters = await this.extractChapters(buffer)
    return this.generatePreviewHtmlSync(chapters)
  }

  private async extractChapters(buffer: Buffer): Promise<EpubChapter[]> {
    // epub2 requires a file path, so we need to write to a temp file
    const tempPath = join(tmpdir(), `epub-${randomUUID()}.epub`)

    try {
      await writeFile(tempPath, buffer)

      const epub = await EPub.createAsync(tempPath)
      const chapters: EpubChapter[] = []

      // Get the flow (reading order)
      const flow = epub.flow || []

      for (let i = 0; i < flow.length; i++) {
        const item = flow[i]
        if (!item.id) continue

        try {
          const getChapter = promisify(epub.getChapter.bind(epub))
          const htmlContent = await getChapter(item.id)

          if (htmlContent) {
            // Extract plain text from HTML
            const textContent = htmlToText(htmlContent, {
              wordwrap: false,
              preserveNewlines: true,
              selectors: [
                { selector: 'a', options: { ignoreHref: true } },
                { selector: 'img', format: 'skip' },
              ],
            })

            if (textContent.trim()) {
              chapters.push({
                id: item.id,
                title: item.title || `Chapter ${i + 1}`,
                content: textContent.trim(),
                order: i + 1,
              })
            }
          }
        } catch {
          // Skip chapters that can't be read
          continue
        }
      }

      // If no chapters extracted from flow, try toc
      if (chapters.length === 0 && epub.toc) {
        for (let i = 0; i < epub.toc.length; i++) {
          const tocItem = epub.toc[i]
          if (!tocItem.id) continue

          try {
            const getChapter = promisify(epub.getChapter.bind(epub))
            const htmlContent = await getChapter(tocItem.id)

            if (htmlContent) {
              const textContent = htmlToText(htmlContent, {
                wordwrap: false,
                preserveNewlines: true,
              })

              if (textContent.trim()) {
                chapters.push({
                  id: tocItem.id,
                  title: tocItem.title || `Chapter ${i + 1}`,
                  content: textContent.trim(),
                  order: i + 1,
                })
              }
            }
          } catch {
            continue
          }
        }
      }

      return chapters
    } finally {
      // Clean up temp file
      try {
        await unlink(tempPath)
      } catch {
        // Ignore cleanup errors
      }
    }
  }

  private async extractMetadata(buffer: Buffer): Promise<Record<string, unknown>> {
    const tempPath = join(tmpdir(), `epub-meta-${randomUUID()}.epub`)

    try {
      await writeFile(tempPath, buffer)
      const epub = await EPub.createAsync(tempPath)

      return {
        title: epub.metadata?.title || null,
        creator: epub.metadata?.creator || null,
        publisher: epub.metadata?.publisher || null,
        language: epub.metadata?.language || null,
        description: epub.metadata?.description || null,
        date: epub.metadata?.date || null,
        subject: epub.metadata?.subject || null,
      }
    } finally {
      try {
        await unlink(tempPath)
      } catch {
        // Ignore cleanup errors
      }
    }
  }

  private generatePreviewHtmlSync(chapters: EpubChapter[]): string {
    const escapeHtml = (str: string): string => {
      return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
    }

    // Build table of contents
    const toc = chapters.map((ch, idx) => `
      <li><a href="#chapter-${idx}">${escapeHtml(ch.title)}</a></li>
    `).join('')

    // Build chapter content (show first 500 chars of each)
    const content = chapters.map((ch, idx) => {
      const preview = ch.content.length > 500
        ? ch.content.substring(0, 500) + '...'
        : ch.content

      return `
        <div id="chapter-${idx}" class="epub-chapter">
          <h2 class="chapter-title">${escapeHtml(ch.title)}</h2>
          <div class="chapter-content">${escapeHtml(preview).replace(/\n/g, '<br>')}</div>
        </div>
      `
    }).join('')

    return `
      <div style="font-family: Georgia, 'Times New Roman', serif; padding: 24px; max-width: 800px; margin: 0 auto;">
        <style>
          .epub-info { margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid #e5e7eb; }
          .epub-info h1 { font-size: 24px; margin: 0 0 8px; color: #1f2937; }
          .epub-info .meta { color: #6b7280; font-size: 14px; }
          .epub-toc { margin-bottom: 32px; }
          .epub-toc h3 { font-size: 16px; margin: 0 0 12px; color: #374151; }
          .epub-toc ul { list-style: none; padding: 0; margin: 0; }
          .epub-toc li { margin: 8px 0; }
          .epub-toc a { color: #3b82f6; text-decoration: none; font-size: 14px; }
          .epub-toc a:hover { text-decoration: underline; }
          .epub-chapter { margin-bottom: 32px; padding-bottom: 24px; border-bottom: 1px solid #e5e7eb; }
          .chapter-title { font-size: 20px; margin: 0 0 16px; color: #1f2937; }
          .chapter-content { font-size: 15px; line-height: 1.8; color: #374151; }
        </style>

        <div class="epub-info">
          <h1>EPUB Book</h1>
          <div class="meta">${chapters.length} chapter${chapters.length !== 1 ? 's' : ''}</div>
        </div>

        <div class="epub-toc">
          <h3>Table of Contents</h3>
          <ul>${toc}</ul>
        </div>

        ${content}
      </div>
    `
  }

  private createChunks(chapters: EpubChapter[]): DocumentChunk[] {
    const chunks: DocumentChunk[] = []

    for (const chapter of chapters) {
      // Split chapter content into chunks
      const words = chapter.content.split(/\s+/)
      let currentChunk = ''

      for (const word of words) {
        if ((currentChunk + ' ' + word).length > CHUNK_SIZE) {
          if (currentChunk.trim()) {
            chunks.push({
              content: `${chapter.title}\n\n${currentChunk.trim()}`,
              pageNo: chapter.order,
              metadata: {
                chapterId: chapter.id,
                chapterTitle: chapter.title,
              },
            })
          }
          currentChunk = word
        } else {
          currentChunk += (currentChunk ? ' ' : '') + word
        }
      }

      // Don't forget the last chunk
      if (currentChunk.trim()) {
        chunks.push({
          content: `${chapter.title}\n\n${currentChunk.trim()}`,
          pageNo: chapter.order,
          metadata: {
            chapterId: chapter.id,
            chapterTitle: chapter.title,
          },
        })
      }
    }

    return chunks.length > 0 ? chunks : [{ content: 'Empty EPUB', pageNo: 1 }]
  }
}
