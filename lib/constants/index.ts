export const APP_NAME = 'ThinkFolio'
export const APP_DESCRIPTION = 'Research Paper RAG Chat App'

export const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
export const ALLOWED_FILE_TYPES = ['application/pdf']

export const CHUNK_SIZE = 500
export const CHUNK_OVERLAP = 50
export const TOP_K_CHUNKS = 5

export const EMBEDDING_MODEL = 'text-embedding-3-small'
export const CHAT_MODEL = 'gpt-4o-mini'
export const SUMMARY_MODEL = 'gpt-4o-mini' // Model for paper summaries (can use cheaper model)
export const SUMMARY_MAX_TOKENS = 400
export const MAX_SUMMARY_CONTEXT_LENGTH = 4000

export const PAPERS_PER_PAGE = 20
export const SESSIONS_PER_PAGE = 10
export const MESSAGES_PER_PAGE = 50

// SWR deduplication intervals (in ms)
export const SWR_DEDUP_PROFILE = 300000 // 5 minutes
export const SWR_DEDUP_PAPERS = 120000 // 2 minutes
export const SWR_DEDUP_RECENT = 60000 // 1 minute

// Chat UI dimensions (in px)
export const CHAT_PANEL_DEFAULT_WIDTH = 550
export const CHAT_PANEL_MIN_WIDTH = 280
export const CHAT_PANEL_MAX_WIDTH = 800
export const SIDEBAR_EXPANDED_WIDTH = 256
export const SIDEBAR_COLLAPSED_WIDTH = 56

// Session and auth
export const SESSION_CHECK_INTERVAL_MS = 5 * 60 * 1000 // 5 minutes
export const SIGNED_URL_EXPIRY_SECONDS = 60 * 60 // 1 hour

// Message
export const MESSAGE_TITLE_TRUNCATE_LENGTH = 50

export const API_ROUTES = {
  AUTH: {
    SIGN_UP: '/api/auth/signup',
    SIGN_IN: '/api/auth/signin',
    SIGN_OUT: '/api/auth/signout',
    SESSION: '/api/auth/session',
  },
  PAPERS: {
    LIST: '/api/papers',
    UPLOAD: '/api/papers/upload',
    DELETE: (id: string) => `/api/papers/${id}`,
    GET: (id: string) => `/api/papers/${id}`,
    COLLECTIONS: (id: string) => `/api/papers/${id}/collections`,
  },
  CHAT: {
    SESSIONS: '/api/chat/sessions',
    CREATE_SESSION: '/api/chat/sessions/create',
    GET_SESSION: (id: string) => `/api/chat/sessions/${id}`,
    DELETE_SESSION: (id: string) => `/api/chat/sessions/${id}`,
    SEND_MESSAGE: '/api/chat/message',
    GET_MESSAGES: (sessionId: string) => `/api/chat/sessions/${sessionId}/messages`,
  },
  COLLECTIONS: {
    LIST: '/api/collections',
    CREATE: '/api/collections',
    GET: (id: string) => `/api/collections/${id}`,
    UPDATE: (id: string) => `/api/collections/${id}`,
    DELETE: (id: string) => `/api/collections/${id}`,
    PAPERS: (id: string) => `/api/collections/${id}/papers`,
    REMOVE_PAPER: (collectionId: string, paperId: string) => `/api/collections/${collectionId}/papers/${paperId}`,
  },
}

// Collection color palette
export const COLLECTION_COLORS = [
  { name: 'Indigo', value: '#6366f1' },
  { name: 'Rose', value: '#f43f5e' },
  { name: 'Amber', value: '#f59e0b' },
  { name: 'Emerald', value: '#10b981' },
  { name: 'Sky', value: '#0ea5e9' },
  { name: 'Purple', value: '#a855f7' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Teal', value: '#14b8a6' },
] as const

// Collection icon options
export const COLLECTION_ICONS = [
  'folder',
  'document',
  'academic',
  'briefcase',
  'chart',
  'code',
  'calculator',
  'bookmark',
  'lightbulb',
  'star',
  'heart',
  'tag',
] as const

// Collection defaults and limits
export const DEFAULT_COLLECTION_COLOR = '#6366f1' // Indigo
export const DEFAULT_COLLECTION_ICON = 'folder'
export const MAX_COLLECTIONS_PER_USER = 50

// Default collections seeded for new users
export const DEFAULT_COLLECTIONS = [
  { name: 'Next Read', icon: 'bookmark', color: '#f59e0b', description: 'Papers to read later', is_system: true },
  { name: 'Research', icon: 'academic', color: '#6366f1', description: 'Academic research papers', is_system: false },
  { name: 'Favorites', icon: 'heart', color: '#f43f5e', description: 'Your favorite papers', is_system: true },
] as const

// System collections that cannot be deleted
export const SYSTEM_COLLECTION_NAMES = ['Favorites', 'Next Read'] as const
export const FAVORITES_COLLECTION_NAME = 'Favorites'
export const NEXT_READ_COLLECTION_NAME = 'Next Read'

// Legacy export for backwards compatibility
export const SYSTEM_COLLECTION_NAME = 'Favorites'