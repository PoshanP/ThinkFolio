# ThinkFolio Backend - Production-Ready System

## Overview
Professional-grade backend for ThinkFolio research paper RAG chat application built with Next.js, Supabase, and TypeScript.

## Features Implemented

### ✅ Core Infrastructure
- **Authentication**: Supabase Auth with JWT tokens
- **Database**: PostgreSQL with pgvector for embeddings
- **Storage**: Supabase Storage for PDF files
- **API Routes**: RESTful endpoints with proper validation
- **Security**: Rate limiting, CORS, security headers
- **Monitoring**: Health checks and metrics endpoints
- **Logging**: Structured logging with Pino
- **Error Handling**: Comprehensive error management

### ✅ API Endpoints
- Authentication (signup, signin, signout, session)
- Paper management (upload, list, get, delete)
- Chat sessions (create, list, get, delete)
- Message management (send, retrieve with pagination)
- Health monitoring and metrics

### ✅ Professional Features
- Request validation with Zod
- File sanitization and validation
- Database transaction support
- Batch operations
- PDF processing (metadata extraction, chunking)
- Storage service with image processing
- Middleware for auth and rate limiting
- TypeScript strict mode
- Production build optimizations

## Setup Instructions

### 1. Prerequisites
- Node.js 18+
- Supabase account
- OpenAI API key (for future RAG)

### 2. Environment Setup
```bash
cp .env.local.example .env.local
```

Fill in your credentials:
- Supabase URL and keys
- OpenAI API key
- App URL

### 3. Database Setup

1. Create Supabase project
2. Enable pgvector extension:
```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

3. Run migrations:
```bash
npx supabase db push
```
Or manually run `/supabase/migrations/20240101000000_initial_schema.sql`

4. Create storage bucket:
```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('papers', 'papers', false);
```

### 4. Install & Run

```bash
# Install dependencies
npm install

# Development
npm run dev

# Production build
npm run build
npm start

# Type checking
npm run typecheck

# Linting
npm run lint
```

## Architecture

```
/app/api/          - API routes
/lib/
  /supabase/       - Database clients
  /services/       - Business logic
  /db/             - Database utilities
  /validation/     - Input validation
  /utils/          - Helpers
  /types/          - TypeScript types
  /constants/      - Configuration
/middleware.ts     - Auth & rate limiting
```

## Security Features

- **Rate Limiting**:
  - Auth: 5 requests/15 minutes
  - Upload: 10 requests/hour
  - General API: 100 requests/minute

- **Input Validation**:
  - SQL injection prevention
  - XSS protection
  - Path traversal prevention
  - File type validation

- **Headers**:
  - CORS configuration
  - Security headers (HSTS, X-Frame-Options, etc.)

## Monitoring

### Health Check
```bash
curl http://localhost:3000/api/health
```

### Metrics
```bash
curl http://localhost:3000/api/metrics
```

## Production Deployment

### Vercel
1. Push to GitHub
2. Connect to Vercel
3. Set environment variables
4. Deploy

### Configuration
- See `vercel.json` for function timeouts
- See `next.config.js` for optimization settings

## API Documentation
See `API_DOCUMENTATION.md` for complete API reference.

## What's NOT Implemented (RAG Features)
- Embedding generation with OpenAI
- Vector similarity search
- LangChain integration
- Streaming chat responses
- Citation extraction
- URL paper fetching

These features are prepared for but not implemented per requirements.

## Performance Optimizations
- Database connection pooling
- Batch operations
- Efficient pagination
- File streaming
- Image optimization
- Edge runtime compatible

## Error Handling
- Structured error responses
- Transaction rollback
- Cleanup on failures
- Detailed logging

## Testing
```bash
# Run tests (to be implemented)
npm test
```

## Support
For issues, check the logs and health endpoints first. All errors are logged with context for debugging.