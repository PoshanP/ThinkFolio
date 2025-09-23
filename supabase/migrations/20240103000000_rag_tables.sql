-- RAG-specific tables for enhanced document processing and retrieval
-- This migration adds tables needed for the RAG agent functionality

-- Document processing status tracking
CREATE TABLE IF NOT EXISTS document_processing_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    paper_id UUID REFERENCES papers(id) ON DELETE CASCADE NOT NULL,
    status TEXT CHECK (status IN ('pending', 'processing', 'completed', 'failed')) NOT NULL DEFAULT 'pending',
    total_chunks INTEGER DEFAULT 0,
    processed_chunks INTEGER DEFAULT 0,
    error_message TEXT,
    processing_started_at TIMESTAMP WITH TIME ZONE,
    processing_completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enhanced paper chunks with metadata for better retrieval
CREATE TABLE IF NOT EXISTS paper_chunks_metadata (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chunk_id UUID REFERENCES paper_chunks(id) ON DELETE CASCADE NOT NULL,
    chunk_index INTEGER NOT NULL,
    chunk_type TEXT CHECK (chunk_type IN ('title', 'abstract', 'introduction', 'methodology', 'results', 'conclusion', 'references', 'body', 'figure_caption', 'table')) DEFAULT 'body',
    semantic_density REAL,
    keyword_count INTEGER DEFAULT 0,
    has_equations BOOLEAN DEFAULT FALSE,
    has_citations BOOLEAN DEFAULT FALSE,
    language TEXT DEFAULT 'en',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Vector index configuration for different embedding models
CREATE TABLE IF NOT EXISTS vector_index_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    index_name TEXT UNIQUE NOT NULL,
    embedding_model TEXT NOT NULL,
    embedding_dimension INTEGER NOT NULL,
    distance_metric TEXT CHECK (distance_metric IN ('cosine', 'euclidean', 'dot_product')) DEFAULT 'cosine',
    index_type TEXT CHECK (index_type IN ('hnsw', 'ivfflat', 'flat')) DEFAULT 'hnsw',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RAG query logs for performance monitoring and optimization
CREATE TABLE IF NOT EXISTS rag_query_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE,
    query TEXT NOT NULL,
    query_embedding vector(1536),
    retrieval_method TEXT CHECK (retrieval_method IN ('semantic', 'keyword', 'hybrid')) DEFAULT 'hybrid',
    num_chunks_retrieved INTEGER,
    retrieval_time_ms INTEGER,
    reranking_time_ms INTEGER,
    total_time_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Retrieved chunks tracking for analysis
CREATE TABLE IF NOT EXISTS retrieved_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    query_log_id UUID REFERENCES rag_query_logs(id) ON DELETE CASCADE NOT NULL,
    chunk_id UUID REFERENCES paper_chunks(id) ON DELETE CASCADE NOT NULL,
    relevance_score REAL NOT NULL,
    reranked_score REAL,
    was_used_in_response BOOLEAN DEFAULT FALSE,
    rank_position INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Document collections for organizing papers
CREATE TABLE IF NOT EXISTS document_collections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Many-to-many relationship between papers and collections
CREATE TABLE IF NOT EXISTS collection_papers (
    collection_id UUID REFERENCES document_collections(id) ON DELETE CASCADE NOT NULL,
    paper_id UUID REFERENCES papers(id) ON DELETE CASCADE NOT NULL,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (collection_id, paper_id)
);

-- Cached embeddings for frequent queries
CREATE TABLE IF NOT EXISTS embedding_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    text_hash TEXT UNIQUE NOT NULL,
    text TEXT NOT NULL,
    embedding vector(1536) NOT NULL,
    model_name TEXT NOT NULL,
    usage_count INTEGER DEFAULT 1,
    last_accessed TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- User preferences for RAG behavior
CREATE TABLE IF NOT EXISTS user_rag_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    preferred_chunk_size INTEGER DEFAULT 1000,
    preferred_chunk_overlap INTEGER DEFAULT 100,
    retrieval_method TEXT CHECK (retrieval_method IN ('semantic', 'keyword', 'hybrid')) DEFAULT 'hybrid',
    max_chunks_per_query INTEGER DEFAULT 5,
    include_citations BOOLEAN DEFAULT TRUE,
    language_preference TEXT DEFAULT 'en',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_document_processing_status_paper_id ON document_processing_status(paper_id);
CREATE INDEX IF NOT EXISTS idx_document_processing_status_status ON document_processing_status(status);
CREATE INDEX IF NOT EXISTS idx_paper_chunks_metadata_chunk_id ON paper_chunks_metadata(chunk_id);
CREATE INDEX IF NOT EXISTS idx_paper_chunks_metadata_chunk_type ON paper_chunks_metadata(chunk_type);
CREATE INDEX IF NOT EXISTS idx_rag_query_logs_user_id ON rag_query_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_rag_query_logs_session_id ON rag_query_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_retrieved_chunks_query_log_id ON retrieved_chunks(query_log_id);
CREATE INDEX IF NOT EXISTS idx_document_collections_user_id ON document_collections(user_id);
CREATE INDEX IF NOT EXISTS idx_collection_papers_collection_id ON collection_papers(collection_id);
CREATE INDEX IF NOT EXISTS idx_collection_papers_paper_id ON collection_papers(paper_id);
CREATE INDEX IF NOT EXISTS idx_embedding_cache_text_hash ON embedding_cache(text_hash);
CREATE INDEX IF NOT EXISTS idx_embedding_cache_last_accessed ON embedding_cache(last_accessed);

-- Enable RLS for new tables
ALTER TABLE document_processing_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE paper_chunks_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE vector_index_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE rag_query_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE retrieved_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_papers ENABLE ROW LEVEL SECURITY;
ALTER TABLE embedding_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_rag_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies for document_processing_status
CREATE POLICY "Users can view processing status of their papers" ON document_processing_status
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM papers
            WHERE papers.id = document_processing_status.paper_id
            AND papers.user_id = auth.uid()
        )
    );

