'use client'

import { useEffect, useState, ViewTransition, type ReactNode } from 'react'
import { AnimatePresence, motion, useMotionValue, useSpring } from 'motion/react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from '@/components/ui/carousel'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { ProductImage } from '@/components/shop/product-image'
import { productVT } from '@/components/shop/product-card'
import { HOVER_QUERY, useMediaQuery } from '@/hooks/use-client-state'
import { t } from '@/lib/i18n'
import { cn } from '@/lib/utils'

const LENS = 190
const ZOOM = 2.4
/** Внутренний отступ фото в галерее (p-[10%]) — линза должна его учитывать */
const PAD = 0.1

/** Лупа: круглая линза следует за курсором и показывает фото крупнее. Только мышь. */
function ZoomLens({ src, children, onOpen }: { src: string | null; children: ReactNode; onOpen: () => void }) {
  const canHover = useMediaQuery(HOVER_QUERY)
  const [on, setOn] = useState(false)
  const [box, setBox] = useState({ w: 1, h: 1 })
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const x = useSpring(mx, { stiffness: 500, damping: 40 })
  const y = useSpring(my, { stiffness: 500, damping: 40 })
  const bgX = useMotionValue('0px')
  const bgY = useMotionValue('0px')

  return (
    <div
      className="relative"
      onPointerEnter={(e) => {
        if (!canHover) return
        const r = e.currentTarget.getBoundingClientRect()
        setBox({ w: r.width, h: r.height })
        setOn(true)
      }}
      onPointerLeave={() => setOn(false)}
      onPointerMove={(e) => {
        if (!canHover) return
        const r = e.currentTarget.getBoundingClientRect()
        const lx = e.clientX - r.left
        const ly = e.clientY - r.top
        mx.set(lx - LENS / 2)
        my.set(ly - LENS / 2)
        bgX.set(`${-((lx - r.width * PAD) * ZOOM - LENS / 2)}px`)
        bgY.set(`${-((ly - r.height * PAD) * ZOOM - LENS / 2)}px`)
      }}
    >
      <button type="button" onClick={onOpen} className={cn('block w-full', canHover && 'cursor-zoom-in')} aria-label={t.common.zoom}>
        {children}
      </button>
      <AnimatePresence>
        {on && src ? (
          <motion.div
            aria-hidden
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.6 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="pointer-events-none absolute left-0 top-0 z-20 overflow-hidden rounded-full border-2 border-ivory shadow-[0_20px_50px_-20px_rgba(42,24,16,.6)]"
            style={{
              x,
              y,
              width: LENS,
              height: LENS,
              backgroundImage: `url("${src}")`,
              backgroundRepeat: 'no-repeat',
              backgroundSize: `${box.w * (1 - 2 * PAD) * ZOOM}px ${box.h * (1 - 2 * PAD) * ZOOM}px`,
              backgroundPositionX: bgX,
              backgroundPositionY: bgY,
              backgroundColor: 'var(--sand)',
              backgroundBlendMode: 'multiply',
            }}
          />
        ) : null}
      </AnimatePresence>
    </div>
  )
}

