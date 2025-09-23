-- Supabase Database Optimizations for RAG Performance
-- Run these in Supabase Dashboard > SQL Editor

-- 1. Enable pgvector extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Check current table structure
-- Run this first to see your embedding column type
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'paper_chunks' AND column_name = 'embedding';

-- 3. Create vector index for similarity search (MASSIVE speedup)
-- Note: Use ivfflat for large datasets, hnsw for smaller datasets
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_paper_chunks_embedding_ivfflat
ON paper_chunks USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Alternative: HNSW index (better for smaller datasets)
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_paper_chunks_embedding_hnsw
-- ON paper_chunks USING hnsw (embedding vector_cosine_ops)
-- WITH (m = 16, ef_construction = 64);

-- 4. Create standard indexes for common queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_paper_chunks_paper_id
ON paper_chunks (paper_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_paper_chunks_page_no
ON paper_chunks (paper_id, page_no);

-- 5. Chat/conversation indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_chat_messages_session_created
ON chat_messages (session_id, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_chat_sessions_user_updated
ON chat_sessions (user_id, updated_at DESC);

-- 6. Processing status indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_processing_status_paper
ON document_processing_status (paper_id, status);

-- 7. Create optimized query function for vector search
CREATE OR REPLACE FUNCTION match_paper_chunks_optimized(
  query_embedding vector(1536),
  paper_id_filter uuid DEFAULT NULL,
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  id uuid,
  content text,
  page_no int,
  similarity float
)
LANGUAGE sql STABLE
AS $$
  SELECT
    pc.id,
    pc.content,
    pc.page_no,
    1 - (pc.embedding <=> query_embedding) AS similarity
  FROM paper_chunks pc
  WHERE
    (paper_id_filter IS NULL OR pc.paper_id = paper_id_filter)
    AND 1 - (pc.embedding <=> query_embedding) > match_threshold
  ORDER BY pc.embedding <=> query_embedding
  LIMIT match_count;
$$;

-- 8. Analyze tables for better query planning
ANALYZE paper_chunks;
ANALYZE chat_messages;
ANALYZE chat_sessions;

-- 9. Check index usage (run after creating indexes)
-- SELECT schemaname, tablename, indexname, idx_tup_read, idx_tup_fetch
-- FROM pg_stat_user_indexes
-- WHERE tablename IN ('paper_chunks', 'chat_messages');

-- 10. Estimate index sizes
SELECT
  schemaname,
  tablename,
  indexname,
  pg_size_pretty(pg_relation_size(indexrelid)) as size
FROM pg_stat_user_indexes
WHERE tablename = 'paper_chunks';