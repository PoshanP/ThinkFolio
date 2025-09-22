export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      papers: {
        Row: {
          id: string
          user_id: string
          title: string
          source: string
          storage_path: string | null
          page_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          source: string
          storage_path?: string | null
          page_count: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          source?: string
          storage_path?: string | null
          page_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      paper_chunks: {
        Row: {
          id: string
          paper_id: string
          page_no: number
          content: string
          embedding: number[] | null
          created_at: string
        }
        Insert: {
          id?: string
          paper_id: string
          page_no: number
          content: string
          embedding?: number[] | null
          created_at?: string
        }
        Update: {
          id?: string
          paper_id?: string
          page_no?: number
          content?: string
          embedding?: number[] | null
          created_at?: string
        }
      }
      chat_sessions: {
        Row: {
          id: string
          user_id: string
          paper_id: string
          title: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          paper_id: string
          title: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          paper_id?: string
          title?: string
          created_at?: string
          updated_at?: string
        }
      }
      chat_messages: {
        Row: {
          id: string
          session_id: string
          role: 'user' | 'assistant' | 'system'
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          role: 'user' | 'assistant' | 'system'
          content: string
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          role?: 'user' | 'assistant' | 'system'
          content?: string
          created_at?: string
        }
      }
      message_citations: {
        Row: {
          id: string
          message_id: string
          chunk_id: string
          score: number
          page_no: number
          created_at: string
        }
        Insert: {
          id?: string
          message_id: string
          chunk_id: string
          score: number
          page_no: number
          created_at?: string
        }
        Update: {
          id?: string
          message_id?: string
          chunk_id?: string
          score?: number
          page_no?: number
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}