# ThinkFolio - Research Paper Chat App

An intelligent research assistant that transforms how you interact with academic papers. ThinkFolio is a full-stack Next.js application that enables researchers, students, and professionals to upload PDF research papers and engage in AI-powered conversations with their content. Built with cutting-edge technologies including Next.js 15, Supabase, and OpenAI's GPT-4.

## 🚀 Features

- **Intelligent PDF Processing**: Seamlessly upload research papers and leverage automatic text chunking with advanced embedding generation for optimal AI comprehension
- **Conversational AI Interface**: Engage in natural conversations with your papers using GPT-4, complete with accurate citations and page-specific references
- **Secure Authentication**: Enterprise-grade security powered by Supabase Auth with JWT token management
- **Persistent Session Management**: Create, save, and revisit chat sessions across multiple papers with full conversation history
- **Modern, Responsive UI**: Intuitive interface designed with Tailwind CSS, ensuring seamless experience across all devices
- **Real-time Streaming**: Experience fluid conversations with AI-powered streaming responses for immediate feedback
- **Precision Citation Tracking**: Every AI response includes traceable citations with exact page numbers and relevance scores

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
thinkfolio/
├── app/                           # Next.js 15 App Router directory
│   ├── api/                       # API Routes (Edge Runtime)
│   │   ├── auth/                  # Authentication & authorization
│   │   │   ├── login/             # User login endpoint
│   │   │   ├── logout/            # User logout endpoint
│   │   │   ├── register/          # New user registration
│   │   │   └── session/           # Session validation
│   │   ├── chat/                  # Chat & conversation management
│   │   │   ├── message/           # Send messages to AI
│   │   │   ├── sessions/          # CRUD operations for chat sessions
│   │   │   └── history/           # Retrieve conversation history
│   │   ├── papers/                # Paper management
│   │   │   ├── upload/            # PDF upload & processing
│   │   │   ├── list/              # Fetch user's papers
│   │   │   ├── delete/            # Remove papers & associated data
│   │   │   └── [id]/              # Individual paper operations
│   │   ├── highlights/            # Highlight & quote management
│   │   │   ├── create/            # Save new highlights
│   │   │   └── list/              # Retrieve saved highlights
│   │   ├── health/                # System health monitoring
│   │   └── metrics/               # Application analytics
│   ├── auth/                      # Authentication pages
│   │   ├── login/                 # Login page with form
│   │   └── register/              # User registration page
│   ├── chat/                      # Chat interface pages
│   │   ├── [sessionId]/           # Individual chat session view
│   │   └── new/                   # Create new chat session
│   ├── papers/                    # Paper management interface
│   │   ├── page.tsx               # Paper library/dashboard
│   │   └── [id]/                  # Individual paper details
│   ├── profile/                   # User profile & settings
│   ├── highlights/                # Saved highlights page
│   ├── layout.tsx                 # Root layout with providers
│   ├── page.tsx                   # Landing/home page
│   └── globals.css                # Global styles & Tailwind imports
│
├── frontend/                      # Frontend components & UI
│   └── components/                # Reusable React components
│       ├── auth/                  # Authentication-related components
│       │   ├── LoginForm.tsx      # Login form with validation
│       │   └── RegisterForm.tsx   # Registration form
│       ├── chat/                  # Chat interface components
│       │   ├── ChatInterface.tsx  # Main chat UI with message list
│       │   ├── MessageInput.tsx   # Input field for messages
│       │   └── MessageBubble.tsx  # Individual message display
│       ├── papers/                # Paper management components
│       │   ├── PaperCard.tsx      # Paper preview card
│       │   ├── UploadSection.tsx  # PDF upload interface
│       │   └── PaperList.tsx      # List view of papers
│       ├── ui/                    # Generic UI components
│       │   ├── Button.tsx         # Reusable button component
│       │   ├── Input.tsx          # Form input component
│       │   ├── Modal.tsx          # Modal/dialog component
│       │   └── Navbar.tsx         # Navigation bar
│       └── dashboard/             # Dashboard-specific components
│           └── StatsCard.tsx      # Metrics display cards
│
├── lib/                           # Shared business logic & utilities
│   ├── db/                        # Database layer
│   │   ├── index.ts               # Database client & connection
│   │   ├── queries.ts             # Reusable SQL queries
│   │   └── migrations/            # Database migration scripts
│   ├── services/                  # Business logic services
│   │   ├── pdf.service.ts         # PDF parsing & text extraction
│   │   ├── storage.service.ts     # Supabase Storage operations
│   │   ├── embedding.service.ts   # OpenAI embedding generation
│   │   ├── chat.service.ts        # AI chat orchestration
│   │   └── auth.service.ts        # Authentication logic
│   ├── supabase/                  # Supabase configuration
│   │   ├── client.ts              # Browser client (anon key)
│   │   ├── server.ts              # Server client (service role)
│   │   └── middleware.ts          # Auth middleware
│   ├── types/                     # TypeScript type definitions
│   │   ├── database.types.ts      # Supabase generated types
│   │   ├── api.types.ts           # API request/response types
│   │   └── models.ts              # Domain model interfaces
│   ├── utils/                     # Helper utilities
│   │   ├── auth.ts                # Auth helpers (JWT, validation)
│   │   ├── errors.ts              # Error handling utilities
│   │   ├── formatters.ts          # Date/text formatting
│   │   └── constants.ts           # App-wide constants
│   └── validation/                # Input validation
│       ├── auth.schema.ts         # Auth input validation (Zod)
│       ├── paper.schema.ts        # Paper upload validation
│       └── chat.schema.ts         # Chat message validation
│
├── supabase/                      # Supabase configuration
│   ├── migrations/                # SQL migration files
│   │   ├── 20240101000000_initial_schema.sql
│   │   ├── 20240102000000_add_highlights.sql
│   │   └── ...
│   └── config.toml                # Supabase CLI configuration
│
├── public/                        # Static assets
│   ├── images/                    # Image assets
│   ├── icons/                     # Icon files
│   └── favicon.ico                # Site favicon
│
├── .env.local                     # Environment variables (not committed)
├── .env.example                   # Environment template
├── next.config.js                 # Next.js configuration
├── tailwind.config.js             # Tailwind CSS configuration
├── tsconfig.json                  # TypeScript configuration
├── package.json                   # Dependencies & scripts
├── CLAUDE.md                      # Development guidelines
└── README.md                      # This file
```

### Directory Descriptions

#### `/app` - Application Routes
The Next.js 15 App Router directory containing all pages and API routes. Each subdirectory represents a route segment, with `page.tsx` files defining UI and `route.ts` files defining API endpoints.

#### `/frontend/components` - React Components
Organized component library following atomic design principles. Components are grouped by feature (auth, chat, papers) and include generic UI elements for reusability across the application.

#### `/lib` - Core Business Logic
The heart of the application containing database operations, external service integrations, type definitions, and shared utilities. This layer is framework-agnostic and can be imported by both client and server code.

#### `/supabase` - Database Schema
Contains SQL migration files that define the database schema, including tables, indexes, RLS policies, and pgvector extension setup. Managed via Supabase CLI.

#### `/public` - Static Assets
Static files served directly by Next.js without processing. Includes images, icons, and other assets accessible via root-relative paths.

## 🏗 Setup Instructions

### Prerequisites

Before getting started, ensure you have the following installed and configured:

- **Node.js 18+** - JavaScript runtime environment
- **npm or yarn** - Package manager for dependencies
- **Supabase Account** - Backend infrastructure (database, auth, storage)
- **OpenAI API Key** - Required for AI chat functionality

### 1. Clone and Install Dependencies

```bash
# Clone the repository
git clone <repository-url>
cd back_front_combiner

