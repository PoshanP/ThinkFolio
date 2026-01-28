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
 * Theme color names (maps to Tailwind classes)
 * Primary: Sky blue - used for main actions, links, highlights
 * Secondary: Emerald green - used for buttons, success states
 * Accent: Amber/warm beige - used for emphasis, hover states
 */
export const THEME_COLORS = {
  // Primary (Sky Blue)
  primary: {
    text: 'text-sky-600 dark:text-sky-400',
    textHover: 'hover:text-sky-700 dark:hover:text-sky-300',
    bg: 'bg-sky-600 dark:bg-sky-500',
    bgLight: 'bg-sky-50 dark:bg-sky-900/20',
    bgHover: 'hover:bg-sky-50/50 dark:hover:bg-sky-900/20',
    border: 'border-sky-200 dark:border-sky-700',
    borderHover: 'hover:border-sky-400 dark:hover:border-sky-500',
    ring: 'focus:ring-sky-500',
  },
  // Secondary (Emerald Green)
  secondary: {
    text: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-600 hover:bg-emerald-700',
    bgLight: 'bg-emerald-50 dark:bg-emerald-900/20',
    shadow: 'shadow-emerald-500/25 hover:shadow-emerald-500/40',
  },
  // Accent (Amber/Warm Beige)
  accent: {
    text: 'text-amber-600 dark:text-amber-400',
    textHover: 'hover:text-amber-700 dark:hover:text-amber-300',
    bg: 'bg-amber-500 hover:bg-amber-600',
    bgLight: 'bg-amber-50 dark:bg-amber-900/20',
  },
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

  // Primary button (uses secondary/emerald color)
  buttonPrimary: 'bg-emerald-600 hover:bg-emerald-700 text-white font-medium transition-colors',
  buttonPrimaryWithShadow: 'bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all',

  // Secondary button (outline style with primary/sky color)
  buttonSecondary: 'bg-white dark:bg-gray-900 text-sky-600 dark:text-sky-400 font-semibold',

  // Input styles
  input: 'border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-shadow',

  // Text colors
  textPrimary: 'text-gray-900 dark:text-white',
  textSecondary: 'text-gray-600 dark:text-gray-400',
  textMuted: 'text-gray-500 dark:text-gray-500',

  // Theme text colors
  textThemePrimary: 'text-sky-600 dark:text-sky-400',
  textThemeAccent: 'text-amber-600 dark:text-amber-400',
  hoverTextPrimary: 'hover:text-sky-600 dark:hover:text-sky-400',

  // Citation/highlight badge
  badgeCitation: 'bg-sky-100 dark:bg-sky-900 text-sky-700 dark:text-sky-300 hover:bg-sky-200 dark:hover:bg-sky-800',

  // Active/selected states
  activeItem: 'bg-sky-50 dark:bg-sky-900/20',
  activeItemBorder: 'border-sky-600 bg-sky-600',
  activeText: 'text-sky-600 dark:text-sky-400',
  activeNavItem: 'bg-sky-50 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400',

  // Toggle button active state
  toggleButtonActive: 'bg-white dark:bg-gray-600 text-sky-600 dark:text-sky-400 shadow-sm',

  // Star/decorative element color
  starColor: 'bg-sky-400 dark:bg-white',

  // Border colors
  borderDefault: 'border-gray-200 dark:border-gray-700',
  borderSection: 'border-t border-gray-200 dark:border-gray-700',
  borderThemePrimary: 'border-sky-200 dark:border-sky-700',
  borderThemeSecondary: 'border-emerald-200 dark:border-emerald-700',

  // Tab styles
  tabActive: 'text-sky-600 dark:text-sky-400',
  tabInactive: 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300',
  tabIndicator: 'bg-sky-600 dark:bg-sky-400',

  // Link styles
  linkPrimary: 'text-sky-600 dark:text-sky-400 hover:underline font-medium',
  linkAccent: 'text-amber-600 dark:text-amber-400 hover:underline font-medium',

  // Badge styles
  badgePrimary: 'border-sky-200 dark:border-sky-700 bg-white/80 dark:bg-gray-900/80',
  badgeText: 'text-sky-600 dark:text-sky-400',

  // Back button style
  backButton: 'flex items-center gap-2 px-3 py-2 rounded-lg border border-sky-200 dark:border-sky-700 bg-transparent text-sky-600 dark:text-sky-400 text-sm font-medium hover:border-sky-400 dark:hover:border-sky-500 hover:bg-sky-50/50 dark:hover:bg-sky-900/20 transition-all duration-200',

  // Icon colors
  iconPrimary: 'text-sky-600 dark:text-sky-400',
  iconSecondary: 'text-emerald-600 dark:text-emerald-400',
  iconAccent: 'text-amber-600 dark:text-amber-400',
  iconMuted: 'text-gray-400',

  // Logo invert for theme
  logoTheme: 'dark:invert-0 invert',

  // CTA section
  ctaSection: 'cta-gradient rounded-xl border border-sky-200 dark:border-sky-800',
  ctaGlow: 'bg-sky-500/10',
  ctaGlowSecondary: 'bg-emerald-500/10',

  // Gradient card
  gradientCard: 'bg-gradient-to-br from-sky-50 to-emerald-50 dark:from-sky-900/20 dark:to-emerald-900/20 backdrop-blur-sm border border-sky-100 dark:border-sky-800',

  // Toggle/Tab active states (for upload section)
  toggleActivePrimary: 'bg-emerald-600 text-white',
  toggleActiveAccent: 'bg-amber-500 text-white',
  toggleInactive: 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700',

  // Accent button (amber - for secondary actions like "Next Read")
  buttonAccent: 'bg-amber-500 hover:bg-amber-600 text-white',

  // Drop zone styles
  dropZone: 'border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-sky-500 dark:hover:border-sky-400 hover:bg-sky-50 dark:hover:bg-sky-900/10 transition-all',
  dropZoneIcon: 'bg-sky-100 dark:bg-sky-900/30',
  dropZoneIconColor: 'text-sky-600 dark:text-sky-400',

  // Input focus ring (uses primary color)
  inputFocusRing: 'focus:ring-sky-500',

  // Processing/loading spinner color
  spinnerColor: 'text-sky-600 dark:text-sky-400',

  // File selected state
  fileSelectedBorder: 'border-2 border-dashed border-sky-300 dark:border-sky-600 rounded-lg',
  fileSelectedBg: 'bg-sky-50 dark:bg-sky-900/20',
  fileIconColor: 'text-sky-600 dark:text-sky-400',
} as const

