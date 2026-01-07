-- Drop is_next_read column from papers table
-- This feature is now handled by the "To Read" collection (a system collection)

-- Drop the index first
DROP INDEX IF EXISTS idx_papers_next_read;

-- Drop the column
ALTER TABLE papers DROP COLUMN IF EXISTS is_next_read;
