/**
 * PPTX (PowerPoint) parser using officeparser
 * Extracts slide text and generates first slide preview image
 */

import officeParser from 'officeparser'
import sharp from 'sharp'
import { DocumentParser, ParsedDocument, DocumentChunk } from '../document.service'

export class PptxParser implements DocumentParser {
  async parse(buffer: Buffer): Promise<ParsedDocument> {
    // Extract text from PPTX using officeparser
    const text = await officeParser.parseOfficeAsync(buffer)

    // Split text by potential slide boundaries
    // officeParser returns text with slides separated by multiple newlines
    const slideTexts = text
      .split(/\n{3,}/)
      .map(s => s.trim())
      .filter(s => s.length > 0)

    const pageCount = Math.max(slideTexts.length, 1)

    // Create chunks (one per slide)
    const chunks = this.createChunks(slideTexts)

    // Generate preview HTML showing slide content as text
    const previewHtml = this.generatePreviewHtmlSync(slideTexts)

    return {
      text,
      pageCount,
      previewHtml,
      chunks,
      metadata: {
        slideCount: pageCount,
      },
    }
  }

  async generatePreviewHtml(buffer: Buffer): Promise<string> {
    const text = await officeParser.parseOfficeAsync(buffer)
    const slideTexts = text
      .split(/\n{3,}/)
      .map(s => s.trim())
      .filter(s => s.length > 0)

    return this.generatePreviewHtmlSync(slideTexts)
  }

  /**
   * Generate a placeholder image for PPTX preview
   * Since extracting actual slide images requires complex rendering,
   * we create a styled placeholder with slide count
   */
  async generatePreviewImage(buffer: Buffer): Promise<Buffer> {
    const text = await officeParser.parseOfficeAsync(buffer)
    const slideTexts = text
      .split(/\n{3,}/)
      .map(s => s.trim())
      .filter(s => s.length > 0)

    const slideCount = Math.max(slideTexts.length, 1)

    // Get first slide text for preview
    const firstSlideText = slideTexts[0] || 'PowerPoint Presentation'
    const truncatedText = firstSlideText.length > 100
      ? firstSlideText.substring(0, 100) + '...'
      : firstSlideText

    // Create an SVG with slide info
    const svg = `
      <svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#3b82f6;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#1d4ed8;stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="800" height="600" fill="url(#bg)"/>
        <rect x="40" y="40" width="720" height="520" rx="8" fill="white" opacity="0.95"/>

        <!-- Slide icon -->
        <rect x="60" y="60" width="60" height="45" rx="4" fill="#3b82f6" opacity="0.2"/>
        <rect x="65" y="65" width="50" height="35" rx="2" fill="#3b82f6"/>

        <!-- Title area -->
        <text x="140" y="90" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="#1f2937">
          PowerPoint Presentation
        </text>
        <text x="140" y="115" font-family="Arial, sans-serif" font-size="14" fill="#6b7280">
          ${slideCount} slide${slideCount !== 1 ? 's' : ''}
        </text>

        <!-- Divider -->
        <line x1="60" y1="140" x2="740" y2="140" stroke="#e5e7eb" stroke-width="1"/>

        <!-- First slide preview text -->
        <text x="60" y="180" font-family="Arial, sans-serif" font-size="16" fill="#374151">
          <tspan x="60" dy="0">Slide 1:</tspan>
        </text>
        <foreignObject x="60" y="190" width="680" height="350">
          <div xmlns="http://www.w3.org/1999/xhtml" style="font-family: Arial, sans-serif; font-size: 14px; color: #4b5563; line-height: 1.6; overflow: hidden;">
            ${this.escapeXml(truncatedText)}
          </div>
        </foreignObject>
      </svg>
    `

    // Convert SVG to PNG using sharp
    return sharp(Buffer.from(svg))
      .png()
      .toBuffer()
  }

  private escapeXml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')
  }

  private generatePreviewHtmlSync(slideTexts: string[]): string {
    const escapeHtml = (str: string): string => {
      return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/\n/g, '<br>')
    }

    const slides = slideTexts.map((text, index) => `
      <div class="pptx-slide">
        <div class="slide-number">Slide ${index + 1}</div>
        <div class="slide-content">${escapeHtml(text)}</div>
      </div>
    `).join('')

    return `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 16px;">
        <style>
          .pptx-info { margin-bottom: 16px; color: #666; font-size: 14px; }
          .pptx-slide {
            background: white;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            margin-bottom: 16px;
            overflow: hidden;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          }
          .slide-number {
            background: #3b82f6;
            color: white;
            padding: 8px 16px;
            font-size: 13px;
            font-weight: 600;
          }
          .slide-content {
            padding: 16px;
            font-size: 14px;
            line-height: 1.6;
            color: #374151;
            min-height: 100px;
          }
        </style>
        <div class="pptx-info">
          ${slideTexts.length} slide${slideTexts.length !== 1 ? 's' : ''}
        </div>
        ${slides}
      </div>
    `
  }

  private createChunks(slideTexts: string[]): DocumentChunk[] {
    return slideTexts.map((text, index) => ({
      content: `Slide ${index + 1}:\n${text}`,
      pageNo: index + 1,
      metadata: {
        slideNumber: index + 1,
      },
    }))
  }
}
