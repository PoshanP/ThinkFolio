-- Check paper_chunks table structure
\d paper_chunks;

-- Check if vector extension exists
SELECT * FROM pg_extension WHERE extname = 'vector';

-- Check for existing match functions
SELECT routine_name, routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name LIKE '%match%';

-- Check paper_chunks columns specifically
SELECT column_name, data_type, character_maximum_length
FROM information_schema.columns
WHERE table_name = 'paper_chunks'
AND table_schema = 'public';