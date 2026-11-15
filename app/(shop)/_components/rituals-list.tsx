'use client'

// Основа — 21st.dev «Hover Image List» (educalvolpz): превью следует за курсором со skew.
// Адаптировано: арочная маска, packshot на песке, счётчик товаров, мобильный вариант.
import Link from 'next/link'
import Image from 'next/image'
import { useCallback, useRef, useState, type PointerEvent } from 'react'
import { HOVER_QUERY, useMediaQuery } from '@/hooks/use-client-state'
import { AnimatePresence, motion, useMotionValue, useReducedMotion, useSpring } from 'motion/react'
import { ArrowUpRight } from 'lucide-react'
import { RevealLines } from '@/components/motion/reveal'
import { t } from '@/lib/i18n'
import type { Aroma } from '@/lib/catalog/types'

const SIZE = 260
const clamp = (v: number, a: number, b: number) => Math.min(Math.max(v, a), b)

export function RitualsList({ aromas }: { aromas: Aroma[] }) {
  const reduce = useReducedMotion()
  const hoverDevice = useMediaQuery(HOVER_QUERY)
  const [active, setActive] = useState<number | null>(null)
  const ref = useRef<HTMLDivElement>(null)
  const last = useRef<{ t: number; x: number } | null>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const skew = useMotionValue(0)
  const sx = useSpring(x, { damping: 26, stiffness: 260 })
  const sy = useSpring(y, { damping: 26, stiffness: 260 })
  const sk = useSpring(skew, { damping: 18, stiffness: 220 })

  const onMove = useCallback(
    (e: PointerEvent<HTMLDivElement>) => {
      if (!hoverDevice || reduce || !ref.current) return
      const r = ref.current.getBoundingClientRect()
      const lx = e.clientX - r.left
      const ly = e.clientY - r.top
      const now = performance.now()
      if (last.current) {
        const dt = Math.min(now - last.current.t, 50)
        if (dt > 0) skew.set(clamp(((lx - last.current.x) / dt) * 0.12 * 10, -8, 8))
      }
      last.current = { t: now, x: lx }
      x.set(lx - SIZE / 2)
      y.set(ly - SIZE * 0.62)
    },
    [hoverDevice, reduce, skew, x, y],
  )

  const item = active === null ? null : aromas[active]

  return (
    <section className="mx-auto max-w-[1440px] px-4 py-16 md:px-8 md:py-24">
      <div className="mb-10 grid gap-6 md:grid-cols-2 md:items-end">
        <RevealLines className="display text-4xl md:text-6xl" lines={[t.home.ritualsTitle]} />
        <p className="max-w-md text-muted-foreground md:justify-self-end">{t.home.ritualsText}</p>
      </div>

      <div ref={ref} className="relative" onPointerMove={onMove} onPointerLeave={() => setActive(null)}>
        <ul className="border-t border-line">
          {aromas.map((a, i) => (
            <li key={a.slug} className="border-b border-line">
              <Link
                href={`/catalog?aroma=${a.slug}`}
                onMouseEnter={() => hoverDevice && setActive(i)}
                onFocus={() => setActive(i)}
                className="group flex items-center gap-4 py-5 md:py-7"
              >
                <span className="w-8 text-xs tabular-nums text-muted-foreground md:w-14">{String(i + 1).padStart(2, '0')}</span>
                {/* мобильная миниатюра в арке */}
                {a.image ? (
                  <span className="arch relative block h-14 w-11 shrink-0 overflow-hidden bg-sand md:hidden">
                    <Image src={a.image} alt="" fill sizes="44px" className="object-contain p-1 mix-blend-multiply" />
                  </span>
                ) : null}
                <span className="display flex-1 text-[7vw] leading-none transition-[color,transform] duration-500 group-hover:translate-x-3 group-hover:text-terracotta md:text-5xl">
                  {a.name}
                </span>
                <span className="hidden text-xs uppercase tracking-[0.16em] text-muted-foreground sm:inline">
                  {a.count} {t.home.ritualsCount}
                </span>
                <ArrowUpRight className="size-5 shrink-0 text-muted-foreground transition-all duration-500 group-hover:rotate-45 group-hover:text-terracotta" strokeWidth={1.3} aria-hidden />
              </Link>
            </li>
          ))}
        </ul>

        {hoverDevice && !reduce ? (
          <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
            <motion.div
              className="arch absolute left-0 top-0 overflow-hidden bg-sand shadow-[0_30px_60px_-30px_rgba(42,24,16,.5)]"
              style={{ width: SIZE, height: SIZE * 1.25, x: sx, y: sy, skewX: sk }}
              animate={{ opacity: item ? 1 : 0, scale: item ? 1 : 0.9 }}
              transition={{ type: 'spring', bounce: 0.1, duration: 0.3 }}
            >
              <AnimatePresence initial={false}>
                {item?.image ? (
                  <motion.div key={item.slug} className="absolute inset-0" initial={{ opacity: 0, scale: 1.1 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
                    <Image src={item.image} alt="" fill sizes={`${SIZE}px`} className="object-contain p-6 mix-blend-multiply" />
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </motion.div>
          </div>
        ) : null}
      </div>
    </section>
  )
}
