/**
 * Загрузка стартового каталога La Sultane de Saba (62 товара) в Supabase.
 * Идемпотентно: upsert по slug, фото перезаливаются в seed/<slug>/.
 * Запуск: pnpm seed:catalog   (для прод: tsx --env-file=.env.production.local scripts/seed-catalog.ts)
 */
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/database'
import { aromaOf, categoryOf, cleanName, isHit, newestSlugs, volumeOf, type SeedProduct } from '../lib/catalog/seed-map'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) throw new Error('Нужны NEXT_PUBLIC_SUPABASE_URL и SUPABASE_SERVICE_ROLE_KEY')
const db = createClient<Database>(url, key, { auth: { persistSession: false } })

const ROOT = path.resolve(__dirname, '..')
const IMAGES = path.join(ROOT, 'public', 'catalog')
const products: SeedProduct[] = JSON.parse(readFileSync(path.join(ROOT, 'data', 'seed', 'products.json'), 'utf8'))

async function main() {
  const [{ data: brand }, { data: cats }] = await Promise.all([
    db.from('brands').select('id').eq('slug', 'la-sultane-de-saba').single(),
    db.from('categories').select('id, slug'),
  ])
  if (!brand || !cats) throw new Error('Сначала примените миграции (supabase db reset / db push)')
  const catId = Object.fromEntries(cats.map((c) => [c.slug, c.id]))
  const newest = newestSlugs(products)

  let i = 0
  for (const p of products) {
    i++
    const name = cleanName(p.name)
    const category = categoryOf(name)
    const row = {
      slug: p.slug,
      brand_id: brand.id,
      category_id: catId[category],
      name,
      description: p.description || null,
      aroma: aromaOf(p.name),
      volume: volumeOf(p),
      price: p.price,
      old_price: p.old_price && p.old_price > p.price ? p.old_price : null,
      status: 'published',
      in_stock: p.in_stock,
      is_new: newest.has(p.slug),
      is_hit: isHit(name),
      sort: i,
    }
    const { data: saved, error } = await db.from('products').upsert(row, { onConflict: 'slug' }).select('id').single()
    if (error || !saved) throw new Error(`${p.slug}: ${error?.message}`)

    await db.from('product_images').delete().eq('product_id', saved.id)
    const images = []
    for (const [idx, file] of p.images.entries()) {
      const storagePath = `seed/${p.slug}/${file}`
      const body = readFileSync(path.join(IMAGES, file))
      const { error: upErr } = await db.storage.from('products').upload(storagePath, body, { contentType: 'image/webp', upsert: true })
      if (upErr) throw new Error(`upload ${storagePath}: ${upErr.message}`)
      images.push({ product_id: saved.id, path: storagePath, sort: idx })
    }
    if (images.length) await db.from('product_images').insert(images)
    console.log(`${String(i).padStart(2)}/${products.length} ${name} → ${category} · ${row.aroma ?? '—'} · ${images.length} фото`)
  }
  console.log('Готово ✅')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
