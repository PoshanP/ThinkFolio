-- Table for tracking a user's favourite papers/documents
CREATE TABLE IF NOT EXISTS paper_favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  paper_id UUID NOT NULL REFERENCES papers(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Prevent duplicates per user/paper
ALTER TABLE paper_favorites
ADD CONSTRAINT paper_favorites_user_paper_unique UNIQUE (user_id, paper_id);

-- Useful indexes
CREATE INDEX IF NOT EXISTS idx_paper_favorites_user_id ON paper_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_paper_favorites_paper_id ON paper_favorites(paper_id);

-- Enable Row Level Security
ALTER TABLE paper_favorites ENABLE ROW LEVEL SECURITY;

-- Policy: users can manage their own favourites
CREATE POLICY "Users can manage their own favourites"
ON paper_favorites
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
