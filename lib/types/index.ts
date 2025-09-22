import { z } from 'zod'

export const SignUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  fullName: z.string().min(1).optional(),
})

export const SignInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export const PaperUploadSchema = z.object({
  title: z.string().min(1),
  source: z.enum(['upload', 'url']),
  url: z.string().url().optional(),
})

export const ChatMessageSchema = z.object({
  sessionId: z.string().uuid(),
  content: z.string().min(1),
})

export const CreateSessionSchema = z.object({
  paperId: z.string().uuid(),
  title: z.string().min(1),
})

export type SignUpInput = z.infer<typeof SignUpSchema>
export type SignInInput = z.infer<typeof SignInSchema>
export type PaperUploadInput = z.infer<typeof PaperUploadSchema>
export type ChatMessageInput = z.infer<typeof ChatMessageSchema>
export type CreateSessionInput = z.infer<typeof CreateSessionSchema>

export interface ApiResponse<T = any> {
  data?: T
  error?: string
  code?: number
}

export interface PaginationParams {
  page?: number
  limit?: number
}

export interface Paper {
  id: string
  userId: string
  title: string
  source: string
  storagePath?: string
  pageCount: number
  createdAt: string
  updatedAt: string
}

export interface PaperChunk {
  id: string
  paperId: string
  pageNo: number
  content: string
  embedding?: number[]
}

export interface ChatSession {
  id: string
  userId: string
  paperId: string
  title: string
  createdAt: string
  updatedAt: string
}

export interface ChatMessage {
  id: string
  sessionId: string
  role: 'user' | 'assistant' | 'system'
  content: string
  createdAt: string
  citations?: Citation[]
}

export interface Citation {
  id: string
  messageId: string
  chunkId: string
  score: number
  pageNo: number
  content?: string
}