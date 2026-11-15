'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useRef } from 'react'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { formatPrice } from '@/lib/format'
import { t } from '@/lib/i18n'
import { useCart } from '@/lib/cart/store'
import type { CatalogProduct } from '@/lib/catalog/types'
import { ProductImage } from './product-image'
import { flyToCart } from './fly-to-cart'

export function ProductBadges({ p, className }: { p: CatalogProduct; className?: string }) {
  return (
    <div className={cn('pointer-events-none flex flex-wrap gap-1.5', className)}>
      {p.discount ? (
        <span className="bg-terracotta px-2 py-0.5 text-[11px] font-medium tracking-wide text-ivory">−{p.discount}%</span>
      ) : null}
      {p.isHit ? (
        <span className="bg-espresso px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-ivory">{t.common.hit}</span>
      ) : null}
      {p.isNew ? (
        <span className="border border-espresso/70 bg-ivory/80 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-espresso">
          {t.common.new}
        </span>
      ) : null}
    </div>
  )
}

export function ProductCard({ p, priority, sizes }: { p: CatalogProduct; priority?: boolean; sizes?: string }) {
  const add = useCart((s) => s.add)
  const imgRef = useRef<HTMLDivElement>(null)
  const second = p.images[1]
  const href = `/product/${p.slug}`

  const onAdd = () => {
    add({ productId: p.id, slug: p.slug, name: p.name, price: p.price, image: p.images[0] ?? null })
    flyToCart(imgRef.current, p.images[0] ?? null)
    toast(t.common.added, { description: p.name })
  }

  return (
    <article className="group relative flex flex-col">
      <div ref={imgRef} className="relative aspect-square">
        <Link href={href} aria-label={p.name} className="absolute inset-0 block">
          <ProductImage
            src={p.images[0]}
            alt={p.name}
            sizes={sizes ?? '(min-width: 1024px) 25vw, 50vw'}
            priority={priority}
            className="h-full w-full"
            imgClassName="p-[8%] transition-transform duration-700 ease-[cubic-bezier(.22,1,.36,1)] group-hover:scale-[1.06]"
          />
          {second ? (
            <Image
              src={second}
              alt=""
              fill
              sizes={sizes ?? '(min-width: 1024px) 25vw, 50vw'}
              className="object-contain p-[8%] opacity-0 mix-blend-multiply transition-opacity duration-500 [@media(hover:hover)]:group-hover:opacity-100"
            />
          ) : null}
        </Link>
        <ProductBadges p={p} className="absolute left-2 top-2 z-10" />
        {!p.inStock ? (
          <span className="absolute inset-x-0 bottom-0 z-10 bg-espresso/80 py-1.5 text-center text-xs uppercase tracking-wider text-ivory">
            {t.common.outOfStock}
          </span>
        ) : (
          <>
            {/* desktop: кнопка выезжает снизу */}
            <button
              type="button"
              onClick={onAdd}
              className="absolute inset-x-0 bottom-0 z-10 hidden translate-y-full bg-espresso py-3 text-xs font-medium uppercase tracking-[0.18em] text-ivory opacity-0 transition-all duration-500 ease-[cubic-bezier(.22,1,.36,1)] hover:bg-terracotta focus-visible:translate-y-0 focus-visible:opacity-100 [@media(hover:hover)]:block [@media(hover:hover)]:group-hover:translate-y-0 [@media(hover:hover)]:group-hover:opacity-100"
            >
              {t.common.toCart}
            </button>
            {/* mobile: круглая «+» */}
            <button
              type="button"
              onClick={onAdd}
              aria-label={`${t.common.toCart}: ${p.name}`}
              className="absolute bottom-2 right-2 z-10 grid size-10 place-items-center rounded-full bg-espresso text-ivory shadow-md active:scale-90 transition-transform [@media(hover:hover)]:hidden"
            >
              <Plus className="size-5" aria-hidden />
            </button>
          </>
        )}
      </div>
      <Link href={href} className="mt-3 flex flex-1 flex-col gap-1">
        {p.volume ? <span className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">{p.volume}</span> : null}
        <h3 className="line-clamp-2 text-[15px] leading-snug text-espresso transition-colors group-hover:text-terracotta md:text-base">
          {p.name}
        </h3>
        <p className="mt-auto flex items-baseline gap-2 pt-1">
          <span className="text-base font-medium md:text-lg">{formatPrice(p.price)}</span>
          {p.oldPrice ? <s className="text-sm text-muted-foreground">{formatPrice(p.oldPrice)}</s> : null}
        </p>
      </Link>
    </article>
  )
}

export function ProductCardSkeleton() {
  return (
    <div className="flex flex-col gap-3" aria-hidden>
      <div className="aspect-square animate-pulse bg-sand" />
      <div className="h-3 w-1/3 animate-pulse bg-sand" />
      <div className="h-4 w-4/5 animate-pulse bg-sand" />
      <div className="h-4 w-1/4 animate-pulse bg-sand" />
    </div>
  )
}
