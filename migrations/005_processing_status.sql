-- Add processing status to papers table for background processing
ALTER TABLE papers ADD COLUMN IF NOT EXISTS processing_status TEXT DEFAULT 'pending';

-- Valid values: 'pending', 'processing', 'completed', 'failed'
-- Add index for querying papers by status
CREATE INDEX IF NOT EXISTS idx_papers_processing_status ON papers(processing_status);

-- Add error message column for failed processing
ALTER TABLE papers ADD COLUMN IF NOT EXISTS processing_error TEXT;
