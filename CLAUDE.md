# CLAUDE.md - ThinkFolio

## Mission
AI-Powered Document Intelligence. Upload documents → chunk/embed → chat → get cited answers.

## Product
- **Tagline**: Reading that talks back. Think faster. Struggle less.
- **Formats**: PDF, DOCX, TXT, RTF, PPTX, CSV, EPUB, HTML (up to 50MB)
- **Features**: Collections, Favorites, Bookmarks, Reading List, Chat Sessions

## Stack
- **Frontend**: Next.js 15 (App Router), React 19, Tailwind CSS
- **Backend**: Next.js API Routes (Edge Runtime), LangChain.js
- **Database**: Supabase (Postgres + pgvector + Storage)
- **Deploy**: Vercel + Supabase

## Project Structure
```
/app        → pages, API routes
/frontend   → components, styles
/lib        → utils, types, services, constants
/supabase   → migrations
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
- Parse document (pdf-parse, mammoth, etc.)
- Chunk text (500 tokens, 50 overlap)
- Generate embeddings (text-embedding-3-small)
- Store in pgvector

### 2. Chat Flow
- Retrieve top-5 chunks via similarity search
- Build context with citations
- Stream response with GPT-4o-mini
- Save messages with citation references

### 3. Delete Document
- CASCADE delete chunks, sessions, messages
- Remove from Storage bucket

## Development Standards
- **Environment**: All secrets in `.env.local` (NEVER commit)
- **Components**: Extract reusable UI to `/frontend/components`
- **Constants**: Colors, spacing, API endpoints in `/lib/constants`
- **Types**: Full TypeScript coverage, no `any`
- **Functions**: Pure, small, early returns

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
- Paginate document library (20 per page)
- Cache embeddings in pgvector
- Use Edge Runtime for API routes
