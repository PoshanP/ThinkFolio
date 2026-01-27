-- Migration: Add multi-format document support
-- Adds file_type column to track document format
-- Adds preview_html to cache converted preview content
-- Adds preview_image_path for PPTX thumbnail storage

-- Add file_type column with default 'pdf' for backwards compatibility
ALTER TABLE papers ADD COLUMN IF NOT EXISTS file_type VARCHAR(20) DEFAULT 'pdf';

-- Add preview_html for cached HTML preview (DOCX, RTF, EPUB, HTML, CSV)
ALTER TABLE papers ADD COLUMN IF NOT EXISTS preview_html TEXT;

-- Add preview_image_path for PPTX first slide thumbnail
ALTER TABLE papers ADD COLUMN IF NOT EXISTS preview_image_path VARCHAR(500);

-- Update existing records to have 'pdf' as file_type
UPDATE papers SET file_type = 'pdf' WHERE file_type IS NULL;

-- Add index for filtering by file type
CREATE INDEX IF NOT EXISTS idx_papers_file_type ON papers(file_type);

-- Add constraint to ensure valid file types
ALTER TABLE papers DROP CONSTRAINT IF EXISTS papers_file_type_check;
ALTER TABLE papers ADD CONSTRAINT papers_file_type_check
  CHECK (file_type IN ('pdf', 'docx', 'txt', 'rtf', 'pptx', 'csv', 'epub', 'html'));
