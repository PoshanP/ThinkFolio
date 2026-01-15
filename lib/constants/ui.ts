/**
 * UI constants for consistent styling
 * Touch targets, spacing, and common style patterns
 */

/**
 * Minimum touch target sizes for accessibility (WCAG 2.1)
 * All interactive elements should meet these minimums
 */
export const TOUCH_TARGETS = {
  minimum: 44, // px - WCAG minimum
  comfortable: 48, // px - recommended for primary actions
} as const

/**
 * Common Tailwind class combinations for reuse
 * These help maintain consistency and reduce duplication
 */
export const STYLE_CLASSES = {
  // Touch-friendly button base
  touchTarget: 'min-h-[44px] min-w-[44px]',
  touchTargetComfortable: 'min-h-[48px]',

  // Card styles
  card: 'bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg border border-gray-200 dark:border-gray-700',
  cardXl: 'bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl border border-gray-200 dark:border-gray-700',
  card2xl: 'bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xl',

  // Section backgrounds
  sectionBg: 'bg-gray-100/80 dark:bg-gray-800/80 backdrop-blur-sm',

  // Primary button
  buttonPrimary: 'bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition-colors',
  buttonPrimaryWithShadow: 'bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all',

  // Input styles
  input: 'border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow',

  // Text colors
  textPrimary: 'text-gray-900 dark:text-white',
  textSecondary: 'text-gray-600 dark:text-gray-400',
  textMuted: 'text-gray-500 dark:text-gray-500',

  // Border colors
  borderDefault: 'border-gray-200 dark:border-gray-700',
  borderSection: 'border-t border-gray-200 dark:border-gray-700',

  // Logo invert for theme
  logoTheme: 'dark:invert-0 invert',
} as const

/**
 * Responsive logo sizes
 */
export const LOGO_SIZES = {
  landing: 'h-24 sm:h-32 lg:h-40',
  auth: 'h-16 sm:h-20',
  navbar: 'h-6 md:h-7',
  mobile: 'h-6',
} as const

/**
 * Icon sizes for consistency
 */
export const ICON_SIZES = {
  xs: 'h-4 w-4',
  sm: 'h-5 w-5',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
} as const

/**
 * Feature icon container sizes
 */
export const FEATURE_ICON_CONTAINER = {
  sm: 'w-10 h-10',
  md: 'w-12 h-12',
} as const

/**
 * Password requirements
 */
export const PASSWORD_REQUIREMENTS = {
  minLength: 6,
} as const
