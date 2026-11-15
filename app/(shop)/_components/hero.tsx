'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { AnimatePresence, motion, useScroll, useTransform } from 'motion/react'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { RevealLines } from '@/components/motion/reveal'
import { Magnetic } from '@/components/motion/magnetic'
import { ProductImage } from '@/components/shop/product-image'
import { t } from '@/lib/i18n'

export type HeroSlide = { title: string; aroma: string; aromaSlug: string; image: string | null; alt: string }

/** Hero: огромный тонкий заголовок + арка с packshot'ом, слайдер линеек ароматов. */
export function Hero({ slides }: { slides: HeroSlide[] }) {
  const [i, setI] = useState(0)
  const { scrollY } = useScroll()
  const y = useTransform(scrollY, [0, 600], [0, -60])
  const rotate = useTransform(scrollY, [0, 600], [0, -4])
  const slide = slides[i]

  useEffect(() => {
    if (slides.length < 2) return
    const id = setInterval(() => setI((v) => (v + 1) % slides.length), 6500)
    return () => clearInterval(id)
  }, [slides.length, i])

  const go = (d: number) => setI((v) => (v + d + slides.length) % slides.length)

  return (
    <section className="relative mx-auto grid max-w-[1440px] gap-8 px-4 pb-14 pt-6 md:grid-cols-[1.1fr_1fr] md:items-center md:px-8 md:pb-20 md:pt-10">
      <div className="relative z-10">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-5 text-xs uppercase tracking-[0.3em] text-terracotta"
        >
          La Sultane de Saba · Paris
        </motion.p>
        <RevealLines
          as="h1"
          immediate
          className="display text-[15vw] text-espresso md:text-[7.4vw] xl:text-[110px]"
          lines={[
            t.home.heroLines[0],
            <span key="2" className="md:pl-[12%]">{t.home.heroLines[1]}</span>,
            <span key="3">
              {t.home.heroLines[2]} <span className="accent-serif text-[0.55em] text-terracotta">{t.home.heroAccent}</span>
            </span>,
          ]}
        />
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mt-6 max-w-md text-[15px] leading-relaxed text-muted-foreground md:text-base"
        >
          {t.home.heroText}
        </motion.p>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }} className="mt-8 flex items-center gap-6">
          <Magnetic>
            <Link
              href="/catalog"
              className="group relative grid size-32 place-items-center rounded-full border border-espresso text-xs uppercase tracking-[0.2em] transition-colors duration-500 hover:border-terracotta hover:bg-terracotta hover:text-ivory md:size-36"
            >
              <span className="flex flex-col items-center gap-2">
                {t.home.heroCta}
                <ArrowRight className="size-5 transition-transform duration-500 group-hover:translate-x-1.5" strokeWidth={1.2} aria-hidden />
              </span>
            </Link>
          </Magnetic>
          {slide ? (
            <Link href={`/catalog?aroma=${slide.aromaSlug}`} className="group max-w-[14rem]">
              <AnimatePresence mode="wait">
                <motion.span key={slide.title} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="block">
                  <span className="accent-serif block text-2xl group-hover:text-terracotta">{slide.title}</span>
                  <span className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{slide.aroma}</span>
                </motion.span>
              </AnimatePresence>
            </Link>
          ) : null}
        </motion.div>
      </div>

      <div className="relative">
        <motion.div
          initial={{ clipPath: 'inset(100% 0 0 0)' }}
          animate={{ clipPath: 'inset(0% 0 0 0)' }}
          transition={{ duration: 1.3, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
          style={{ y }}
          className="arch relative mx-auto aspect-[4/5] w-[72%] overflow-hidden bg-sand md:w-[82%]"
        >
          <AnimatePresence mode="popLayout">
            {slide ? (
              <motion.div
                key={slide.image ?? i}
                initial={{ opacity: 0, scale: 1.08 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                className="absolute inset-0"
              >
                <ProductImage src={slide.image} alt={slide.alt} priority sizes="(min-width: 768px) 40vw, 80vw" className="h-full w-full bg-transparent" imgClassName="p-[12%]" />
              </motion.div>
            ) : null}
          </AnimatePresence>
        </motion.div>
        {/* декоративная тонкая арка-контур */}
        <motion.div style={{ rotate }} className="arch pointer-events-none absolute left-1/2 top-[-4%] aspect-[4/5] w-[92%] -translate-x-1/2 border border-terracotta/40" aria-hidden />
        {slides.length > 1 ? (
          <div className="absolute bottom-2 right-0 flex items-center gap-3 text-sm md:bottom-6">
            <span className="tabular-nums">
              {String(i + 1).padStart(2, '0')}
              <span className="text-muted-foreground">/{String(slides.length).padStart(2, '0')}</span>
            </span>
            <button type="button" onClick={() => go(-1)} className="grid size-9 place-items-center rounded-full border border-line hover:border-terracotta hover:text-terracotta" aria-label="Предыдущий слайд">
              <ArrowLeft className="size-4" aria-hidden />
            </button>
            <button type="button" onClick={() => go(1)} className="grid size-9 place-items-center rounded-full border border-line hover:border-terracotta hover:text-terracotta" aria-label="Следующий слайд">
              <ArrowRight className="size-4" aria-hidden />
            </button>
          </div>
        ) : null}
      </div>
    </section>
  )
}
