# ThinkFolio - Research Paper Chat App

A comprehensive research paper management and AI chat application. Upload PDFs, engage in intelligent conversations with your documents, and get precise citations and insights. Built with Next.js 15, Supabase, and OpenAI for a seamless research experience.

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
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   │   ├── auth/          # Authentication endpoints
│   │   ├── chat/          # Chat and session management
│   │   ├── papers/        # Paper upload and management
│   │   ├── health/        # Health check endpoint
│   │   └── metrics/       # Application metrics
│   ├── auth/              # Authentication pages
│   ├── chat/              # Chat interface pages
│   ├── papers/            # Paper management pages
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