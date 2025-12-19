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
      profiles: {
        Row: {
          id: string
          email: string | null
          name: string | null
          theme_preference: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email?: string | null
          name?: string | null
          theme_preference?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string | null
          name?: string | null
          theme_preference?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      paper_favorites: {
        Row: {
          id: string
          user_id: string
          paper_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          paper_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          paper_id?: string
          created_at?: string
        }
        Relationships: []
      }
      papers: {
        Row: {
          id: string
          user_id: string
          title: string
          source: string
          storage_path: string | null
          page_count: number
          is_next_read: boolean
          processing_status: 'pending' | 'processing' | 'completed' | 'failed'
          processing_error: string | null
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
          is_next_read?: boolean
          processing_status?: 'pending' | 'processing' | 'completed' | 'failed'
          processing_error?: string | null
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
          is_next_read?: boolean
          processing_status?: 'pending' | 'processing' | 'completed' | 'failed'
          processing_error?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
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
        Relationships: []
      }
      chat_sessions: {
        Row: {
          id: string
          user_id: string
          paper_id: string | null
          title: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          paper_id?: string | null
          title: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          paper_id?: string | null
          title?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          id: string
          session_id: string
          role: 'user' | 'assistant' | 'system'
          content: string
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          role: 'user' | 'assistant' | 'system'
          content: string
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          role?: 'user' | 'assistant' | 'system'
          content?: string
          metadata?: Json | null
          created_at?: string
        }
        Relationships: []
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
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      exec_sql: {
        Args: { sql: string }
        Returns: undefined
      }
      sql: {
        Args: { query: string }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}
