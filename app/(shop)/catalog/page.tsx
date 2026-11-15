import type { Metadata } from 'next'
import { Suspense } from 'react'
import { filterProducts, getAllProducts, getAromas, getCategories } from '@/lib/catalog/queries'
import type { CatalogSort } from '@/lib/catalog/types'
import { ProductCard } from '@/components/shop/product-card'
import { EmptyState, GridSkeleton } from '@/components/shop/states'
import { Stagger, FadeItem } from '@/components/motion/reveal'
import { plural } from '@/lib/format'
import { t } from '@/lib/i18n'
import { CatalogFilters } from './_components/catalog-filters'

export const metadata: Metadata = {
  title: t.catalog.title,
  description: 'Вся косметика La Sultane de Saba: уход за телом, лицом и руками, парфюмерия и ароматы для дома.',
}

const SORTS: CatalogSort[] = ['new', 'cheap', 'expensive', 'sale']

async function CatalogContent({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams
  const str = (v: string | string[] | undefined) => (typeof v === 'string' ? v : undefined)
  const category = str(sp.category)
  const aroma = str(sp.aroma)
  const q = str(sp.q)?.slice(0, 60)
  const sort = SORTS.includes(str(sp.sort) as CatalogSort) ? (str(sp.sort) as CatalogSort) : 'new'

  const [products, categories, aromas] = await Promise.all([getAllProducts(), getCategories(), getAromas()])
  const list = filterProducts(products, { category, aroma, q, sort })
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

      <CatalogFilters
        categories={categories.map((c) => ({ slug: c.slug, name: c.name, count: c.count }))}
        aromas={aromas.map((a) => ({ slug: a.slug, name: a.name, count: a.count }))}
        active={{ category, aroma, sort, q }}
      />

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

export default function CatalogPage({ searchParams }: PageProps<'/catalog'>) {
  return (
    <div className="mx-auto max-w-[1440px] px-4 pb-10 pt-8 md:px-8 md:pt-14">
      <Suspense
        fallback={
          <div aria-busy="true">
            <div className="mb-8 h-20 w-2/3 animate-pulse bg-sand" />
            <div className="mb-8 flex gap-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-10 w-24 animate-pulse rounded-full bg-sand" />
              ))}
            </div>
            <GridSkeleton />
          </div>
        }
      >
        <CatalogContent searchParams={searchParams} />
      </Suspense>
    </div>
  )
}
