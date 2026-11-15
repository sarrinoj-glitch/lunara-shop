import 'server-only'
import seed from '@/data/seed/products.json'
import { slugify } from '@/lib/slug'
import type { CatalogProduct, Category } from './types'
import {
  CATEGORIES,
  SEED_BRAND,
  aromaOf,
  categoryOf,
  cleanName,
  discountOf,
  isHit,
  newestSlugs,
  volumeOf,
  type SeedProduct,
} from './seed-map'

/**
 * Демо-источник (заглушка вместо Supabase): каталог из data/seed/products.json,
 * фото из public/catalog. Включается, когда не заданы ключи Supabase.
 */
const products = seed as SeedProduct[]
const newest = newestSlugs(products)

const CREATED = '2026-11-15T00:00:00.000Z'

export const demoProducts: CatalogProduct[] = products.map((p, i) => {
  const name = cleanName(p.name)
  const catSlug = categoryOf(name)
  const aroma = aromaOf(p.name)
  const oldPrice = p.old_price && p.old_price > p.price ? p.old_price : null
  return {
    // стабильный псевдо-uuid из индекса — нужен для корзины и формы заказа
    id: `00000000-0000-4000-8000-${String(i + 1).padStart(12, '0')}`,
    slug: p.slug,
    name,
    description: p.description || null,
    aroma,
    aromaSlug: aroma ? slugify(aroma) : null,
    volume: volumeOf(p),
    price: p.price,
    oldPrice,
    discount: discountOf(p.price, oldPrice),
    inStock: p.in_stock,
    isNew: newest.has(p.slug),
    isHit: isHit(name),
    brand: SEED_BRAND,
    category: { slug: catSlug, name: CATEGORIES.find((c) => c.slug === catSlug)!.name },
    // basePath нужен для GitHub Pages (сайт живёт в /lunara-shop); next/image без оптимизатора его не добавляет
    images: p.images.map((f) => `${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/catalog/${f}`),
    createdAt: CREATED,
  }
})

export const demoCategories: Category[] = CATEGORIES.map((c) => ({
  slug: c.slug,
  name: c.name,
  count: demoProducts.filter((p) => p.category.slug === c.slug).length,
})).filter((c) => c.count > 0)
