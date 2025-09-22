-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Papers table
CREATE TABLE papers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    source TEXT NOT NULL,
    storage_path TEXT,
    page_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Paper chunks table with vector embeddings
CREATE TABLE paper_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    paper_id UUID REFERENCES papers(id) ON DELETE CASCADE NOT NULL,
    page_no INTEGER NOT NULL,
    content TEXT NOT NULL,
    embedding vector(1536),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Chat sessions table
CREATE TABLE chat_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    paper_id UUID REFERENCES papers(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Chat messages table
CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE NOT NULL,
    role TEXT CHECK (role IN ('user', 'assistant', 'system')) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Message citations table
CREATE TABLE message_citations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID REFERENCES chat_messages(id) ON DELETE CASCADE NOT NULL,
    chunk_id UUID REFERENCES paper_chunks(id) ON DELETE CASCADE NOT NULL,
    score REAL NOT NULL,
    page_no INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for better performance
CREATE INDEX idx_papers_user_id ON papers(user_id);
CREATE INDEX idx_paper_chunks_paper_id ON paper_chunks(paper_id);
CREATE INDEX idx_paper_chunks_embedding ON paper_chunks USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX idx_chat_sessions_user_id ON chat_sessions(user_id);
CREATE INDEX idx_chat_sessions_paper_id ON chat_sessions(paper_id);
CREATE INDEX idx_chat_messages_session_id ON chat_messages(session_id);
CREATE INDEX idx_message_citations_message_id ON message_citations(message_id);

-- Row Level Security (RLS)
ALTER TABLE papers ENABLE ROW LEVEL SECURITY;
ALTER TABLE paper_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_citations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for papers
CREATE POLICY "Users can view their own papers" ON papers
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own papers" ON papers
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own papers" ON papers
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own papers" ON papers
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for paper_chunks
CREATE POLICY "Users can view chunks of their papers" ON paper_chunks
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM papers
            WHERE papers.id = paper_chunks.paper_id
            AND papers.user_id = auth.uid()
        )
    );
CREATE POLICY "Users can insert chunks for their papers" ON paper_chunks
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM papers
            WHERE papers.id = paper_chunks.paper_id
            AND papers.user_id = auth.uid()
        )
    );
CREATE POLICY "Users can delete chunks of their papers" ON paper_chunks
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM papers
            WHERE papers.id = paper_chunks.paper_id
            AND papers.user_id = auth.uid()
        )
    );

-- RLS Policies for chat_sessions
CREATE POLICY "Users can view their own chat sessions" ON chat_sessions
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own chat sessions" ON chat_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own chat sessions" ON chat_sessions
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own chat sessions" ON chat_sessions
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for chat_messages
CREATE POLICY "Users can view messages in their sessions" ON chat_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM chat_sessions
            WHERE chat_sessions.id = chat_messages.session_id
            AND chat_sessions.user_id = auth.uid()
        )
    );
CREATE POLICY "Users can insert messages in their sessions" ON chat_messages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM chat_sessions
            WHERE chat_sessions.id = chat_messages.session_id
            AND chat_sessions.user_id = auth.uid()
        )
    );

-- RLS Policies for message_citations
CREATE POLICY "Users can view citations in their messages" ON message_citations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM chat_messages
            JOIN chat_sessions ON chat_sessions.id = chat_messages.session_id
            WHERE chat_messages.id = message_citations.message_id
            AND chat_sessions.user_id = auth.uid()
        )
    );
CREATE POLICY "Users can insert citations for their messages" ON message_citations
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM chat_messages
            JOIN chat_sessions ON chat_sessions.id = chat_messages.session_id
            WHERE chat_messages.id = message_citations.message_id
            AND chat_sessions.user_id = auth.uid()
        )
    );

-- Storage bucket setup (run in Supabase dashboard)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('papers', 'papers', false);