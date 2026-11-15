'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Minus, Plus, X } from 'lucide-react'
import { toast } from 'sonner'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { cartTotal, useCart } from '@/lib/cart/store'
import { formatPrice } from '@/lib/format'
import { t } from '@/lib/i18n'
import { refreshCartAction } from '@/app/(shop)/checkout/actions'
import { ProductImage } from './product-image'

export function QtyControl({ value, onChange, size = 'sm' }: { value: number; onChange: (n: number) => void; size?: 'sm' | 'lg' }) {
  const cls = size === 'lg' ? 'h-12 w-12' : 'h-8 w-8'
  return (
    <div className="inline-flex items-center border border-line" role="group" aria-label={t.product.quantity}>
      <button type="button" className={`${cls} grid place-items-center hover:text-terracotta disabled:opacity-30`} onClick={() => onChange(value - 1)} disabled={value <= 1} aria-label={t.product.decrease}>
        <Minus className="size-3.5" aria-hidden />
      </button>
      <span className="min-w-8 text-center text-sm tabular-nums" aria-live="polite">
        {value}
      </span>
      <button type="button" className={`${cls} grid place-items-center hover:text-terracotta disabled:opacity-30`} onClick={() => onChange(value + 1)} disabled={value >= 99} aria-label={t.product.increase}>
        <Plus className="size-3.5" aria-hidden />
      </button>
    </div>
  )
}

export function CartSheet() {
  const { items, open, setOpen, setQty, remove, restore, sync } = useCart()

  // Сверяем цены и наличие при открытии
  useEffect(() => {
    if (!open || items.length === 0) return
    refreshCartAction(items.map((i) => i.productId)).then((r) => {
      if (r.ok) sync(r.data)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const total = cartTotal(items)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent side="right" className="flex w-full flex-col border-none bg-cream p-0 sm:max-w-md">
        <SheetHeader className="border-b border-line px-6 py-5">
          <SheetTitle className="display text-2xl">{t.cart.title}</SheetTitle>
          <SheetDescription className="sr-only">{t.cart.title}</SheetDescription>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
            <div className="arch grid h-40 w-28 place-items-center bg-sand">
              <span className="accent-serif text-5xl text-terracotta">L</span>
            </div>
            <p className="display text-2xl">{t.cart.emptyTitle}</p>
            <p className="text-sm text-muted-foreground">{t.cart.emptyText}</p>
            <Button asChild className="mt-2 rounded-full px-8" onClick={() => setOpen(false)}>
              <Link href="/catalog?sort=new#hits">{t.cart.emptyCta}</Link>
            </Button>
          </div>
        ) : (
          <>
            <ul className="flex-1 overflow-y-auto px-6">
              <AnimatePresence initial={false}>
                {items.map((i) => (
                  <motion.li
                    key={i.productId}
                    layout
                    initial={{ opacity: 0, x: 24 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 40, height: 0, paddingTop: 0, paddingBottom: 0 }}
                    className="flex gap-4 border-b border-line py-5"
                  >
                    <Link href={`/product/${i.slug}`} onClick={() => setOpen(false)} className="shrink-0">
                      <ProductImage src={i.image} alt={i.name} sizes="80px" className="size-20" imgClassName="p-1.5" />
                    </Link>
                    <div className="flex min-w-0 flex-1 flex-col gap-2">
                      <div className="flex items-start justify-between gap-2">
                        <Link href={`/product/${i.slug}`} onClick={() => setOpen(false)} className="line-clamp-2 text-sm leading-snug hover:text-terracotta">
                          {i.name}
                        </Link>
                        <button
                          type="button"
                          aria-label={`${t.cart.remove}: ${i.name}`}
                          className="text-muted-foreground hover:text-terracotta"
                          onClick={() => {
                            const removed = remove(i.productId)
                            if (removed) toast(t.cart.removed, { action: { label: t.cart.undo, onClick: () => restore(removed) } })
                          }}
                        >
                          <X className="size-4" aria-hidden />
                        </button>
                      </div>
                      {i.unavailable ? (
                        <p className="text-xs text-destructive">{t.cart.unavailable}</p>
                      ) : (
                        <div className="mt-auto flex items-center justify-between">
                          <QtyControl value={i.qty} onChange={(n) => setQty(i.productId, n)} />
                          <div className="text-right">
                            <p className="text-sm font-medium">{formatPrice(i.price * i.qty)}</p>
                            {i.priceChanged ? <p className="text-[11px] text-terracotta">{t.cart.priceChanged}</p> : null}
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
            <div className="border-t border-line bg-ivory px-6 py-5">
              <div className="mb-4 flex items-baseline justify-between">
                <span className="text-xs uppercase tracking-[0.2em]">{t.cart.total}</span>
                <motion.span key={total} initial={{ opacity: 0.4, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-2xl font-light">
                  {formatPrice(total)}
                </motion.span>
              </div>
              <Button asChild size="lg" className="h-14 w-full rounded-full text-xs uppercase tracking-[0.2em]" onClick={() => setOpen(false)}>
                <Link href="/checkout">{t.cart.checkout}</Link>
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
