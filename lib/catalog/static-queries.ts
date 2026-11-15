import 'server-only'
/**
 * Версия lib/catalog/queries.ts для статической сборки (GitHub Pages).
 * Подставляется через resolveAlias при NEXT_PUBLIC_STATIC_EXPORT=1:
 * статический экспорт несовместим с Cache Components, поэтому здесь нет 'use cache' —
 * данные и так читаются один раз при сборке.
 */
import { demoCategories, demoProducts } from './demo-source'
import type { Aroma, CatalogProduct, Category } from './types'
export { filterProducts } from './filter'

export async function getAllProducts(): Promise<CatalogProduct[]> {
  return demoProducts
}

export async function getCategories(): Promise<Category[]> {
  return demoCategories
}

export async function getAromas(): Promise<Aroma[]> {
  const map = new Map<string, Aroma>()
  for (const p of demoProducts) {
    if (!p.aroma || !p.aromaSlug) continue
    const a = map.get(p.aromaSlug) ?? { slug: p.aromaSlug, name: p.aroma, count: 0, image: p.images[0] ?? null }
    a.count += 1
    map.set(p.aromaSlug, a)
  }
  return [...map.values()].sort((a, b) => b.count - a.count)
}

export async function getProductBySlug(slug: string): Promise<CatalogProduct | null> {
  return demoProducts.find((p) => p.slug === slug) ?? null
}
