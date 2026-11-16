'use client'

import Link from 'next/link'
import { useRef } from 'react'
import { motion, useScroll, useSpring, useTransform } from 'motion/react'
import { ArrowUpRight } from 'lucide-react'
import { RevealLines } from '@/components/motion/reveal'
import { ProductImage } from '@/components/shop/product-image'
import { HOVER_QUERY, useMediaQuery } from '@/hooks/use-client-state'
import { t } from '@/lib/i18n'
import { cn } from '@/lib/utils'

export type JourneyItem = { slug: string; name: string; count: number; image: string | null; note: string }

const BG = ['bg-sand', 'bg-clay/40', 'bg-ivory', 'bg-sand', 'bg-clay/30', 'bg-ivory']

function Card({ a, i }: { a: JourneyItem; i: number }) {
  return (
    <Link href={`/catalog?aroma=${a.slug}`} data-cursor={t.common.look} className="group flex w-[78vw] shrink-0 snap-start flex-col sm:w-[46vw] md:w-[30vw] lg:w-[26vw]">
      <div className={cn('arch relative aspect-[3/4] overflow-hidden', BG[i % BG.length])}>
        <ProductImage
          src={a.image}
          alt={a.name}
          sizes="(min-width: 768px) 30vw, 78vw"
          className="h-full w-full bg-transparent"
          imgClassName="p-[16%] transition-transform duration-[1.2s] ease-[cubic-bezier(.22,1,.36,1)] group-hover:scale-110 group-hover:-rotate-2"
        />
        <span className="absolute left-1/2 top-6 -translate-x-1/2 text-xs tabular-nums text-muted-foreground">{String(i + 1).padStart(2, '0')}</span>
      </div>
      <div className="mt-5 flex items-start justify-between gap-3">
        <h3 className="accent-serif text-2xl leading-tight transition-colors group-hover:text-terracotta md:text-3xl">{a.name}</h3>
        <ArrowUpRight className="mt-1 size-5 shrink-0 text-muted-foreground transition-all duration-500 group-hover:rotate-45 group-hover:text-terracotta" aria-hidden />
      </div>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{a.note}</p>
      <p className="mt-2 text-xs uppercase tracking-[0.16em]">
        {a.count} {t.home.ritualsCount}
      </p>
    </Link>
  )
}

/**
 * «Путешествие по ароматам»: на десктопе секция закрепляется, вертикальная прокрутка
 * двигает ленту арок вбок; на телефоне — обычная горизонтальная лента со snap.
 */
export function AromaJourney({ items }: { items: JourneyItem[] }) {
  const desktop = useMediaQuery(HOVER_QUERY)
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] })
  const smooth = useSpring(scrollYProgress, { stiffness: 120, damping: 30, restDelta: 0.001 })
  const sx = useTransform(smooth, [0, 1], ['0vw', `-${Math.max(0, items.length - 3) * 30}vw`])
  const bar = useTransform(smooth, [0, 1], ['0%', '100%'])

  const header = (
    <div className="mb-10 flex items-end justify-between gap-4 px-4 md:px-8">
      <RevealLines className="display text-4xl md:text-6xl" lines={[t.home.journeyTitle[0], <span key="2" className="accent-serif text-terracotta">{t.home.journeyTitle[1]}</span>]} />
      <span className="hidden text-xs uppercase tracking-[0.2em] text-muted-foreground md:inline">{t.home.journeyHint}</span>
    </div>
  )

  if (!desktop) {
    return (
      <section className="py-16">
        {header}
        <div className="no-scrollbar flex snap-x snap-mandatory gap-5 overflow-x-auto px-4 pb-4">
          {items.map((a, i) => (
            <Card key={a.slug} a={a} i={i} />
          ))}
        </div>
      </section>
    )
  }

  return (
    <section ref={ref} className="relative" style={{ height: `${100 + items.length * 32}vh` }}>
      <div className="sticky top-0 flex h-screen flex-col justify-center overflow-hidden pt-16">
        {header}
        <motion.div style={{ x: sx }} className="flex gap-10 pl-8 pr-[20vw]">
          {items.map((a, i) => (
            <Card key={a.slug} a={a} i={i} />
          ))}
        </motion.div>
        <div className="mx-8 mt-10 h-px bg-line">
          <motion.div className="h-px bg-terracotta" style={{ width: bar }} />
        </div>
      </div>
    </section>
  )
}
