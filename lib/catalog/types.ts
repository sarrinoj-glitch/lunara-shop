import type { Database } from '@/types/database'

export type ProductRow = Database['public']['Tables']['products']['Row']
export type CategoryRow = Database['public']['Tables']['categories']['Row']

/** Товар в форме, удобной для UI (сериализуемый — передаётся в клиентские компоненты). */
export type CatalogProduct = {
  id: string
  slug: string
  name: string
  description: string | null
  aroma: string | null
  aromaSlug: string | null
  volume: string | null
  price: number
  oldPrice: number | null
  discount: number | null
  inStock: boolean
  isNew: boolean
  isHit: boolean
  brand: string
  category: { slug: string; name: string }
  images: string[]
  createdAt: string
}

export type Category = Pick<CategoryRow, 'slug' | 'name'> & { count: number }
export type Aroma = { slug: string; name: string; count: number; image: string | null }

export type CatalogSort = 'new' | 'cheap' | 'expensive' | 'sale'
export type CatalogFilter = { category?: string; aroma?: string; sort?: CatalogSort; q?: string }
