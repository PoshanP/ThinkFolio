# CLAUDE.md - Research Paper RAG Chat App

## Mission
Build a PDF research paper chat app with citations. Upload/URL → chunk/embed → chat → save sessions.

## Stack
- **Frontend**: Next.js 14+ (App Router), Tailwind CSS
- **Backend**: Next.js API Routes (Edge Runtime), LangChain.js
- **Database**: Supabase (Postgres + pgvector + Storage)
- **Deploy**: Vercel + Supabase

## Project Structure
```
/frontend   → components, pages, styles
/backend    → API routes, RAG logic, LangChain
/lib        → shared utils, types, constants
```

## Database Schema
```sql
-- Supabase Auth handles users
papers (id, user_id, title, source, storage_path, page_count)
paper_chunks (id, paper_id, page_no, content, embedding[1536])
chat_sessions (id, user_id, paper_id, title, created_at)
chat_messages (id, session_id, role, content, created_at)
message_citations (id, message_id, chunk_id, score, page_no)
```
Enable RLS: `user_id = auth.uid()`

## Core Workflows

### 1. Ingest Pipeline
- Parse PDF (pdf-parse or pdfjs-dist)
- Chunk text (500 tokens, 50 overlap)
- Generate embeddings (text-embedding-3-small)
- Store in pgvector

### 2. Chat Flow
- Retrieve top-5 chunks via similarity search
- Build context with citations
- Stream response with GPT-4o-mini
- Save messages with citation references

### 3. Delete Paper
- CASCADE delete chunks, sessions, messages
- Remove from Storage bucket

## Development Standards
- **Environment**: All secrets in `.env.local` (NEVER commit)
- **Components**: Extract reusable UI to `/frontend/components`
- **Constants**: Colors, spacing, API endpoints in `/lib/constants`
- **Types**: Full TypeScript coverage, no `any`
- **Functions**: Pure, small, early returns

## Deployment Checklist
1. **Supabase**: Enable pgvector extension, create tables, set RLS policies
2. **Storage**: Create private bucket `papers` with auth policies
3. **Vercel**: Set env vars (SUPABASE_URL, SUPABASE_ANON_KEY, OPENAI_API_KEY)
4. **OpenAI**: Set spending limit <$100, use cheaper models

## Key Commands
```bash
npm run dev          # Start local dev
npm run build        # Production build
npm run typecheck    # Check types
supabase db push     # Apply migrations
```

## Error Handling
- Wrap API routes in try-catch
- Return structured errors `{ error: string, code: number }`
- Log to console in dev, Vercel logs in prod
- Show user-friendly messages in UI

## Performance
- Stream LLM responses
- Paginate paper library (20 per page)
- Cache embeddings in pgvector
- Use Edge Runtime for API routes