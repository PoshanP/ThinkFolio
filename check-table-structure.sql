-- Check the structure of paper_chunks table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'paper_chunks'
  AND table_schema = 'public'
ORDER BY ordinal_position;