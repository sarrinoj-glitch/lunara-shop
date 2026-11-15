import 'server-only'
import { revalidateTag } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/server'
import { slugify } from '@/lib/slug'
import { removeStorageFiles } from './images'

export type BotProduct = {
  id: string
  slug: string
  name: string
  price: number
  old_price: number | null
  status: string
  in_stock: boolean
  is_hit: boolean
  is_new: boolean
  aroma: string | null
  volume: string | null
  description: string | null
  category: { slug: string; name: string } | null
  images: { id: string; path: string; sort: number }[]
}

const SELECT =
  'id, slug, name, price, old_price, status, in_stock, is_hit, is_new, aroma, volume, description, category:categories(slug, name), images:product_images(id, path, sort)'

export function refreshSite() {
  try {
    revalidateTag('products', 'max')
  } catch {
    // вне запроса Next.js (скрипты/тесты) кэша нет — нечего сбрасывать
  }
}

export async function getProduct(id: string): Promise<BotProduct | null> {
  const { data } = await createAdminClient().from('products').select(SELECT).eq('id', id).maybeSingle()
  if (!data) return null
  const p = data as unknown as BotProduct
  p.images = [...(p.images ?? [])].sort((a, b) => a.sort - b.sort)
  return p
}

export async function searchProducts(q: string) {
  const { data } = await createAdminClient()
    .from('products')
    .select('id, name, price, status, in_stock')
    .ilike('name', `%${q.replace(/[%_]/g, '')}%`)
    .order('updated_at', { ascending: false, nullsFirst: false })
    .limit(10)
  return data ?? []
}

export async function listProducts(kind: 'latest' | 'hidden' | 'outOfStock' | 'drafts') {
  let query = createAdminClient().from('products').select('id, name, price, status, in_stock')
  if (kind === 'hidden') query = query.eq('status', 'hidden')
  if (kind === 'drafts') query = query.eq('status', 'draft')
  if (kind === 'outOfStock') query = query.eq('in_stock', false)
  const { data } = await query.order('created_at', { ascending: false }).limit(10)
  return data ?? []
}

export async function listCategories() {
  const { data } = await createAdminClient().from('categories').select('id, slug, name').order('sort')
  return data ?? []
}

export async function listAromas(limit = 10) {
  const { data } = await createAdminClient().from('products').select('aroma').not('aroma', 'is', null)
  const counts = new Map<string, number>()
  for (const r of data ?? []) if (r.aroma) counts.set(r.aroma, (counts.get(r.aroma) ?? 0) + 1)
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit).map(([a]) => a)
}

async function uniqueSlug(name: string) {
  const base = slugify(name) || 'tovar'
  const db = createAdminClient()
  const { data } = await db.from('products').select('slug').like('slug', `${base}%`)
  const taken = new Set((data ?? []).map((r) => r.slug))
  if (!taken.has(base)) return base
  let i = 2
  while (taken.has(`${base}-${i}`)) i++
  return `${base}-${i}`
}

export async function createProduct(input: {
  name: string
  price: number
  oldPrice: number | null
  categorySlug: string
  aroma: string | null
  volume: string | null
  description: string | null
  status: 'published' | 'draft'
}) {
  const db = createAdminClient()
  const [{ data: brand }, { data: category }] = await Promise.all([
    db.from('brands').select('id').order('created_at').limit(1).single(),
    db.from('categories').select('id').eq('slug', input.categorySlug).single(),
  ])
  if (!brand || !category) throw new Error('brand/category not found')
  const { data, error } = await db
    .from('products')
    .insert({
      slug: await uniqueSlug(input.name),
      brand_id: brand.id,
      category_id: category.id,
      name: input.name,
      price: input.price,
      old_price: input.oldPrice,
      aroma: input.aroma,
      volume: input.volume,
      description: input.description,
      status: input.status,
      is_new: true,
      sort: -Math.floor(Date.now() / 1000), // новые — первыми
    })
    .select('id, slug')
    .single()
  if (error || !data) throw new Error(error?.message ?? 'insert failed')
  return data
}

export async function addImages(productId: string, images: { path: string; width: number; height: number }[], startSort = 0) {
  if (images.length === 0) return
  await createAdminClient()
    .from('product_images')
    .insert(images.map((img, i) => ({ product_id: productId, path: img.path, width: img.width, height: img.height, sort: startSort + i })))
}

export async function replaceImages(productId: string, images: { path: string; width: number; height: number }[]) {
  const db = createAdminClient()
  const { data: old } = await db.from('product_images').select('id, path').eq('product_id', productId)
  await db.from('product_images').delete().eq('product_id', productId)
  await addImages(productId, images)
  await removeStorageFiles((old ?? []).map((o) => o.path).filter((p) => !p.startsWith('seed/')))
}

type Patch = Partial<{
  name: string
  price: number
  old_price: number | null
  description: string | null
  status: 'published' | 'hidden' | 'draft'
  in_stock: boolean
  is_hit: boolean
  is_new: boolean
}>

export async function updateProduct(id: string, patch: Patch) {
  const { error } = await createAdminClient().from('products').update(patch).eq('id', id)
  if (error) throw new Error(error.message)
  refreshSite()
}

export async function deleteProduct(id: string) {
  const db = createAdminClient()
  const { data: imgs } = await db.from('product_images').select('path').eq('product_id', id)
  await db.from('products').delete().eq('id', id)
  await removeStorageFiles((imgs ?? []).map((i) => i.path))
  refreshSite()
}

/* ===== Заказы ===== */
export async function listOpenOrders() {
  const { data } = await createAdminClient()
    .from('orders')
    .select('id, number, customer_name, total, status, created_at')
    .in('status', ['new', 'in_work'])
    .order('created_at', { ascending: false })
    .limit(10)
  return data ?? []
}

export async function getOrder(id: string) {
  const { data } = await createAdminClient()
    .from('orders')
    .select('id, number, customer_name, customer_phone, city, comment, total, status, created_at, items:order_items(name_snapshot, price_snapshot, quantity)')
    .eq('id', id)
    .maybeSingle()
  return data
}

export async function setOrderStatus(id: string, status: 'new' | 'in_work' | 'done' | 'cancelled') {
  await createAdminClient().from('orders').update({ status }).eq('id', id)
}
