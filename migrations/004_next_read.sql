-- Add is_next_read column to papers table for "Next Read" feature
-- Papers marked as next_read won't open immediately after upload

ALTER TABLE papers ADD COLUMN IF NOT EXISTS is_next_read BOOLEAN DEFAULT FALSE;

-- Index for efficient querying of next_read papers by user
CREATE INDEX IF NOT EXISTS idx_papers_next_read ON papers(user_id, is_next_read) WHERE is_next_read = TRUE;
