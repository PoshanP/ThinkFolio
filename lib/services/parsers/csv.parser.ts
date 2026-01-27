/**
 * CSV file parser using papaparse
 */

import Papa from 'papaparse'
import { DocumentParser, ParsedDocument, DocumentChunk } from '../document.service'

const ROWS_PER_PAGE = 100
const ROWS_PER_CHUNK = 50

export class CsvParser implements DocumentParser {
  async parse(buffer: Buffer): Promise<ParsedDocument> {
    const csvContent = buffer.toString('utf-8')
    const result = Papa.parse(csvContent, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
    })

    const rows = result.data as Record<string, unknown>[]
    const headers = result.meta.fields || []
    const pageCount = Math.ceil(rows.length / ROWS_PER_PAGE)

    // Create text representation for embedding
    const text = this.createTextRepresentation(headers, rows)

    // Create chunks (include header with each chunk for context)
    const chunks = this.createChunks(headers, rows)

    // Generate HTML preview
    const previewHtml = this.generatePreviewHtmlSync(headers, rows)

    return {
      text,
      pageCount,
      previewHtml,
      chunks,
      metadata: {
        rowCount: rows.length,
        columnCount: headers.length,
        headers,
        errors: result.errors,
      },
    }
  }

  async generatePreviewHtml(buffer: Buffer): Promise<string> {
    const csvContent = buffer.toString('utf-8')
    const result = Papa.parse(csvContent, {
      header: true,
      skipEmptyLines: true,
    })

    const rows = result.data as Record<string, unknown>[]
    const headers = result.meta.fields || []

    return this.generatePreviewHtmlSync(headers, rows)
  }

  private createTextRepresentation(headers: string[], rows: Record<string, unknown>[]): string {
    const lines: string[] = []

    // Add header line
    lines.push('Columns: ' + headers.join(', '))
    lines.push('')

    // Add rows as text
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const rowText = headers
        .map(h => `${h}: ${row[h] ?? ''}`)
        .join(' | ')
      lines.push(`Row ${i + 1}: ${rowText}`)
    }

    return lines.join('\n')
  }

  private generatePreviewHtmlSync(headers: string[], rows: Record<string, unknown>[]): string {
    // Limit rows for preview
    const previewRows = rows.slice(0, 100)
    const hasMore = rows.length > 100

    const escapeHtml = (str: unknown): string => {
      const s = String(str ?? '')
      return s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
    }

    const headerCells = headers.map(h => `<th>${escapeHtml(h)}</th>`).join('')
    const bodyRows = previewRows.map(row => {
      const cells = headers.map(h => `<td>${escapeHtml(row[h])}</td>`).join('')
      return `<tr>${cells}</tr>`
    }).join('')

    return `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 16px;">
        <style>
          .csv-preview { width: 100%; border-collapse: collapse; font-size: 13px; }
          .csv-preview th {
            background: #f5f5f5;
            border: 1px solid #ddd;
            padding: 8px 12px;
            text-align: left;
            font-weight: 600;
            position: sticky;
            top: 0;
          }
          .csv-preview td {
            border: 1px solid #ddd;
            padding: 6px 12px;
            max-width: 300px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
          .csv-preview tr:nth-child(even) { background: #fafafa; }
          .csv-preview tr:hover { background: #f0f0f0; }
          .csv-info { margin-bottom: 12px; color: #666; font-size: 14px; }
        </style>
        <div class="csv-info">
          ${rows.length} rows, ${headers.length} columns
          ${hasMore ? ' (showing first 100 rows)' : ''}
        </div>
        <table class="csv-preview">
          <thead><tr>${headerCells}</tr></thead>
          <tbody>${bodyRows}</tbody>
        </table>
      </div>
    `
  }

  private createChunks(headers: string[], rows: Record<string, unknown>[]): DocumentChunk[] {
    const chunks: DocumentChunk[] = []
    const headerLine = 'Columns: ' + headers.join(', ')

    for (let i = 0; i < rows.length; i += ROWS_PER_CHUNK) {
      const chunkRows = rows.slice(i, i + ROWS_PER_CHUNK)
      const pageNo = Math.floor(i / ROWS_PER_PAGE) + 1

      const content = [
        headerLine,
        '',
        ...chunkRows.map((row, idx) => {
          const rowText = headers
            .map(h => `${h}: ${row[h] ?? ''}`)
            .join(' | ')
          return `Row ${i + idx + 1}: ${rowText}`
        }),
      ].join('\n')

      chunks.push({
        content,
        pageNo,
        metadata: {
          startRow: i + 1,
          endRow: i + chunkRows.length,
        },
      })
    }

    return chunks
  }
}
