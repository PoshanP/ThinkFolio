# RAG Agent Implementation

## Overview
This RAG (Retrieval-Augmented Generation) agent provides intelligent document processing and question-answering capabilities using OpenAI's GPT-4 and LangChain.

## Features
- **Document Processing**: Supports PDF, TXT, MD, DOCX, JSON files
- **Intelligent Chunking**: Recursive text splitting with configurable chunk size and overlap
- **Hybrid Search**: Combines semantic and keyword-based retrieval for better accuracy
- **OpenAI Integration**: Uses GPT-4 for generation and text-embedding-3-large for embeddings
- **Conversation Memory**: Maintains context across chat sessions
- **Streaming Support**: Real-time response streaming for better UX
- **Production Ready**: Error handling, logging, and monitoring built-in

## Architecture

### Core Components

1. **Document Processor** (`lib/rag/document_processor.ts`)
   - Loads and processes various document formats
   - Chunks documents with metadata extraction
   - Detects chunk types (abstract, introduction, methodology, etc.)
   - Identifies equations and citations

2. **Vector Store Manager** (`lib/rag/vector_store.ts`)
   - Supports both ChromaDB and Supabase vector stores
   - Implements similarity search, MMR, and hybrid search
   - Manages document collections and embeddings

3. **RAG Chain** (`lib/rag/rag_chain.ts`)
   - Orchestrates retrieval and generation
   - Manages conversation history
   - Provides summary and insight extraction

4. **RAG Agent** (`lib/rag/rag_agent.ts`)
   - Main interface for all RAG operations
   - Handles document processing, queries, and sessions
   - Integrates with database for persistence

5. **Configuration** (`lib/rag/config.ts`)
   - Centralized configuration management
   - Environment variable loading
   - Runtime validation

## API Endpoints

### 1. Process Document
```bash
POST /api/rag/process
{
  "paperId": "uuid",
  "filePath": "/path/to/file",
  "fileType": "pdf",
  "title": "Document Title",
  "userId": "user-uuid"
}
```

### 2. Query Document
```bash
POST /api/rag/query
{
  "question": "What are the main findings?",
  "userId": "user-uuid",
  "sessionId": "session-uuid", // optional
  "paperId": "paper-uuid", // optional
  "stream": false, // optional
  "retrievalOptions": {
    "k": 5,
    "searchType": "hybrid",
    "scoreThreshold": 0.7
  }
}
```

### 3. Generate Summary/Insights
```bash
POST /api/rag/summary
{
  "paperId": "paper-uuid",
  "userId": "user-uuid",
  "type": "summary" // or "insights"
}
```

### 4. Manage Sessions
```bash
# Create session
POST /api/rag/session
{
  "userId": "user-uuid",
  "paperId": "paper-uuid",
  "title": "Chat about Paper X"
}

# Get session(s)
GET /api/rag/session?sessionId=xxx
GET /api/rag/session?userId=xxx&paperId=xxx
```

## Database Tables

### RAG-Specific Tables Added:
- `document_processing_status` - Tracks document processing progress
- `paper_chunks_metadata` - Stores chunk metadata for better retrieval
- `rag_query_logs` - Logs queries for monitoring and optimization
- `document_collections` - Organizes papers into collections
- `collection_papers` - Many-to-many relationship for collections

## Setup Instructions

### 1. Environment Variables
Copy `.env.example` to `.env.local` and fill in:
```env
OPENAI_API_KEY=your_api_key
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_key
```

### 2. Database Setup
Run the SQL migrations to create RAG tables:
```bash
# Option 1: Use the setup script
node create-rag-tables.js

# Option 2: Manual setup in Supabase Dashboard
# Copy contents of setup-database.sql and run in SQL Editor
```

### 3. Install Dependencies
```bash
npm install @langchain/openai @langchain/community langchain @supabase/supabase-js chromadb
```

## Configuration Options

### Chunking
- `chunkSize`: 1000 (default)
- `chunkOverlap`: 100 (default)
- `semanticChunking`: false (default)

### Retrieval
- `searchType`: "hybrid" | "similarity" | "mmr"
- `k`: Number of chunks to retrieve (default: 5)
- `scoreThreshold`: Minimum similarity score (default: 0.7)

### OpenAI Models
- Generation: `gpt-4-turbo-preview`
- Embeddings: `text-embedding-3-large`

## Best Practices

1. **Document Processing**
   - Process documents once and store embeddings
   - Use appropriate chunk sizes (1000 tokens recommended)
   - Enable metadata extraction for better retrieval

2. **Querying**
   - Use hybrid search for best results
   - Adjust k parameter based on document complexity
   - Enable streaming for long responses

3. **Performance**
   - Cache frequent queries
   - Use session management for conversation context
   - Monitor query logs for optimization

## Monitoring

The system logs:
- Document processing status and errors
- Query performance metrics
- Retrieval accuracy
- User interaction patterns

Check `rag_query_logs` table for performance insights.

## Troubleshooting

### Common Issues

1. **OpenAI API Errors**
   - Check API key validity
   - Monitor rate limits
   - Verify model availability

2. **Vector Store Issues**
   - Ensure pgvector extension is enabled
   - Check embedding dimensions match (1536)
   - Verify database permissions

3. **Processing Failures**
   - Check file format support
   - Verify file size limits (50MB default)
   - Review error logs in `document_processing_status`

## Future Enhancements

- [ ] Add support for more file formats (Excel, PowerPoint)
- [ ] Implement OCR for scanned documents
- [ ] Add multi-language support
- [ ] Enhance citation extraction
- [ ] Implement fine-tuning capabilities
- [ ] Add evaluation metrics
- [ ] Support for custom prompts

## Support

For issues or questions, check:
- Error logs in database tables
- Console logs for API errors
- Environment variable configuration