# Install all dependencies
npm install
```

### 2. Environment Configuration

Create your local environment file from the provided template:

```bash
cp .env.example .env.local
```

Configure the following environment variables in `.env.local`:
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

Follow these steps to configure your Supabase database:

1. **Create Supabase Project**
   - Visit [Supabase Dashboard](https://app.supabase.com/)
   - Create a new project and note your project URL and API keys

2. **Enable pgvector Extension**
   - Navigate to the SQL Editor in your Supabase dashboard
   - Run: `CREATE EXTENSION IF NOT EXISTS vector;`
   - This enables vector similarity search for embeddings

3. **Run Database Migrations**
   ```bash
   # Copy and execute the SQL from the migration files
   # Located in: supabase/migrations/20240101000000_initial_schema.sql
   ```
   - Creates tables: `papers`, `paper_chunks`, `chat_sessions`, `chat_messages`, `message_citations`
   - Configures Row Level Security (RLS) policies
   - Sets up indexes for optimal query performance

4. **Configure Storage Bucket**
   - Navigate to Storage in Supabase dashboard
   - Create a new bucket named `papers`
   - Set bucket to **private**
   - Configure RLS policies to allow authenticated users to upload/read their own papers

### 4. Development

Start the development server and begin building:

```bash
# Launch the development server
npm run dev

