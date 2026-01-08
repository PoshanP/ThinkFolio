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

export const ChatMessageSchema = z.object({
  sessionId: z.string().uuid(),
  content: z.string().min(1),
})

export const CreateSessionSchema = z.object({
  paperId: z.string().uuid(),
  title: z.string().min(1),
})

export interface ApiResponse<T = unknown> {
  data?: T
  error?: string
  code?: number
}
