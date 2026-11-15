import { publicEnv } from '@/lib/public-env'

/** robots.txt для серверного режима. В статической сборке его пишет scripts/static-meta.ts. */
export function GET() {
  const base = publicEnv.siteUrl.replace(/\/$/, '')
  return new Response(`User-agent: *\nAllow: /\nDisallow: /checkout\nDisallow: /api/\n\nSitemap: ${base}/sitemap.xml\n`, {
    headers: { 'content-type': 'text/plain; charset=utf-8' },
  })
}