/** Полноэкранное фото: свайп/перетаскивание между кадрами, стрелки, Esc. */
function Lightbox({ images, name, index, onIndex, open, onOpenChange }: { images: string[]; name: string; index: number; onIndex: (i: number) => void; open: boolean; onOpenChange: (o: boolean) => void }) {
  const go = (d: number) => onIndex((index + d + images.length) % images.length)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') go(1)
      if (e.key === 'ArrowLeft') go(-1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="h-[100dvh] max-w-none! w-screen rounded-none border-none bg-cream/97 p-0 ring-0 sm:max-w-none">
        <DialogTitle className="sr-only">{name}</DialogTitle>
        <DialogDescription className="sr-only">{t.product.zoomHint}</DialogDescription>
        <div className="relative flex h-full items-center justify-center overflow-hidden">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
              key={index}
              drag={images.length > 1 ? 'x' : false}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.6}
              onDragEnd={(_, info) => {
                if (info.offset.x < -80) go(1)
                else if (info.offset.x > 80) go(-1)
              }}
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              transition={{ type: 'spring', stiffness: 260, damping: 28 }}
              className="aspect-square w-[min(92vw,86dvh)] cursor-grab active:cursor-grabbing"
            >
              <ProductImage src={images[index]} alt={`${name}, фото ${index + 1}`} sizes="92vw" className="pointer-events-none size-full bg-transparent" imgClassName="p-[4%]" />
            </motion.div>
          </AnimatePresence>
          <button type="button" onClick={() => onOpenChange(false)} aria-label={t.common.closeZoom} className="absolute right-4 top-4 grid size-12 place-items-center rounded-full border border-line bg-ivory hover:border-terracotta hover:text-terracotta">
            <X className="size-5" aria-hidden />
          </button>
          {images.length > 1 ? (
            <>
              <button type="button" onClick={() => go(-1)} aria-label={t.common.prevPhoto} className="absolute left-4 top-1/2 hidden size-12 -translate-y-1/2 place-items-center rounded-full border border-line bg-ivory hover:border-terracotta md:grid">
                <ChevronLeft className="size-5" aria-hidden />
              </button>
              <button type="button" onClick={() => go(1)} aria-label={t.common.nextPhoto} className="absolute right-4 top-1/2 hidden size-12 -translate-y-1/2 place-items-center rounded-full border border-line bg-ivory hover:border-terracotta md:grid">
                <ChevronRight className="size-5" aria-hidden />
              </button>
              <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 gap-2">
                {images.map((_, i) => (
                  <span key={i} className={cn('h-1.5 rounded-full transition-all', i === index ? 'w-8 bg-terracotta' : 'w-1.5 bg-espresso/30')} />
                ))}
              </div>
            </>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  )
}

/** Галерея товара: свайп (Embla), миниатюры, лупа, полноэкранный режим; первое фото «прилетает» из карточки (ViewTransition). */
export function ProductGallery({ images, name, slug, badges }: { images: string[]; name: string; slug: string; badges?: ReactNode }) {
  const [api, setApi] = useState<CarouselApi>()
  const [current, setCurrent] = useState(0)
  const [lightbox, setLightbox] = useState(false)

  useEffect(() => {
    if (!api) return
    const on = () => setCurrent(api.selectedScrollSnap())
    on()
    api.on('select', on)
    return () => {
      api.off('select', on)
    }
  }, [api])

  const list = images.length ? images : [null]

  return (
    <div className="flex flex-col-reverse gap-3 md:flex-row">
      {list.length > 1 ? (
        <div className="hidden flex-col gap-3 md:flex">
          {list.map((src, i) => (
            <button
              key={i}
              type="button"
              onClick={() => api?.scrollTo(i)}
              aria-label={`Фото ${i + 1}`}
              className={cn('size-20 border transition-colors', current === i ? 'border-terracotta' : 'border-transparent hover:border-line')}
            >
              <ProductImage src={src} alt="" sizes="80px" className="size-full" imgClassName="p-1.5" />
            </button>
          ))}
        </div>
      ) : null}
      <div className="relative flex-1">
        {badges}
        <Carousel setApi={setApi} opts={{ loop: list.length > 1 }} className="w-full">
          <CarouselContent className="ml-0">
            {list.map((src, i) => {
              const img = (
                <ProductImage src={src} alt={i === 0 ? name : `${name}, фото ${i + 1}`} priority={i === 0} sizes="(min-width: 768px) 50vw, 100vw" className="aspect-square w-full" imgClassName="p-[10%]" />
              )
              return (
                <CarouselItem key={i} className="pl-0">
                  <ZoomLens src={src} onOpen={() => setLightbox(true)}>
                    {i === 0 ? <ViewTransition name={productVT(slug)}>{img}</ViewTransition> : img}
                  </ZoomLens>
                </CarouselItem>
              )
            })}
          </CarouselContent>
        </Carousel>
        {list.length > 1 ? (
          <div className="absolute inset-x-0 bottom-4 flex justify-center gap-2 md:hidden">
            {list.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => api?.scrollTo(i)}
                aria-label={`Фото ${i + 1}`}
                className={cn('h-1.5 rounded-full transition-all', current === i ? 'w-6 bg-terracotta' : 'w-1.5 bg-espresso/30')}
              />
            ))}
          </div>
        ) : null}
        <p className="mt-3 hidden text-center text-xs text-muted-foreground md:block">{t.product.zoomHint}</p>
      </div>
      {images.length ? (
        <Lightbox images={images} name={name} index={current} onIndex={(i) => api?.scrollTo(i, true) ?? setCurrent(i)} open={lightbox} onOpenChange={setLightbox} />
      ) : null}
    </div>
  )
}
