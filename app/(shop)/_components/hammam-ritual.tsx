'use client'

import Link from 'next/link'
import { useRef } from 'react'
import { ArrowUpRight } from 'lucide-react'
import StackingCards, { StackingCardItem } from '@/components/motion/stacking-cards'
import { RevealLines } from '@/components/motion/reveal'
import { ProductImage } from '@/components/shop/product-image'
import { AddToCartButton } from '@/components/shop/add-to-cart-button'
import { useAddToCart } from '@/components/shop/product-card'
import { formatPrice } from '@/lib/format'
import { t } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import type { CatalogProduct } from '@/lib/catalog/types'

const TONES = ['bg-terracotta text-ivory', 'bg-brown text-ivory', 'bg-clay text-espresso', 'bg-espresso text-ivory']

function StepCard({ index, step, text, p }: { index: number; step: string; text: string; p: CatalogProduct }) {
  const imgRef = useRef<HTMLDivElement>(null)
  const addToCart = useAddToCart(p)
  return (
    <div className={cn('grain mx-auto flex h-[78%] w-[94%] max-w-6xl flex-col gap-6 overflow-hidden p-6 shadow-[0_30px_80px_-40px_rgba(42,24,16,.6)] md:h-[72%] md:flex-row md:items-center md:gap-12 md:p-12', TONES[index % TONES.length])}>
      <div className="relative z-[2] flex flex-1 flex-col">
        <span className="display text-[64px] leading-none opacity-40 md:text-[120px]">{String(index + 1).padStart(2, '0')}</span>
        <h3 className="display mt-2 text-3xl md:text-5xl">{step}</h3>
        <p className="mt-4 max-w-md text-sm leading-relaxed opacity-85 md:text-base">{text}</p>
        <Link href={`/product/${p.slug}`} className="group mt-5 inline-flex items-center gap-2 text-sm underline-offset-4 hover:underline md:mt-8">
          <span className="accent-serif text-lg">{p.name}</span>
          <ArrowUpRight className="size-4 transition-transform group-hover:rotate-45" aria-hidden />
        </Link>
        <div className="mt-4 flex items-center gap-4">
          <span className="text-xl font-light">{formatPrice(p.price)}</span>
          <AddToCartButton onAdd={() => addToCart(imgRef.current)} disabled={!p.inStock} className="h-10 bg-ivory! px-6 text-espresso! hover:bg-cream!" />
        </div>
      </div>
      <div ref={imgRef} className="relative z-[2] mx-auto h-40 w-32 shrink-0 md:h-[78%] md:w-auto md:aspect-[4/5]">
        <ProductImage src={p.images[0]} alt={p.name} sizes="(min-width: 768px) 30vw, 128px" className="arch h-full w-full bg-ivory" imgClassName="p-[12%]" />
      </div>
    </div>
  )
}

/** Новый блок v2: «Ритуал хаммама в 4 шага» — карточки ложатся стопкой при прокрутке. */
export function HammamRitual({ steps }: { steps: { step: string; text: string; product: CatalogProduct }[] }) {
  if (steps.length === 0) return null
  return (
    <section className="relative py-16 md:py-24">
      <div className="mx-auto mb-6 grid max-w-[1440px] gap-6 px-4 md:grid-cols-2 md:items-end md:px-8">
        <RevealLines className="display text-4xl md:text-6xl" lines={[t.home.hammamTitle[0], <span key="2" className="accent-serif text-terracotta">{t.home.hammamTitle[1]}</span>]} />
        <p className="max-w-md text-muted-foreground md:justify-self-end">{t.home.hammamText}</p>
      </div>
      <StackingCards totalCards={steps.length} scaleMultiplier={0.04}>
        {steps.map((s, i) => (
          <StackingCardItem key={s.step} index={i} className="h-[100svh]" topPosition={`${8 + i * 2.5}%`}>
            <StepCard index={i} step={s.step} text={s.text} p={s.product} />
          </StackingCardItem>
        ))}
      </StackingCards>
    </section>
  )
}
