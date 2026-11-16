'use client'

import { useRef, useState } from 'react'
import { motion, useInView } from 'motion/react'
import { toast } from 'sonner'
import { QtyControl } from '@/components/shop/cart-sheet'
import { flyToCart } from '@/components/shop/fly-to-cart'
import { AddToCartButton } from '@/components/shop/add-to-cart-button'
import { RollingText } from '@/components/motion/rolling-number'
import { useCart, type CartItem } from '@/lib/cart/store'
import { formatPrice } from '@/lib/format'
import { t } from '@/lib/i18n'

export function BuyBox({ product, inStock }: { product: Omit<CartItem, 'qty'>; inStock: boolean }) {
  const [qty, setQty] = useState(1)
  const add = useCart((s) => s.add)
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { margin: '0px 0px -80px 0px' })

  const onAdd = () => {
    add(product, qty)
    flyToCart(document.querySelector('[data-slot="carousel-content"]') as HTMLElement | null, product.image)
    toast(t.common.added, { description: `${product.name} × ${qty}` })
  }

  const total = formatPrice(product.price * qty)

  return (
    <>
      <div ref={ref} className="mt-8">
        <div className="mb-3 flex items-baseline justify-between text-sm text-muted-foreground">
          <span>
            {t.cart.total} · {qty} шт.
          </span>
          <RollingText value={total} className="text-lg text-espresso" />
        </div>
        <div className="flex gap-3">
          <QtyControl value={qty} onChange={setQty} size="lg" />
          <AddToCartButton disabled={!inStock} onAdd={onAdd} className="h-12 flex-1" />
        </div>
      </div>

      {/* mobile: sticky-панель, когда основная кнопка ушла из вида */}
      <motion.div
        initial={false}
        animate={{ y: inView ? '110%' : '0%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 32 }}
        className="fixed inset-x-0 bottom-0 z-30 flex items-center gap-3 border-t border-line bg-ivory/95 px-4 py-3 backdrop-blur md:hidden"
        aria-hidden={inView}
      >
        <RollingText value={total} className="flex-1 text-lg" />
        <AddToCartButton disabled={!inStock} onAdd={onAdd} className="h-12 flex-[1.4]" />
      </motion.div>
    </>
  )
}
