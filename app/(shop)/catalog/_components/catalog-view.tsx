'use client'

import { useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { ProductCard } from '@/components/shop/product-card'
import { EmptyState } from '@/components/shop/states'
import { Stagger, FadeItem } from '@/components/motion/reveal'
import { filterProducts, SORTS } from '@/lib/catalog/filter'
import type { CatalogProduct, CatalogSort, Category } from '@/lib/catalog/types'
import { plural } from '@/lib/format'
import { t } from '@/lib/i18n'
import { CatalogFilters } from './catalog-filters'

type Opt = { slug: string; name: string; count: number }

export function CatalogView({ products, categories, aromas }: { products: CatalogProduct[]; categories: Category[]; aromas: Opt[] }) {
  const sp = useSearchParams()
  const category = sp.get('category') ?? undefined
  const aroma = sp.get('aroma') ?? undefined
  const q = sp.get('q')?.slice(0, 60) || undefined
  const rawSort = sp.get('sort') as CatalogSort | null
  const sort: CatalogSort = rawSort && SORTS.includes(rawSort) ? rawSort : 'new'

  const list = useMemo(() => filterProducts(products, { category, aroma, q, sort }), [products, category, aroma, q, sort])
  const current = categories.find((c) => c.slug === category)
  const currentAroma = aromas.find((a) => a.slug === aroma)

  return (
    <>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <h1 className="display text-[13vw] leading-[0.85] md:text-8xl">
          {current?.name ?? t.catalog.title}
          {currentAroma ? <span className="accent-serif mt-2 block text-[0.4em] text-terracotta">{currentAroma.name}</span> : null}
        </h1>
        <p className="text-sm text-muted-foreground">
          {list.length} {plural(list.length, t.catalog.count as [string, string, string])}
        </p>
      </div>

      <CatalogFilters categories={categories} aromas={aromas} active={{ category, aroma, sort, q }} />

      {list.length === 0 ? (
        <EmptyState title={t.catalog.emptyTitle} text={t.catalog.emptyText} cta={{ label: t.catalog.reset, href: '/catalog' }} />
      ) : (
        <Stagger onMount key={`${category}-${aroma}-${sort}-${q}`} className="grid grid-cols-2 gap-x-3 gap-y-10 md:grid-cols-3 md:gap-x-6 lg:grid-cols-4" stagger={0.04}>
          {list.map((p, i) => (
            <FadeItem key={p.id}>
              <ProductCard p={p} priority={i < 4} />
            </FadeItem>
          ))}
        </Stagger>
      )}
    </>
  )
}
