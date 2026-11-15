/**
 * Для статической сборки (GitHub Pages): пишет out/robots.txt, out/sitemap.xml
 * и out/.nojekyll (иначе Pages не отдаст папку _next).
 * В серверном режиме эти файлы генерируют app/robots.server.ts и app/sitemap.server.ts.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import path from 'node:path'
import type { SeedProduct } from '../lib/catalog/seed-map'

const OUT = path.resolve(__dirname, '..', 'out')
if (!existsSync(OUT)) throw new Error('Нет папки out/ — сначала статическая сборка')

const site = (process.env.NEXT_PUBLIC_SITE_URL ?? '').replace(/\/$/, '')
const products: SeedProduct[] = JSON.parse(readFileSync(path.resolve(__dirname, '..', 'data/seed/products.json'), 'utf8'))

const urls = [`${site}/`, `${site}/catalog/`, ...products.map((p) => `${site}/product/${p.slug}/`)]
writeFileSync(
  path.join(OUT, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
    .map((u) => `  <url><loc>${u}</loc></url>`)
    .join('\n')}\n</urlset>\n`,
)
writeFileSync(path.join(OUT, 'robots.txt'), `User-agent: *\nAllow: /\nDisallow: /checkout/\n\nSitemap: ${site}/sitemap.xml\n`)
writeFileSync(path.join(OUT, '.nojekyll'), '')
console.log(`static meta: ${urls.length} url в sitemap`)
