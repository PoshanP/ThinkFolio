/**
 * Feature definitions for landing page
 * Centralized feature data to avoid duplication and ease updates
 */

import type { LucideIcon } from 'lucide-react'
import {
  FolderOpen,
  FileText,
  Bot,
  Heart,
  Clock,
  Bookmark,
  BookMarked,
  MessageSquare,
  Layers,
} from 'lucide-react'

export interface Feature {
  id: string
  title: string
  description: string
  icon: LucideIcon
  color: {
    bg: string
    bgDark: string
    text: string
    textDark: string
  }
}

/**
 * Color presets for feature icons
 */
export const FEATURE_COLORS = {
  purple: {
    bg: 'bg-purple-100',
    bgDark: 'dark:bg-purple-900/30',
    text: 'text-purple-600',
    textDark: 'dark:text-purple-400',
  },
  blue: {
    bg: 'bg-blue-100',
    bgDark: 'dark:bg-blue-900/30',
    text: 'text-blue-600',
    textDark: 'dark:text-blue-400',
  },
  green: {
    bg: 'bg-green-100',
    bgDark: 'dark:bg-green-900/30',
    text: 'text-green-600',
    textDark: 'dark:text-green-400',
  },
  red: {
    bg: 'bg-red-100',
    bgDark: 'dark:bg-red-900/30',
    text: 'text-red-600',
    textDark: 'dark:text-red-400',
  },
  orange: {
    bg: 'bg-orange-100',
    bgDark: 'dark:bg-orange-900/30',
    text: 'text-orange-600',
    textDark: 'dark:text-orange-400',
  },
  yellow: {
    bg: 'bg-yellow-100',
    bgDark: 'dark:bg-yellow-900/30',
    text: 'text-yellow-600',
    textDark: 'dark:text-yellow-400',
  },
  teal: {
    bg: 'bg-teal-100',
    bgDark: 'dark:bg-teal-900/30',
    text: 'text-teal-600',
    textDark: 'dark:text-teal-400',
  },
  indigo: {
    bg: 'bg-indigo-100',
    bgDark: 'dark:bg-indigo-900/30',
    text: 'text-indigo-600',
    textDark: 'dark:text-indigo-400',
  },
  pink: {
    bg: 'bg-pink-100',
    bgDark: 'dark:bg-pink-900/30',
    text: 'text-pink-600',
    textDark: 'dark:text-pink-400',
  },
} as const

/**
 * Landing page features grid
 */
export const FEATURES: Feature[] = [
  {
    id: 'collections',
    title: 'Collections',
    description: 'Organize documents by topic, project, or category. Taxes, insurance, work, personal.',
    icon: FolderOpen,
    color: FEATURE_COLORS.purple,
  },
  {
    id: 'pdf-reader',
    title: 'PDF Reader',
    description: 'Clean, simplistic PDF reader with a side panel for AI chat assistance while you read.',
    icon: FileText,
    color: FEATURE_COLORS.blue,
  },
  {
    id: 'ai-chat',
    title: 'AI Chat Helper',
    description: 'Ask questions about your document and get intelligent answers with page references.',
    icon: Bot,
    color: FEATURE_COLORS.green,
  },
  {
    id: 'favorites',
    title: 'Favorite Reads',
    description: 'Mark documents as favorites for quick access to your most important files.',
    icon: Heart,
    color: FEATURE_COLORS.red,
  },
  {
    id: 'recent-reads',
    title: 'Recent Reads',
    description: 'Quickly pick up where you left off with your recently viewed documents.',
    icon: Clock,
    color: FEATURE_COLORS.orange,
  },
  {
    id: 'bookmarks',
    title: 'Bookmarks',
    description: 'Bookmark important sections and pages to revisit key information easily.',
    icon: Bookmark,
    color: FEATURE_COLORS.yellow,
  },
  {
    id: 'reading-list',
    title: 'Reading List',
    description: 'Queue up documents you want to review next and never lose track of what needs attention.',
    icon: BookMarked,
    color: FEATURE_COLORS.teal,
  },
  {
    id: 'chat-sessions',
    title: 'Chat Sessions',
    description: 'Save and revisit your AI conversations. All chat history is preserved.',
    icon: MessageSquare,
    color: FEATURE_COLORS.indigo,
  },
  {
    id: 'document-library',
    title: 'Document Library',
    description: 'Build your personal library with unlimited documents, all searchable and organized.',
    icon: Layers,
    color: FEATURE_COLORS.pink,
  },
]
