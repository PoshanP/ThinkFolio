/**
 * MIME type utilities for multi-format document support
 */

export type FileType = 'pdf' | 'docx' | 'txt' | 'rtf' | 'pptx' | 'csv' | 'epub' | 'html'

export const MIME_TO_FILE_TYPE: Record<string, FileType> = {
  'application/pdf': 'pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'text/plain': 'txt',
  'application/rtf': 'rtf',
  'text/rtf': 'rtf',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
  'text/csv': 'csv',
  'application/csv': 'csv',
  'application/epub+zip': 'epub',
  'text/html': 'html',
  'application/xhtml+xml': 'html',
}

export const FILE_TYPE_TO_MIME: Record<FileType, string> = {
  pdf: 'application/pdf',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  txt: 'text/plain',
  rtf: 'application/rtf',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  csv: 'text/csv',
  epub: 'application/epub+zip',
  html: 'text/html',
}

export const FILE_TYPE_TO_EXTENSION: Record<FileType, string> = {
  pdf: '.pdf',
  docx: '.docx',
  txt: '.txt',
  rtf: '.rtf',
  pptx: '.pptx',
  csv: '.csv',
  epub: '.epub',
  html: '.html',
}

export const EXTENSION_TO_FILE_TYPE: Record<string, FileType> = {
  '.pdf': 'pdf',
  '.docx': 'docx',
  '.txt': 'txt',
  '.rtf': 'rtf',
  '.pptx': 'pptx',
  '.csv': 'csv',
  '.epub': 'epub',
  '.html': 'html',
  '.htm': 'html',
}

export const ALLOWED_MIME_TYPES = Object.keys(MIME_TO_FILE_TYPE)

export const ALLOWED_EXTENSIONS = Object.keys(EXTENSION_TO_FILE_TYPE)

export const FILE_TYPE_LABELS: Record<FileType, string> = {
  pdf: 'PDF Document',
  docx: 'Word Document',
  txt: 'Text File',
  rtf: 'Rich Text Format',
  pptx: 'PowerPoint Presentation',
  csv: 'CSV Spreadsheet',
  epub: 'EPUB Book',
  html: 'HTML Document',
}

export const FILE_TYPE_ICONS: Record<FileType, string> = {
  pdf: 'file-text',
  docx: 'file-text',
  txt: 'file-code',
  rtf: 'file-text',
  pptx: 'presentation',
  csv: 'table',
  epub: 'book',
  html: 'code',
}

/**
 * Get file type from MIME type
 */
export function getFileTypeFromMime(mimeType: string): FileType | null {
  return MIME_TO_FILE_TYPE[mimeType] || null
}

/**
 * Get file type from file extension
 */
export function getFileTypeFromExtension(filename: string): FileType | null {
  const ext = filename.toLowerCase().match(/\.[^.]+$/)?.[0]
  return ext ? EXTENSION_TO_FILE_TYPE[ext] || null : null
}

/**
 * Check if a MIME type is supported
 */
export function isSupportedMimeType(mimeType: string): boolean {
  return mimeType in MIME_TO_FILE_TYPE
}

/**
 * Check if a file extension is supported
 */
export function isSupportedExtension(filename: string): boolean {
  const ext = filename.toLowerCase().match(/\.[^.]+$/)?.[0]
  return ext ? ext in EXTENSION_TO_FILE_TYPE : false
}

/**
 * Get the accept string for file inputs
 */
export function getAcceptString(): string {
  return ALLOWED_EXTENSIONS.join(',')
}

/**
 * Max file sizes by file type (in bytes)
 */
export const MAX_FILE_SIZES: Record<FileType, number> = {
  pdf: 50 * 1024 * 1024,   // 50MB
  docx: 50 * 1024 * 1024,  // 50MB
  txt: 10 * 1024 * 1024,   // 10MB
  rtf: 20 * 1024 * 1024,   // 20MB
  pptx: 100 * 1024 * 1024, // 100MB (presentations can be large)
  csv: 50 * 1024 * 1024,   // 50MB
  epub: 50 * 1024 * 1024,  // 50MB
  html: 10 * 1024 * 1024,  // 10MB
}

/**
 * Get max file size for a file type
 */
export function getMaxFileSize(fileType: FileType): number {
  return MAX_FILE_SIZES[fileType]
}
