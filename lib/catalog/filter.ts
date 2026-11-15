import type { CatalogFilter, CatalogProduct, CatalogSort } from './types'

export const SORTS: CatalogSort[] = ['new', 'cheap', 'expensive', 'sale']

/** Чистая фильтрация (работает и на сервере, и в браузере). */
export function filterProducts(products: CatalogProduct[], f: CatalogFilter) {
  let list = products
  if (f.category) list = list.filter((p) => p.category.slug === f.category)
  if (f.aroma) list = list.filter((p) => p.aromaSlug === f.aroma)
  if (f.q) {
    const q = f.q.toLowerCase().trim()
    list = list.filter((p) => p.name.toLowerCase().includes(q) || (p.aroma ?? '').toLowerCase().includes(q))
  }
  switch (f.sort) {
    case 'cheap':
      return [...list].sort((a, b) => a.price - b.price)
    case 'expensive':
      return [...list].sort((a, b) => b.price - a.price)
    case 'sale':
      return [...list].filter((p) => p.discount).sort((a, b) => (b.discount ?? 0) - (a.discount ?? 0))
    default:
      return list
  }
}
