/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Security headers
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ]
  },

  // API route configuration
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: '/api/:path*',
      },
    ]
  },

  // Environment variables validation
  env: {
    APP_VERSION: process.env.npm_package_version || '1.0.0',
  },

  // Server external packages
  serverExternalPackages: ['pdf-parse', 'sharp'],

  // Image optimization
  images: {
    domains: ['localhost', process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('https://', '') || ''],
    formats: ['image/avif', 'image/webp'],
  },

  // Webpack configuration
  webpack: (config, { isServer }) => {
    // Handle PDF.js worker
    config.module.rules.push({
      test: /\.pdf$/,
      use: 'file-loader',
    })

    // Ignore node_modules in certain packages
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      }
    }

    return config
  },

  // Production optimizations
  productionBrowserSourceMaps: false,
  compress: true,

  // Powered by header removal
  poweredByHeader: false,

  // Output configuration
  output: 'standalone',
}

module.exports = nextConfig