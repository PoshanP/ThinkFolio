/**
 * Asset paths and external URLs
 * Centralized management of all static assets and external resources
 */

export const ASSETS = {
  logo: {
    path: '/logo.png',
    alt: 'ThinkFolio',
  },
} as const

export const EXTERNAL_LINKS = {
  devswarm: {
    url: 'https://devswarm.ai/',
    logo: 'https://cdn.prod.website-files.com/684228174606b26ec8e3e29e/684b4952707b6e17b3ef79df_Logo.png',
    alt: 'DevSwarm',
  },
} as const

/**
 * Image dimensions for Next.js Image component
 * Using standard dimensions to prevent layout shift
 */
export const IMAGE_DIMENSIONS = {
  logo: {
    landing: { width: 400, height: 120 },
    auth: { width: 200, height: 60 },
    navbar: { width: 120, height: 32 },
    mobile: { width: 100, height: 28 },
  },
} as const
