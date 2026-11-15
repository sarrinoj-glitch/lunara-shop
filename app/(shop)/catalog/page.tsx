import type { Metadata } from 'next'
import { Suspense } from 'react'
import { getAllProducts, getAromas, getCategories } from '@/lib/catalog/queries'
import { GridSkeleton } from '@/components/shop/states'
import { t } from '@/lib/i18n'
import { CatalogView } from './_components/catalog-view'

export const metadata: Metadata = {
  title: t.catalog.title,
  description: 'Вся косметика La Sultane de Saba: уход за телом, лицом и руками, парфюмерия и ароматы для дома.',
}

function CatalogFallback() {
  return (
    <div aria-busy="true">
      <div className="mb-8 h-20 w-2/3 animate-pulse bg-sand" />
      <div className="mb-8 flex gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-10 w-24 animate-pulse rounded-full bg-sand" />
        ))}
      </div>
      <GridSkeleton />
    </div>
  )
}

/**
 * Данные каталога — статичны и кэшируются; фильтры (?category, ?aroma, ?sort, ?q)
 * применяются в браузере. Так страница работает и на сервере, и на GitHub Pages.
 */
export default async function CatalogPage() {
  const [products, categories, aromas] = await Promise.all([getAllProducts(), getCategories(), getAromas()])
  return (
    <div className="mx-auto max-w-[1440px] px-4 pb-10 pt-8 md:px-8 md:pt-14">
      <Suspense fallback={<CatalogFallback />}>
        <CatalogView products={products} categories={categories} aromas={aromas.map(({ slug, name, count }) => ({ slug, name, count }))} />
      </Suspense>
    </div>
  )
}
