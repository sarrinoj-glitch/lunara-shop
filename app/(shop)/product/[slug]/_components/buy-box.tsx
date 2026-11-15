'use client'

import { useRef, useState } from 'react'
import { motion, useInView } from 'motion/react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { QtyControl } from '@/components/shop/cart-sheet'
import { flyToCart } from '@/components/shop/fly-to-cart'
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

  return (
    <>
      <div ref={ref} className="mt-8 flex gap-3">
        <QtyControl value={qty} onChange={setQty} size="lg" />
        <Button size="lg" disabled={!inStock} onClick={onAdd} className="h-12 flex-1 rounded-full text-xs uppercase tracking-[0.2em]">
          {inStock ? t.common.toCart : t.common.outOfStock}
        </Button>
      </div>

      {/* mobile: sticky-панель, когда основная кнопка ушла из вида */}
      <motion.div
        initial={false}
        animate={{ y: inView ? '110%' : '0%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 32 }}
        className="fixed inset-x-0 bottom-0 z-30 flex items-center gap-3 border-t border-line bg-ivory/95 px-4 py-3 backdrop-blur md:hidden"
        aria-hidden={inView}
      >
        <span className="flex-1 text-lg">{formatPrice(product.price * qty)}</span>
        <Button disabled={!inStock} onClick={onAdd} tabIndex={inView ? -1 : 0} className="h-12 flex-[1.4] rounded-full text-xs uppercase tracking-[0.2em]">
          {inStock ? t.common.toCart : t.common.outOfStock}
        </Button>
      </motion.div>
    </>
  )
}
