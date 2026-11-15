import type { NextConfig } from 'next'

/**
 * Два режима сборки:
 * - обычный (Vercel/Node): серверные actions, вебхук бота, Supabase;
 * - статический для GitHub Pages: NEXT_PUBLIC_STATIC_EXPORT=1 (+ NEXT_PUBLIC_BASE_PATH=/lunara-shop).
 *   Нет сервера → actions подменяются клиентскими (lib/orders/static-actions.ts),
 *   вебхук (route.server.ts) не попадает в сборку, картинки без оптимизатора.
 */
const isStatic = process.env.NEXT_PUBLIC_STATIC_EXPORT === '1'
const basePath = isStatic ? (process.env.NEXT_PUBLIC_BASE_PATH ?? '') : ''

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL) : null
const isLocalSupabase = supabaseUrl ? ['127.0.0.1', 'localhost'].includes(supabaseUrl.hostname) : false

const nextConfig: NextConfig = {
  // Статический экспорт несовместим с Cache Components (PPR) — в нём выключаем
  cacheComponents: !isStatic,
  ...(isStatic ? {} : { partialPrefetching: true }),
  serverExternalPackages: ['sharp', 'pino'],
  // route.server.ts — только для серверного режима (вебхук Telegram)
  pageExtensions: isStatic ? ['tsx', 'ts'] : ['tsx', 'ts', 'server.ts'],
  ...(isStatic ? { output: 'export' as const, basePath, trailingSlash: true } : {}),
  images: isStatic
    ? { unoptimized: true }
    : {
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
    resolveAlias: isStatic
      ? {
          '@/app/(shop)/checkout/actions': './lib/orders/static-actions.ts',
          '@/lib/catalog/queries': './lib/catalog/static-queries.ts',
        }
      : {},
  },
}

export default nextConfig
