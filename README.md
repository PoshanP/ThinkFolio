# ThinkFolio

**AI-Powered Document Intelligence**

Reading that talks back. Think faster. Struggle less.

Upload any document and chat with it—tax forms, insurance policies, contracts, terms & conditions, research papers, manuals. Get instant answers with page citations.

## Features

### Document Intelligence
- **Multi-Format Support**: PDF, DOCX, TXT, RTF, PPTX, CSV, EPUB, HTML (up to 50MB)
- **AI Chat**: Natural conversations with your documents using GPT-4
- **Precise Citations**: Every answer includes exact page references
- **Smart Chunking**: Documents intelligently split for accurate retrieval

### Organization
- **Collections**: Organize documents by topic, project, or category
- **Favorites**: Quick access to your most important files
- **Bookmarks**: Mark important sections and pages
- **Reading List**: Queue documents for later review
- **Recent Reads**: Pick up where you left off

### Reading Experience
- **PDF Reader**: Clean, simplistic reader with AI chat side panel
- **Chat Sessions**: Save and revisit AI conversations
- **Document Library**: Unlimited documents, all searchable

## Tech Stack

### Frontend
- **Next.js 15** (App Router)
- **React 19**
- **TypeScript**
- **Tailwind CSS**
- **Lucide React** (Icons)

### Backend
- **Next.js API Routes**
- **Supabase** (Database & Auth)
- **OpenAI GPT-4** (AI Chat)
- **LangChain.js** (AI Framework)
- **pgvector** (Vector Embeddings)

### Infrastructure
- **Vercel** (Deployment)
- **Supabase** (Backend Services)
- **Edge Runtime** (API Routes)

## Project Structure

```
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   │   ├── auth/          # Authentication endpoints
│   │   ├── chat/          # Chat and session management
│   │   ├── papers/        # Document upload and management
│   │   ├── health/        # Health check endpoint
│   │   └── metrics/       # Application metrics
│   ├── auth/              # Authentication pages
│   ├── chat/              # Chat interface pages
│   ├── papers/            # Document management pages
│   └── profile/           # User profile pages
├── frontend/              # Frontend components
│   └── components/        # Reusable UI components
├── lib/                   # Shared utilities
│   ├── db/               # Database utilities
│   ├── services/         # Business logic services
│   ├── supabase/         # Supabase clients
│   ├── types/            # TypeScript definitions
│   ├── utils/            # Helper utilities
│   └── validation/       # Input validation schemas
├── supabase/             # Database migrations
└── public/               # Static assets
```

## Setup

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account
- OpenAI API key

### 1. Clone and Install

```bash
git clone <repository-url>
cd thinkfolio
npm install
```

### 2. Environment Configuration

```bash
cp .env.example .env.local
```

Fill in `.env.local`:
```env
# Supabase (Settings > API in Supabase Dashboard)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# OpenAI (https://platform.openai.com/api-keys)
OPENAI_API_KEY=sk-...

# JWT (Generate: openssl rand -base64 32)
JWT_SECRET=your_jwt_secret_key

NODE_ENV=development
```

### 3. Database Setup

1. Create a Supabase project at https://supabase.com/dashboard
2. Enable `pgvector` extension (Database > Extensions)
3. Run migrations from `supabase/migrations/`
4. Create `papers` storage bucket (private)

### 4. Development

```bash
npm run dev
# Open http://localhost:3000
```

### 5. Build & Deploy

```bash
npm run build
npm run typecheck
npm run lint
```

## API Endpoints

- `POST /api/papers/upload` - Upload and process documents
- `POST /api/chat/sessions/create` - Create chat session
- `POST /api/chat/message` - Send message to AI
- `GET /api/chat/sessions` - Get user's chat sessions
- `GET /api/health` - Health check

## Security

- Input validation and sanitization
- Rate limiting on API endpoints
- JWT token authentication
- SQL injection prevention
- File type validation
- User authorization checks
- Secure encrypted storage

## License

ThinkFolio - AI-Powered Document Intelligence
