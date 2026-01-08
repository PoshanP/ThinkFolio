export interface ChatMessage {
  id: string;
  content: string;
  role: "user" | "assistant";
  created_at: string;
  session_id?: string;
  metadata?: {
    is_loading?: boolean;
    is_system_summary?: boolean;
    citations?: Array<{
      page_no: number;
      score: number;
    }>;
  };
}

export interface ChatSession {
  id: string;
  paper_id: string | null;
  title: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  paper?: {
    title: string;
  };
}
