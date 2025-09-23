-- Drop ALL versions of the match_paper_chunks function
DROP FUNCTION IF EXISTS match_paper_chunks(vector, int, jsonb);
DROP FUNCTION IF EXISTS match_paper_chunks(jsonb, int, vector);

-- Create only ONE version with the correct parameter order for LangChain
CREATE OR REPLACE FUNCTION match_paper_chunks(
  filter jsonb,
  match_count int,
  query_embedding vector(1536)
)
RETURNS TABLE (
  id uuid,
  paper_id uuid,
  page_no int,
  content text,
  embedding vector(1536),
  similarity float
)
LANGUAGE plpgsql
AS $$
DECLARE
  filter_paper_id uuid;
BEGIN
  -- Extract paper_id from filter if provided
  IF filter ? 'paper_id' THEN
    filter_paper_id := (filter->>'paper_id')::uuid;
  END IF;

  RETURN QUERY
  SELECT
    pc.id,
    pc.paper_id,
    pc.page_no,
    pc.content,
    pc.embedding,
    1 - (pc.embedding <=> query_embedding) AS similarity
  FROM paper_chunks pc
  WHERE
    (filter_paper_id IS NULL OR pc.paper_id = filter_paper_id)
  ORDER BY pc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;