# Application will be available at http://localhost:3000
```

The development server includes:
- Hot module replacement (HMR) for instant updates
- Fast Refresh for React components
- API routes with Edge Runtime
- Automatic TypeScript type checking

### 5. Build & Deploy

Verify your application is production-ready:

```bash
# Create an optimized production build
npm run build

# Run TypeScript compiler for type validation
npm run typecheck

# Check code quality and formatting
npm run lint
```

**Deploying to Vercel:**
1. Push your code to GitHub/GitLab/Bitbucket
2. Import the project in Vercel dashboard
3. Add all environment variables from `.env.local`
4. Deploy - Vercel will automatically build and deploy your application

## 🔧 Key Components & Architecture

### Backend Services (`/lib/services`)

- **PDF Service** (`pdf.service.ts`)
  - Parses PDF files using pdf-parse library
  - Extracts text content page by page
  - Handles multi-column layouts and complex formatting

- **Embedding Service** (`embedding.service.ts`)
  - Generates vector embeddings using OpenAI's text-embedding-3-small
  - Chunks text into 500-token segments with 50-token overlap
  - Stores embeddings in pgvector for similarity search

- **Storage Service** (`storage.service.ts`)
  - Manages PDF uploads to Supabase Storage
  - Handles file validation (type, size limits)
  - Generates secure, unique file paths

- **Chat Service** (`chat.service.ts`)
  - Orchestrates RAG (Retrieval-Augmented Generation) pipeline
  - Performs vector similarity search for relevant chunks
  - Constructs prompts with context and citations
  - Streams GPT-4 responses in real-time

- **Auth Service** (`auth.service.ts`)
  - Validates JWT tokens from Supabase Auth
  - Enforces user authorization for resources
  - Manages session lifecycle

### Frontend Components (`/frontend/components`)

- **UploadSection** (`papers/UploadSection.tsx`)
  - Drag-and-drop PDF upload interface
  - File validation and progress tracking
  - Error handling with user feedback

- **ChatInterface** (`chat/ChatInterface.tsx`)
  - Real-time message streaming display
  - Citation rendering with page references
  - Markdown support for formatted responses

- **PaperCard** (`papers/PaperCard.tsx`)
  - Displays paper metadata (title, page count, upload date)
  - Actions: view, chat, delete
  - Loading states and error handling

- **Navbar** (`ui/Navbar.tsx`)
  - Responsive navigation with mobile menu
  - User authentication status
  - Route highlighting

- **StatsCard** (`dashboard/StatsCard.tsx`)
  - Displays key metrics (papers, sessions, messages)
  - Animated counters for visual appeal

### API Endpoints

**Paper Management:**
- `POST /api/papers/upload` - Upload PDF, extract text, generate embeddings
- `GET /api/papers/list` - Retrieve user's paper library with pagination
- `DELETE /api/papers/[id]` - Delete paper and all associated data (chunks, sessions)

**Chat Operations:**
- `POST /api/chat/sessions/create` - Initialize new chat session for a paper
- `POST /api/chat/message` - Send message, retrieve context, stream AI response
- `GET /api/chat/sessions` - List all chat sessions with metadata
- `GET /api/chat/history/[sessionId]` - Retrieve full conversation history

**System:**
- `GET /api/health` - Health check endpoint for monitoring
- `GET /api/metrics` - Application usage statistics

## 🚧 Project Status

### ✅ Completed Features

- **Full-Stack Integration**: Seamless connection between Next.js frontend and Supabase backend
- **Core Components**: All major UI components and pages implemented and tested
- **API Infrastructure**: Complete REST API with paper management, chat, and authentication endpoints
- **Database Architecture**: Production-ready schema with RLS policies and vector search capabilities
- **Authentication System**: Secure user authentication with JWT tokens and session management
- **Build Pipeline**: Optimized production build configuration with TypeScript and ESLint
- **Dark Mode Support**: Theme toggle with persistent user preferences
- **Highlights Feature**: Save and manage important quotes from papers

### ⚠️ Known Considerations

- **Environment Configuration**: Requires valid Supabase and OpenAI credentials for full functionality
- **API Costs**: OpenAI API usage will incur costs - recommend setting spending limits
- **PDF Processing**: Large PDFs (>50 pages) may take additional processing time
- **Minor Lint Warnings**: Some non-critical linting warnings for unused imports (can be safely ignored)

## 🛡 Security Features

ThinkFolio implements multiple layers of security to protect user data:

- **Input Validation**: Zod schemas validate all user inputs before processing
- **Authentication**: JWT-based authentication with Supabase Auth
- **Authorization**: Row Level Security (RLS) policies ensure users only access their own data
- **Rate Limiting**: API endpoints protected against abuse with request throttling
- **SQL Injection Prevention**: Parameterized queries via Supabase client
- **File Upload Security**:
  - Type validation (PDF only)
  - Size limits (configurable, default 10MB)
  - Secure storage paths with UUID naming
- **XSS Protection**: React's built-in escaping and sanitization
- **CSRF Protection**: SameSite cookie policies
- **Environment Variables**: Secrets never exposed to client-side code

## 📊 Performance Optimizations

Built for speed and scalability:

- **Edge Runtime**: API routes deployed to edge network for low latency globally
- **Static Generation**: Pages pre-rendered at build time where possible
- **Code Splitting**: Automatic route-based chunking reduces initial bundle size
- **Optimized Bundle**: ~123KB first load JS (gzipped)
- **Streaming Responses**: AI chat responses stream in real-time for immediate feedback
- **Vector Search**: pgvector enables efficient similarity search on million+ embeddings
- **Database Indexing**: Strategic indexes on frequently queried columns
- **Image Optimization**: Next.js Image component for lazy loading and optimization
- **Caching Strategy**: Browser caching for static assets, fresh data for dynamic content

## 🤝 Contributing

We welcome contributions to ThinkFolio! Here's how to get started:

1. **Fork the Repository**: Create your own fork of the project
2. **Create a Feature Branch**: `git checkout -b feature/your-feature-name`
3. **Make Your Changes**: Implement your feature or bug fix
4. **Follow Code Standards**:
   - Run `npm run typecheck` to ensure TypeScript compliance
   - Run `npm run lint` to check code quality
   - Write clear, descriptive commit messages
5. **Test Your Changes**: Ensure all functionality works as expected
6. **Submit a Pull Request**: Provide a clear description of your changes

### Development Guidelines

- Follow the conventions in `CLAUDE.md`
- Maintain TypeScript type safety (avoid `any`)
- Write reusable, pure functions
- Add comments for complex logic
- Update documentation for API changes

## 📄 License

This project is part of the ThinkFolio research paper management system.

## 🆘 Support & Resources

Need help? Here are your resources:

- **Documentation**: Review this README and `CLAUDE.md` for development guidelines
- **API Reference**: See `API_DOCUMENTATION.md` for detailed endpoint documentation
- **Issues**: Open an issue on GitHub for bugs or feature requests
- **Architecture**: Check the project structure section above for codebase navigation

---

**Built with ❤️ for researchers, by researchers**