-- Create saved_highlights table for storing user-highlighted text from AI responses
CREATE TABLE IF NOT EXISTS saved_highlights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  paper_id UUID NOT NULL REFERENCES papers(id) ON DELETE CASCADE,
  message_id UUID REFERENCES chat_messages(id) ON DELETE SET NULL,
  chunk_id UUID REFERENCES paper_chunks(id) ON DELETE SET NULL,
  highlighted_text TEXT NOT NULL,
  page_no INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_highlights_user_id ON saved_highlights(user_id);
CREATE INDEX IF NOT EXISTS idx_highlights_paper_id ON saved_highlights(paper_id);
CREATE INDEX IF NOT EXISTS idx_highlights_created_at ON saved_highlights(created_at);

-- Enable Row Level Security
ALTER TABLE saved_highlights ENABLE ROW LEVEL SECURITY;

-- Policy: Users can manage their own highlights
CREATE POLICY "Users can manage their own highlights"
ON saved_highlights
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