CREATE POLICY "System can manage processing status" ON document_processing_status
    FOR ALL USING (TRUE);

-- RLS Policies for paper_chunks_metadata
CREATE POLICY "Users can view metadata of their paper chunks" ON paper_chunks_metadata
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM paper_chunks
            JOIN papers ON papers.id = paper_chunks.paper_id
            WHERE paper_chunks.id = paper_chunks_metadata.chunk_id
            AND papers.user_id = auth.uid()
        )
    );

-- RLS Policies for rag_query_logs
CREATE POLICY "Users can view their own query logs" ON rag_query_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own query logs" ON rag_query_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for document_collections
CREATE POLICY "Users can manage their own collections" ON document_collections
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view public collections" ON document_collections
    FOR SELECT USING (is_public = TRUE);

-- RLS Policies for collection_papers
CREATE POLICY "Users can manage papers in their collections" ON collection_papers
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM document_collections
            WHERE document_collections.id = collection_papers.collection_id
            AND document_collections.user_id = auth.uid()
        )
    );

-- RLS Policies for user_rag_preferences
CREATE POLICY "Users can manage their own RAG preferences" ON user_rag_preferences
    FOR ALL USING (auth.uid() = user_id);

-- Add triggers for updated_at
CREATE TRIGGER handle_updated_at_document_processing_status
    BEFORE UPDATE ON document_processing_status
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER handle_updated_at_vector_index_config
    BEFORE UPDATE ON vector_index_config
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER handle_updated_at_document_collections
    BEFORE UPDATE ON document_collections
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER handle_updated_at_user_rag_preferences
    BEFORE UPDATE ON user_rag_preferences
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- Insert default vector index configuration for OpenAI text-embedding-3-large
INSERT INTO vector_index_config (
    index_name,
    embedding_model,
    embedding_dimension,
    distance_metric,
    index_type,
    is_active
) VALUES (
    'openai_text_embedding_3_large',
    'text-embedding-3-large',
    1536,
    'cosine',
    'hnsw',
    TRUE
) ON CONFLICT (index_name) DO NOTHING;

-- Success message
SELECT 'RAG-specific tables created successfully!' as result;