import 'server-only'
import { cacheLife, cacheTag } from 'next/cache'
import { createPublicClient } from '@/lib/supabase/server'
import { storageUrl } from '@/lib/public-env'
import { slugify } from '@/lib/slug'
import { AppError, E } from '@/lib/errors'
import { isDemo } from '@/lib/env'
import { demoCategories, demoProducts } from './demo-source'
import type { Aroma, CatalogProduct, Category } from './types'
export { filterProducts } from './filter'

const SELECT = `
  id, slug, name, description, aroma, volume, price, old_price, discount_percent,
  in_stock, is_new, is_hit, sort, created_at,
  brand:brands(name),
  category:categories(slug, name),
  images:product_images(path, sort)
` as const

type Raw = {
  id: string
  slug: string
  name: string
  description: string | null
  aroma: string | null
  volume: string | null
  price: number
  old_price: number | null
  discount_percent: number | null
  in_stock: boolean
  is_new: boolean
  is_hit: boolean
  created_at: string
  brand: { name: string } | null
  category: { slug: string; name: string } | null
  images: { path: string; sort: number }[]
}

function toProduct(r: Raw): CatalogProduct {
  return {
    id: r.id,
    slug: r.slug,
    name: r.name,
    description: r.description,
    aroma: r.aroma,
    aromaSlug: r.aroma ? slugify(r.aroma) : null,
    volume: r.volume,
    price: Number(r.price),
    oldPrice: r.old_price === null ? null : Number(r.old_price),
    discount: r.discount_percent,
    inStock: r.in_stock,
    isNew: r.is_new,
    isHit: r.is_hit,
    brand: r.brand?.name ?? '',
    category: r.category ?? { slug: '', name: '' },
    images: [...(r.images ?? [])].sort((a, b) => a.sort - b.sort).map((i) => storageUrl(i.path)),
    createdAt: r.created_at,
  }
}

/** Все опубликованные товары (≤ сотни) — один кэшируемый запрос, фильтрация в памяти. */
export async function getAllProducts(): Promise<CatalogProduct[]> {
  'use cache'
  cacheLife('max')
  cacheTag('products')

  if (isDemo) return demoProducts

  const supabase = createPublicClient()
  const { data, error } = await supabase
    .from('products')
    .select(SELECT)
    .eq('status', 'published')
    .order('sort', { ascending: true })
    .order('created_at', { ascending: false })

  if (error) throw new AppError(E.DATASOURCE_DOWN, 'Каталог временно недоступен', error.message)
  return (data as unknown as Raw[]).map(toProduct)
}

export async function getCategories(): Promise<Category[]> {
  'use cache'
  cacheLife('max')
  cacheTag('products', 'categories')

  if (isDemo) return demoCategories

  const supabase = createPublicClient()
  const [{ data, error }, products] = await Promise.all([
    supabase.from('categories').select('slug, name').order('sort'),
    getAllProducts(),
  ])
  if (error) throw new AppError(E.DATASOURCE_DOWN, 'Каталог временно недоступен', error.message)
  return (data ?? [])
    .map((c) => ({ ...c, count: products.filter((p) => p.category.slug === c.slug).length }))
    .filter((c) => c.count > 0)
}

export async function getAromas(): Promise<Aroma[]> {
  const products = await getAllProducts()
  const map = new Map<string, Aroma>()
  for (const p of products) {
    if (!p.aroma || !p.aromaSlug) continue
    const a = map.get(p.aromaSlug) ?? { slug: p.aromaSlug, name: p.aroma, count: 0, image: p.images[0] ?? null }
    a.count += 1
    map.set(p.aromaSlug, a)
  }
  return [...map.values()].sort((a, b) => b.count - a.count)
}

export async function getProductBySlug(slug: string): Promise<CatalogProduct | null> {
  const products = await getAllProducts()
  return products.find((p) => p.slug === slug) ?? null
}
