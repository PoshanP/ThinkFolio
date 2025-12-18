export const APP_NAME = 'ThinkFolio'
export const APP_DESCRIPTION = 'Research Paper RAG Chat App'

export const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
export const ALLOWED_FILE_TYPES = ['application/pdf']

export const CHUNK_SIZE = 500
export const CHUNK_OVERLAP = 50
export const TOP_K_CHUNKS = 5

export const EMBEDDING_MODEL = 'text-embedding-3-small'
export const CHAT_MODEL = 'gpt-4o-mini'

export const PAPERS_PER_PAGE = 20
export const SESSIONS_PER_PAGE = 10
export const MESSAGES_PER_PAGE = 50

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
  },
  CHAT: {
    SESSIONS: '/api/chat/sessions',
    CREATE_SESSION: '/api/chat/sessions/create',
    GET_SESSION: (id: string) => `/api/chat/sessions/${id}`,
    DELETE_SESSION: (id: string) => `/api/chat/sessions/${id}`,
    SEND_MESSAGE: '/api/chat/message',
    GET_MESSAGES: (sessionId: string) => `/api/chat/sessions/${sessionId}/messages`,
  },
}