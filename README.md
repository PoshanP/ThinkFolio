# ThinkFolio - Research Paper Chat App

A full-stack Next.js application that allows users to upload research papers (PDFs) and chat with them using AI. Built with Next.js 15, Supabase, and OpenAI.

## 🚀 Features

- **PDF Upload & Processing**: Upload research papers and automatically chunk them for AI processing
- **AI-Powered Chat**: Chat with your papers using GPT-4 with citations and references
- **User Authentication**: Secure authentication with Supabase Auth
- **Session Management**: Save and manage chat sessions
- **Modern UI**: Clean, responsive interface built with Tailwind CSS
- **Real-time Updates**: Live chat interface with streaming responses
- **Citation Tracking**: AI responses include citations with page references

## 🛠 Tech Stack

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

## 📁 Project Structure

```
├── app/                           # Next.js app directory
│   ├── api/                      # API routes
│   │   ├── auth/                 # Authentication endpoints
│   │   │   ├── signin/           # Sign in endpoint
│   │   │   ├── signout/          # Sign out endpoint
│   │   │   ├── signup/           # Sign up endpoint
│   │   │   └── session/          # Session management
│   │   ├── chat/                 # Chat functionality
│   │   │   ├── message/          # Chat message handling
│   │   │   └── sessions/         # Chat session management
│   │   ├── papers/               # Paper management
│   │   │   ├── [id]/             # Individual paper operations
│   │   │   ├── upload/           # Paper upload endpoint
│   │   │   ├── upload-url/       # Upload URL generation
│   │   │   └── route.ts          # Papers listing
│   │   ├── rag/                  # RAG (Retrieval Augmented Generation)
│   │   │   ├── process/          # Document processing
│   │   │   ├── query/            # RAG queries
│   │   │   ├── session/          # RAG sessions
│   │   │   └── summary/          # Document summarization
│   │   ├── user/                 # User management
│   │   │   ├── profile/          # User profile
│   │   │   └── stats/            # User statistics
│   │   ├── check-database/       # Database health check
│   │   ├── dashboard/            # Dashboard data
│   │   ├── health/               # Application health
│   │   ├── highlights/           # Text highlighting
│   │   ├── metrics/              # Application metrics
│   │   └── setup-database/       # Database setup
│   ├── auth/                     # Authentication pages
│   │   ├── login/                # Login page
│   │   └── signup/               # Signup page
│   ├── chat-new/                 # New chat interface
│   ├── highlights/               # Highlights management
│   ├── favicon.ico               # App favicon
│   ├── globals.css               # Global styles
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Home page
├── frontend/                     # Frontend components
│   └── components/               # Reusable UI components
│       ├── CitationBadge.tsx     # Citation display
│       ├── ExportChatButton.tsx  # Chat export functionality
│       ├── HighlightableText.tsx # Text highlighting
│       ├── Navbar.tsx            # Navigation bar
│       ├── PaperCard.tsx         # Paper display card
│       ├── PaperSidebar.tsx      # Paper navigation sidebar
│       ├── ProfileDialog.tsx     # User profile dialog
│       ├── RecentPapers.tsx      # Recent papers display
│       ├── StatsCard.tsx         # Statistics card
│       ├── ThemeToggle.tsx       # Theme switching
│       └── UploadSection.tsx     # File upload interface
├── lib/                          # Shared utilities and services
│   ├── components/               # Shared components
│   │   └── ProtectedRoute.tsx    # Route protection
│   ├── contexts/                 # React contexts
│   │   ├── AuthContext.tsx       # Authentication context
│   │   ├── DataContext.tsx       # Data management context
│   │   └── ThemeContext.tsx      # Theme context
│   ├── db/                       # Database utilities
│   │   └── index.ts              # Database operations
│   ├── hooks/                    # Custom React hooks
│   │   └── useApi.ts             # API interaction hook
│   ├── rag/                      # RAG implementation
│   │   ├── config.ts             # RAG configuration
│   │   ├── document_processor.ts # Document processing
│   │   ├── rag_agent.ts          # RAG agent
│   │   ├── rag_chain.ts          # RAG chain logic
│   │   └── vector_store.ts       # Vector storage
│   ├── services/                 # Business logic services
│   │   ├── pdf.service.ts        # PDF processing
│   │   └── storage.service.ts    # File storage
│   ├── supabase/                 # Supabase configuration
│   │   ├── admin.ts              # Admin client
│   │   ├── client.ts             # Client configuration
│   │   └── server.ts             # Server client
│   ├── types/                    # TypeScript definitions
│   │   ├── database.ts           # Database types
│   │   └── index.ts              # General types
│   ├── utils/                    # Helper utilities
│   │   ├── api-response.ts       # API response helpers
│   │   ├── auth.ts               # Authentication utilities
│   │   ├── cache.ts              # Caching utilities
│   │   └── export-chat.ts        # Chat export utilities
│   ├── validation/               # Input validation
│   │   └── index.ts              # Validation schemas
│   ├── constants/                # Application constants
│   │   └── index.ts              # Constant definitions
│   └── logger.ts                 # Logging utility
├── migrations/                   # Database migrations
│   └── 002_saved_highlights.sql  # Highlights table migration
├── supabase/                     # Supabase configuration
│   └── .temp/                    # Temporary files
├── types/                        # Global type definitions
│   └── pdf-parse.d.ts            # PDF parsing types
├── public/                       # Static assets
│   ├── file.svg                  # File icon
│   ├── globe.svg                 # Globe icon
│   ├── next.svg                  # Next.js logo
│   ├── vercel.svg                # Vercel logo
│   └── window.svg                # Window icon
├── create-rag-tables.js          # RAG tables setup
├── create-tables.js              # Database tables setup
├── force-create-tables.js        # Force table creation
├── run-migrations.js             # Migration runner
├── middleware.ts                 # Next.js middleware
├── next.config.js                # Next.js configuration
├── package.json                  # Dependencies
├── tailwind.config.js            # Tailwind CSS config
├── tsconfig.json                 # TypeScript config
├── utils.js                      # Utility functions
└── vercel.json                   # Vercel deployment config
```

