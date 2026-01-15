/**
 * Branding constants for ThinkFolio
 * Single source of truth for all brand-related text and messaging
 */

export const BRAND = {
  name: 'ThinkFolio',
  tagline: 'Reading that talks back.',
  subTagline: 'Think faster. Struggle less.',
  description: 'Upload any PDF and chat with it. Tax forms, insurance policies, contracts, terms & conditions, research papers. Get instant answers with page citations.',
  metaDescription: 'Upload, analyze, and chat with PDFs, books, and documents using AI',
} as const

export const BRAND_COPY = {
  hero: {
    title: BRAND.tagline,
    subtitle: BRAND.subTagline,
    description: BRAND.description,
    cta: 'Get Started Free',
    ctaSecondary: 'Start for Free',
  },
  howItWorks: {
    title: `How ${BRAND.name} Works`,
    subtitle: 'Three simple steps to understand any document',
    steps: [
      {
        title: '1. Upload Any Document',
        description: 'Drop any PDF: contracts, tax docs, manuals, legal papers. We securely process and index everything.',
      },
      {
        title: '2. Ask Questions',
        description: 'Have natural conversations with your documents. Ask anything about the content.',
      },
      {
        title: '3. Get Cited Answers',
        description: 'Every answer comes with precise page citations. Verify sources instantly.',
      },
    ],
  },
  features: {
    title: 'Everything You Need',
    subtitle: 'Powerful features to organize and interact with your documents',
  },
  benefits: {
    title: 'Built for people who value their time',
    items: [
      { label: 'Smart chunking', description: 'Documents are intelligently split for accurate retrieval' },
      { label: 'Secure storage', description: 'Your documents are private and encrypted' },
      { label: 'Precise citations', description: 'Every answer includes exact page numbers' },
      { label: 'Clean interface', description: 'Distraction-free reading experience' },
    ],
    aiCard: {
      title: 'Powered by AI',
      description: `${BRAND.name} uses advanced language models to understand your documents deeply and provide accurate, contextual answers with citations.`,
      fileSupport: 'Supports PDF files up to 50MB',
    },
  },
  cta: {
    title: 'Stop struggling with dense documents',
    description: "Whether it's taxes, insurance, contracts, or research. Let AI help you understand it all.",
  },
  auth: {
    signIn: {
      tab: 'Sign In',
      button: 'Sign In',
      loading: 'Signing in...',
      noAccount: "Don't have an account?",
      createLink: 'Create one',
    },
    signUp: {
      tab: 'Create Account',
      button: 'Create Account',
      loading: 'Creating account...',
      hasAccount: 'Already have an account?',
      signInLink: 'Sign in',
      success: 'Account created! Please check your email to confirm your account.',
      passwordHint: 'Must be at least 6 characters',
    },
    labels: {
      email: 'Email address',
      password: 'Password',
      fullName: 'Full name',
    },
    placeholders: {
      email: 'you@example.com',
      password: 'Enter your password',
      passwordCreate: 'Create a password',
      fullName: 'John Doe',
    },
  },
  footer: {
    poweredBy: 'Powered by',
  },
} as const
