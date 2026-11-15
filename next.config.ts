import type { NextConfig } from 'next'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL) : null
const isLocalSupabase = supabaseUrl ? ['127.0.0.1', 'localhost'].includes(supabaseUrl.hostname) : false

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  serverExternalPackages: ['sharp', 'pino'],
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co', pathname: '/storage/v1/object/public/**' },
      ...(supabaseUrl
        ? [{ protocol: supabaseUrl.protocol.replace(':', '') as 'http' | 'https', hostname: supabaseUrl.hostname, port: supabaseUrl.port, pathname: '/storage/v1/object/public/**' }]
        : []),
    ],
    // Только для локальной разработки с Supabase на 127.0.0.1
    dangerouslyAllowLocalIP: isLocalSupabase,
  },
  turbopack: {
    rules: {
      '*.css': {
        loaders: ['@tailwindcss/turbopack'],
        as: '*.css',
      },
    },
  },
}

export default nextConfig
