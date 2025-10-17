/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },

  // Environment variables validation
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },

  // TypeScript and ESLint configuration
  typescript: {
    // Set to true if you want production builds to succeed even with type errors
    // (not recommended - set to false for production)
    ignoreBuildErrors: false,
  },

  eslint: {
    // Set to true if you want production builds to succeed even with ESLint errors
    // (not recommended - set to false for production)
    ignoreDuringBuilds: false,
  },

  // Experimental features
  experimental: {
    // Enable Server Actions if needed
    serverActions: true,
  },
}

module.exports = nextConfig
