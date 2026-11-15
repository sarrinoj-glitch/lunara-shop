'use client'

import Link from 'next/link'
import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ProductCard } from '@/components/shop/product-card'
import { RevealLines } from '@/components/motion/reveal'
import { t } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import type { CatalogProduct } from '@/lib/catalog/types'

type TabKey = 'new' | 'hit' | 'sale'

/** Вкладки «Новинки · Хиты · Скидки» (cosmetos) со скользящим подчёркиванием. */
export function ProductTabs({ groups }: { groups: Record<TabKey, CatalogProduct[]> }) {
  const [tab, setTab] = useState<TabKey>('hit')
  const list = groups[tab]

  return (
    <section id="hits" className="mx-auto max-w-[1440px] px-4 py-16 md:px-8 md:py-24">
      <div className="mb-8 flex flex-col gap-6 md:mb-12 md:flex-row md:items-end md:justify-between">
        <RevealLines className="display text-4xl md:text-6xl" lines={[t.home.tabsTitle]} />
        <div role="tablist" aria-label={t.home.tabsTitle} className="flex gap-6 md:gap-10">
          {(Object.keys(t.home.tabs) as TabKey[]).map((key) => (
            <button
              key={key}
              role="tab"
              type="button"
              aria-selected={tab === key}
              aria-controls={`tab-${key}`}
              onClick={() => setTab(key)}
              className={cn('relative pb-2 text-sm uppercase tracking-[0.2em] transition-colors', tab === key ? 'text-espresso' : 'text-muted-foreground hover:text-espresso')}
            >
              {t.home.tabs[key]}
              <sup className="ml-1 text-[10px]">{groups[key].length}</sup>
              {tab === key ? <motion.span layoutId="tab-underline" className="absolute inset-x-0 -bottom-px h-px bg-terracotta" /> : null}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          id={`tab-${tab}`}
          role="tabpanel"
          initial="hidden"
          animate="show"
          exit={{ opacity: 0, y: -10, transition: { duration: 0.2 } }}
          variants={{ show: { transition: { staggerChildren: 0.06 } } }}
          className="grid grid-cols-2 gap-x-3 gap-y-10 md:grid-cols-3 md:gap-x-6 lg:grid-cols-4"
        >
          {list.length === 0 ? (
            <p className="col-span-full py-10 text-center text-muted-foreground">{t.home.tabsEmpty}</p>
          ) : (
            list.slice(0, 8).map((p) => (
              <motion.div key={p.id} variants={{ hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0 } }}>
                <ProductCard p={p} />
              </motion.div>
            ))
          )}
        </motion.div>
      </AnimatePresence>

      <div className="mt-12 flex justify-center">
        <Link
          href={tab === 'sale' ? '/catalog?sort=sale' : '/catalog'}
          className="rounded-full border border-espresso px-10 py-4 text-xs uppercase tracking-[0.2em] transition-colors duration-500 hover:border-terracotta hover:bg-terracotta hover:text-ivory"
        >
          {t.common.allProducts}
        </Link>
      </div>
    </section>
  )
}
