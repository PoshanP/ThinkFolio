-- ThinkFolio Database Setup Script
-- Copy and paste this into your Supabase SQL Editor to create all tables

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Papers table
CREATE TABLE IF NOT EXISTS papers (
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
CREATE TABLE IF NOT EXISTS paper_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    paper_id UUID REFERENCES papers(id) ON DELETE CASCADE NOT NULL,
    page_no INTEGER NOT NULL,
    content TEXT NOT NULL,
    embedding vector(1536),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Chat sessions table
CREATE TABLE IF NOT EXISTS chat_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    paper_id UUID REFERENCES papers(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Chat messages table
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE NOT NULL,
    role TEXT CHECK (role IN ('user', 'assistant', 'system')) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Message citations table
CREATE TABLE IF NOT EXISTS message_citations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID REFERENCES chat_messages(id) ON DELETE CASCADE NOT NULL,
    chunk_id UUID REFERENCES paper_chunks(id) ON DELETE CASCADE NOT NULL,
    score REAL NOT NULL,
    page_no INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- User profiles table
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    bio TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_papers_user_id ON papers(user_id);
CREATE INDEX IF NOT EXISTS idx_paper_chunks_paper_id ON paper_chunks(paper_id);
-- Note: ivfflat index for embeddings requires more setup, skip for now
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_paper_id ON chat_sessions(paper_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_message_citations_message_id ON message_citations(message_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_name ON profiles(name);

-- Row Level Security (RLS)
ALTER TABLE papers ENABLE ROW LEVEL SECURITY;
ALTER TABLE paper_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_citations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for papers
DROP POLICY IF EXISTS "Users can view their own papers" ON papers;
CREATE POLICY "Users can view their own papers" ON papers
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own papers" ON papers;
CREATE POLICY "Users can insert their own papers" ON papers
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own papers" ON papers;
CREATE POLICY "Users can update their own papers" ON papers
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own papers" ON papers;
CREATE POLICY "Users can delete their own papers" ON papers
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for paper_chunks
DROP POLICY IF EXISTS "Users can view chunks of their papers" ON paper_chunks;
CREATE POLICY "Users can view chunks of their papers" ON paper_chunks
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM papers
            WHERE papers.id = paper_chunks.paper_id
            AND papers.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can insert chunks for their papers" ON paper_chunks;
CREATE POLICY "Users can insert chunks for their papers" ON paper_chunks
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM papers
            WHERE papers.id = paper_chunks.paper_id
            AND papers.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can delete chunks of their papers" ON paper_chunks;
CREATE POLICY "Users can delete chunks of their papers" ON paper_chunks
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM papers
            WHERE papers.id = paper_chunks.paper_id
            AND papers.user_id = auth.uid()
        )
    );

-- RLS Policies for chat_sessions
DROP POLICY IF EXISTS "Users can view their own chat sessions" ON chat_sessions;
CREATE POLICY "Users can view their own chat sessions" ON chat_sessions
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own chat sessions" ON chat_sessions;
CREATE POLICY "Users can insert their own chat sessions" ON chat_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own chat sessions" ON chat_sessions;
CREATE POLICY "Users can update their own chat sessions" ON chat_sessions
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own chat sessions" ON chat_sessions;
CREATE POLICY "Users can delete their own chat sessions" ON chat_sessions
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for chat_messages
DROP POLICY IF EXISTS "Users can view messages in their sessions" ON chat_messages;
CREATE POLICY "Users can view messages in their sessions" ON chat_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM chat_sessions
            WHERE chat_sessions.id = chat_messages.session_id
            AND chat_sessions.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can insert messages in their sessions" ON chat_messages;
CREATE POLICY "Users can insert messages in their sessions" ON chat_messages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM chat_sessions
            WHERE chat_sessions.id = chat_messages.session_id
            AND chat_sessions.user_id = auth.uid()
        )
    );

-- RLS Policies for message_citations
DROP POLICY IF EXISTS "Users can view citations in their messages" ON message_citations;
CREATE POLICY "Users can view citations in their messages" ON message_citations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM chat_messages
            JOIN chat_sessions ON chat_sessions.id = chat_messages.session_id
            WHERE chat_messages.id = message_citations.message_id
            AND chat_sessions.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can insert citations for their messages" ON message_citations;
CREATE POLICY "Users can insert citations for their messages" ON message_citations
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM chat_messages
            JOIN chat_sessions ON chat_sessions.id = chat_messages.session_id
            WHERE chat_messages.id = message_citations.message_id
            AND chat_sessions.user_id = auth.uid()
        )
    );

-- RLS Policies for profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
CREATE POLICY "Users can view their own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
CREATE POLICY "Users can insert their own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
CREATE POLICY "Users can update their own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can delete their own profile" ON profiles;
CREATE POLICY "Users can delete their own profile" ON profiles
    FOR DELETE USING (auth.uid() = id);

-- Function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.profiles (id, email, name)
    VALUES (
        new.id,
        new.email,
        COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1))
    );
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers to all tables
DROP TRIGGER IF EXISTS handle_updated_at_profiles ON profiles;
CREATE TRIGGER handle_updated_at_profiles
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_updated_at_papers ON papers;
CREATE TRIGGER handle_updated_at_papers
    BEFORE UPDATE ON papers
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_updated_at_chat_sessions ON chat_sessions;
CREATE TRIGGER handle_updated_at_chat_sessions
    BEFORE UPDATE ON chat_sessions
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- Create storage bucket for papers (uncomment if needed)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('papers', 'papers', false) ON CONFLICT DO NOTHING;

-- Success message
SELECT 'Database setup completed successfully!' as result;