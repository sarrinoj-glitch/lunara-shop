'use client'

import Link from 'next/link'
import { useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowRight } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from '@/components/ui/drawer'
import { HOVER_QUERY, useMediaQuery } from '@/hooks/use-client-state'
import { useUI } from '@/lib/ui/store'
import { formatPrice } from '@/lib/format'
import { t } from '@/lib/i18n'
import type { CatalogProduct } from '@/lib/catalog/types'
import { ProductImage } from './product-image'
import { ProductBadges, useAddToCart } from './product-card'
import { AddToCartButton } from './add-to-cart-button'
import { QtyControl } from './cart-sheet'
import { RollingText } from '@/components/motion/rolling-number'

function QuickViewBody({ p }: { p: CatalogProduct }) {
  const [img, setImg] = useState(0)
  const [qty, setQty] = useState(1)
  const imgRef = useRef<HTMLDivElement>(null)
  const addToCart = useAddToCart(p)
  const close = useUI((s) => s.closeQuickView)

  return (
    <div className="grid gap-6 md:grid-cols-2 md:gap-8">
      <div>
        <div ref={imgRef} className="relative">
          <ProductBadges p={p} className="absolute left-3 top-3 z-10" />
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={img} initial={{ opacity: 0, scale: 1.04 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.35 }}>
              <ProductImage src={p.images[img]} alt={p.name} sizes="(min-width: 768px) 420px, 90vw" className="aspect-square w-full" imgClassName="p-[10%]" />
            </motion.div>
          </AnimatePresence>
        </div>
        {p.images.length > 1 ? (
          <div className="mt-3 flex gap-2">
            {p.images.map((src, i) => (
              <button
                key={src}
                type="button"
                onClick={() => setImg(i)}
                aria-label={`Фото ${i + 1}`}
                className={`size-14 border transition-colors ${img === i ? 'border-terracotta' : 'border-transparent hover:border-line'}`}
              >
                <ProductImage src={src} alt="" sizes="56px" className="size-full" imgClassName="p-1" />
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div className="flex flex-col">
        <p className="text-xs uppercase tracking-[0.3em] text-terracotta">{p.brand}</p>
        <h2 className="accent-serif mt-2 text-3xl not-italic leading-tight">{p.name}</h2>
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          {p.aroma ? <span className="rounded-full border border-line px-3 py-1">{p.aroma}</span> : null}
          {p.volume ? <span className="rounded-full border border-line px-3 py-1">{p.volume}</span> : null}
        </div>
        <p className="mt-5 flex items-baseline gap-3">
          <RollingText value={formatPrice(p.price * qty)} className="text-2xl font-light" />
          {p.oldPrice ? <s className="text-muted-foreground">{formatPrice(p.oldPrice * qty)}</s> : null}
        </p>
        {p.description ? <p className="mt-4 line-clamp-5 text-sm leading-relaxed text-espresso/80">{p.description}</p> : null}
        <div className="mt-auto flex gap-3 pt-6">
          <QtyControl value={qty} onChange={setQty} size="lg" />
          <AddToCartButton disabled={!p.inStock} onAdd={() => addToCart(imgRef.current, qty)} className="h-12 flex-1" />
        </div>
        <Link
          href={`/product/${p.slug}`}
          onClick={close}
          className="group mt-4 inline-flex items-center gap-2 self-start text-xs uppercase tracking-[0.18em] hover:text-terracotta"
        >
          {t.common.details}
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden />
        </Link>
      </div>
    </div>
  )
}

/** Быстрый просмотр: окно на десктопе, свайп-панель снизу на телефоне. Монтируется один раз в layout. */
export function QuickView() {
  const p = useUI((s) => s.quickView)
  const close = useUI((s) => s.closeQuickView)
  const desktop = useMediaQuery(HOVER_QUERY)
  const open = Boolean(p)

  if (desktop) {
    return (
      <Dialog open={open} onOpenChange={(o) => !o && close()}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto rounded-none border-none bg-cream p-6 ring-0 sm:max-w-4xl md:p-10">
          <DialogTitle className="sr-only">{p?.name ?? t.common.quickView}</DialogTitle>
          <DialogDescription className="sr-only">{t.common.quickView}</DialogDescription>
          {p ? <QuickViewBody key={p.id} p={p} /> : null}
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Drawer open={open} onOpenChange={(o) => !o && close()}>
      <DrawerContent className="max-h-[92dvh] border-none bg-cream">
        <DrawerTitle className="sr-only">{p?.name ?? t.common.quickView}</DrawerTitle>
        <DrawerDescription className="sr-only">{t.common.quickView}</DrawerDescription>
        <div className="overflow-y-auto px-5 pb-8 pt-2">{p ? <QuickViewBody key={p.id} p={p} /> : null}</div>
      </DrawerContent>
    </Drawer>
  )
}
