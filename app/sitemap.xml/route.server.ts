import { getAllProducts } from '@/lib/catalog/queries'
import { publicEnv } from '@/lib/public-env'

/**
 * sitemap.xml для серверного режима (обновляется вместе с каталогом через тег 'products').
 * В статической сборке (GitHub Pages) этот файл исключён, sitemap пишет scripts/static-meta.ts.
 */
export async function GET() {
  const base = publicEnv.siteUrl.replace(/\/$/, '')
  const products = await getAllProducts()
  const urls = [`${base}/`, `${base}/catalog`, ...products.map((p) => `${base}/product/${p.slug}`)]
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
    .map((u) => `  <url><loc>${u}</loc></url>`)
    .join('\n')}\n</urlset>\n`
  return new Response(xml, { headers: { 'content-type': 'application/xml; charset=utf-8' } })
}