## 🏗 Setup Instructions

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account
- OpenAI API key

### 1. Clone and Install

```bash
git clone <repository-url>
cd back_front_combiner
npm install
```

### 2. Environment Configuration

Copy the environment template:
```bash
cp .env.example .env.local
```

Fill in your environment variables in `.env.local`:
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key

# JWT Configuration
JWT_SECRET=your_jwt_secret_key

# Environment
NODE_ENV=development
```

### 3. Database Setup

1. Create a new Supabase project
2. Enable the pgvector extension in your Supabase database
3. Run the database migrations:

```sql
-- Copy and run the SQL from supabase/migrations/20240101000000_initial_schema.sql
```

4. Set up storage bucket for papers:
   - Create a bucket named `papers` in Supabase Storage
   - Configure appropriate policies for authenticated users

### 4. Development

```bash
# Start development server
npm run dev

# Open http://localhost:3000
```

### 5. Build & Deploy

```bash
# Build for production
npm run build

# Type checking
npm run typecheck

# Linting
npm run lint
```

## 🔧 Key Components

### Backend Services

- **PDF Service** (`lib/services/pdf.service.ts`): Handles PDF parsing and text extraction
- **Storage Service** (`lib/services/storage.service.ts`): Manages file uploads to Supabase Storage
- **Database Service** (`lib/db/index.ts`): Database operations and query utilities
- **Authentication** (`lib/utils/auth.ts`): User authentication and authorization

### Frontend Components

- **UploadSection**: PDF upload interface
- **ChatInterface**: Real-time chat with AI
- **PaperCard**: Display paper information
- **Navbar**: Main navigation
- **StatsCard**: Dashboard metrics display

### API Endpoints

- `POST /api/papers/upload` - Upload and process PDF papers
- `POST /api/chat/sessions/create` - Create new chat session
- `POST /api/chat/message` - Send message to AI
- `GET /api/chat/sessions` - Get user's chat sessions
- `GET /api/health` - Application health check

## 🚧 Current Status

✅ **Completed:**
- Backend and frontend integration
- All major components and pages
- API routes for paper upload and chat
- Database schema and migrations
- Authentication system
- Build configuration
- Environment setup

⚠️ **Known Issues:**
- Some lint warnings for unused variables (non-critical)
- Environment variables need to be configured for full functionality
- OpenAI API integration requires valid API key

## 🛡 Security Features

- Input validation and sanitization
- Rate limiting on API endpoints
- JWT token authentication
- SQL injection prevention with Supabase
- File type validation for uploads
- User authorization checks

## 📊 Performance

- Edge runtime for API routes
- Static generation where possible
- Optimized bundle size (~123KB first load)
- Streaming responses for AI chat
- Efficient vector similarity search

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## 📄 License

This project is part of the ThinkFolio research paper management system.

## 🆘 Support

For issues and questions:
1. Check the existing documentation
2. Review the API documentation in `API_DOCUMENTATION.md`
3. Check the `CLAUDE.md` file for development guidelines