import type { MetadataRoute } from 'next'
import { getAllProducts } from '@/lib/catalog/queries'
import { publicEnv } from '@/lib/public-env'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await getAllProducts()
  const base = publicEnv.siteUrl
  return [
    { url: base, changeFrequency: 'daily', priority: 1 },
    { url: `${base}/catalog`, changeFrequency: 'daily', priority: 0.9 },
    ...products.map((p) => ({ url: `${base}/product/${p.slug}`, changeFrequency: 'weekly' as const, priority: 0.7 })),
  ]
}
