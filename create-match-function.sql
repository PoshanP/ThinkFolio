-- Create the match_paper_chunks function for vector similarity search
-- This function matches the signature expected by the LangChain Supabase integration

CREATE OR REPLACE FUNCTION match_paper_chunks(
  query_embedding vector(1536),
  match_count int DEFAULT 5,
  filter jsonb DEFAULT '{}'::jsonb
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

-- Create index for faster vector similarity search if it doesn't exist
CREATE INDEX IF NOT EXISTS paper_chunks_embedding_idx
ON paper_chunks USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);