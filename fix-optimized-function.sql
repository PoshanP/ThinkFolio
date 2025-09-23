-- Fix the optimized function to match the actual table structure
-- The paper_chunks table doesn't have a metadata column

DROP FUNCTION IF EXISTS match_paper_chunks_optimized;

CREATE OR REPLACE FUNCTION match_paper_chunks_optimized(
  filter jsonb DEFAULT '{}',
  match_count int DEFAULT 10,
  query_embedding vector(3072) DEFAULT NULL
)
RETURNS TABLE(
  id uuid,
  paper_id uuid,
  page_no integer,
  content text,
  embedding vector,
  similarity double precision
)
LANGUAGE plpgsql
AS $$
DECLARE
  paper_id_filter uuid;
  match_threshold float;
BEGIN
  -- Check if query_embedding is provided
  IF query_embedding IS NULL THEN
    RAISE EXCEPTION 'query_embedding parameter is required';
  END IF;

  -- Extract paper_id from filter
  paper_id_filter := (filter->>'paper_id')::uuid;

  -- Set match threshold (default 0.78 if not provided)
  match_threshold := COALESCE((filter->>'match_threshold')::float, 0.78);

  RETURN QUERY
  SELECT
    pc.id,
    pc.paper_id,
    pc.page_no,
    pc.content,
    pc.embedding,
    (pc.embedding <=> query_embedding) * -1 + 1 AS similarity
  FROM paper_chunks pc
  WHERE
    (paper_id_filter IS NULL OR pc.paper_id = paper_id_filter)
    AND (pc.embedding <=> query_embedding) < (1 - match_threshold)
  ORDER BY pc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;