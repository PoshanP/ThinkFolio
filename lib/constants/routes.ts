/**
 * Application routes
 * Single source of truth for all navigation paths
 */

export const ROUTES = {
  home: '/',
  auth: '/auth',
  papers: '/papers',
  profile: '/profile',
  paper: (id: string) => `/papers/${id}`,
  chat: (paperId: string, sessionId?: string) =>
    sessionId ? `/chat/${paperId}/${sessionId}` : `/chat/${paperId}`,
} as const

/**
 * Navigation items for authenticated users
 */
export const NAV_ITEMS = {
  authenticated: [
    { href: ROUTES.home, label: 'Dashboard' },
    { href: ROUTES.papers, label: 'My Library' },
    { href: ROUTES.profile, label: 'Profile' },
  ],
} as const
