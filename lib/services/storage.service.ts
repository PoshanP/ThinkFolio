import { createAdminClient } from '@/lib/supabase/admin'
import { createRequestLogger } from '@/lib/logger'
import { nanoid } from 'nanoid'
import sharp from 'sharp'

const logger = createRequestLogger('StorageService')

export interface StorageOptions {
  bucket: string
  path?: string
  contentType?: string
  upsert?: boolean
}

export class StorageService {
  private static readonly ALLOWED_MIME_TYPES = {
    'application/pdf': '.pdf',
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
  }

  private static readonly MAX_FILE_SIZE = {
    pdf: 50 * 1024 * 1024, // 50MB
    image: 10 * 1024 * 1024, // 10MB
  }

  static async uploadFile(
    file: Buffer,
    options: StorageOptions
  ): Promise<{ path: string; url: string }> {
    try {
      const client = createAdminClient()
      const fileName = this.generateFileName(options.contentType)
      const fullPath = options.path ? `${options.path}/${fileName}` : fileName

      logger.info({ bucket: options.bucket, path: fullPath }, 'Uploading file')

      const { data, error } = await client.storage
        .from(options.bucket)
        .upload(fullPath, file, {
          contentType: options.contentType,
          upsert: options.upsert || false,
          cacheControl: '3600',
        })

      if (error) {
        logger.error({ error }, 'File upload failed')
        throw error
      }

      const { data: urlData } = client.storage
        .from(options.bucket)
        .getPublicUrl(data.path)

      return {
        path: data.path,
        url: urlData.publicUrl,
      }
    } catch (error) {
      logger.error({ error }, 'Storage service error')
      throw new Error('Failed to upload file')
    }
  }

  static async deleteFile(bucket: string, path: string): Promise<void> {
    try {
      const client = createAdminClient()

      logger.info({ bucket, path }, 'Deleting file')

      const { error } = await client.storage
        .from(bucket)
        .remove([path])

      if (error) {
        logger.error({ error }, 'File deletion failed')
        throw error
      }
    } catch (error) {
      logger.error({ error }, 'Storage deletion error')
      throw new Error('Failed to delete file')
    }
  }

  static async downloadFile(bucket: string, path: string): Promise<Buffer> {
    try {
      const client = createAdminClient()

      logger.info({ bucket, path }, 'Downloading file')

      const { data, error } = await client.storage
        .from(bucket)
        .download(path)

      if (error) {
        logger.error({ error }, 'File download failed')
        throw error
      }

      const buffer = Buffer.from(await data.arrayBuffer())
      return buffer
    } catch (error) {
      logger.error({ error }, 'Storage download error')
      throw new Error('Failed to download file')
    }
  }

  static async processImage(
    buffer: Buffer,
    options?: {
      width?: number
      height?: number
      quality?: number
      format?: 'jpeg' | 'png' | 'webp'
    }
  ): Promise<Buffer> {
    try {
      let pipeline = sharp(buffer)

      if (options?.width || options?.height) {
        pipeline = pipeline.resize(options.width, options.height, {
          fit: 'inside',
          withoutEnlargement: true,
        })
      }

      if (options?.format) {
        pipeline = pipeline.toFormat(options.format, {
          quality: options.quality || 80,
        })
      }

      return await pipeline.toBuffer()
    } catch (error) {
      logger.error({ error }, 'Image processing error')
      throw new Error('Failed to process image')
    }
  }

  static validateFile(
    buffer: Buffer,
    mimeType: string,
    maxSize?: number
  ): void {
    if (!this.ALLOWED_MIME_TYPES[mimeType as keyof typeof this.ALLOWED_MIME_TYPES]) {
      throw new Error(`File type ${mimeType} is not allowed`)
    }

    const fileType = mimeType.startsWith('image/') ? 'image' : 'pdf'
    const sizeLimit = maxSize || this.MAX_FILE_SIZE[fileType as keyof typeof this.MAX_FILE_SIZE]

    if (buffer.length > sizeLimit) {
      throw new Error(`File size exceeds ${sizeLimit / (1024 * 1024)}MB limit`)
    }
  }

  private static generateFileName(mimeType?: string): string {
    const extension = mimeType
      ? this.ALLOWED_MIME_TYPES[mimeType as keyof typeof this.ALLOWED_MIME_TYPES] || ''
      : ''
    const timestamp = Date.now()
    const uniqueId = nanoid(10)
    return `${timestamp}-${uniqueId}${extension}`
  }

  static async createSignedUrl(
    bucket: string,
    path: string,
    expiresIn: number = 3600
  ): Promise<string> {
    try {
      const client = createAdminClient()

      const { data, error } = await client.storage
        .from(bucket)
        .createSignedUrl(path, expiresIn)

      if (error) {
        logger.error({ error }, 'Failed to create signed URL')
        throw error
      }

      return data.signedUrl
    } catch (error) {
      logger.error({ error }, 'Signed URL creation error')
      throw new Error('Failed to create signed URL')
    }
  }
}