/**
 * Background orb styles for animated backgrounds
 * Used in landing page and auth page
 */
export const BACKGROUND_ORBS = {
  orb1: 'absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-sky-400/30 via-cyan-400/20 to-transparent dark:from-sky-600/20 dark:via-cyan-600/10 rounded-full blur-3xl animate-float-slow',
  orb2: 'absolute -bottom-32 -left-32 w-80 h-80 bg-gradient-to-tr from-emerald-400/25 via-teal-400/15 to-transparent dark:from-emerald-600/15 dark:via-teal-600/10 rounded-full blur-3xl animate-float-slow-reverse',
  orb3: 'absolute top-1/2 -right-20 w-64 h-64 bg-gradient-to-l from-sky-300/20 via-emerald-400/10 to-transparent dark:from-sky-500/15 dark:via-emerald-500/10 rounded-full blur-3xl animate-pulse-subtle',
  orb4: 'absolute top-32 left-20 w-32 h-32 bg-gradient-to-br from-amber-300/20 to-yellow-400/10 dark:from-amber-400/15 dark:to-yellow-500/10 rounded-full blur-2xl animate-float',
  orb5: 'absolute top-[60%] left-1/4 w-48 h-48 bg-gradient-to-tr from-teal-400/15 via-sky-400/10 to-transparent dark:from-teal-500/10 dark:via-sky-500/5 rounded-full blur-3xl animate-float-slow',
  // Container for all orbs
  container: 'fixed inset-0 -z-10 overflow-hidden pointer-events-none',
  // Additional texture layers
  grid: 'absolute inset-0 bg-grid-pattern opacity-[0.02] dark:opacity-[0.04]',
  noise: 'absolute inset-0 bg-noise opacity-[0.015] dark:opacity-[0.03] mix-blend-overlay',
  vignette: 'absolute inset-0 bg-radial-vignette',
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
