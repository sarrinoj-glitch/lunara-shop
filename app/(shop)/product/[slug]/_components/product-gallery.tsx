'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from '@/components/ui/carousel'
import { ProductImage } from '@/components/shop/product-image'
import { cn } from '@/lib/utils'

/** Галерея: свайп (Embla), точки на мобиле, миниатюры на десктопе. */
export function ProductGallery({ images, name, badges }: { images: string[]; name: string; badges?: ReactNode }) {
  const [api, setApi] = useState<CarouselApi>()
  const [current, setCurrent] = useState(0)

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
            {list.map((src, i) => (
              <CarouselItem key={i} className="pl-0">
                <ProductImage src={src} alt={i === 0 ? name : `${name}, фото ${i + 1}`} priority={i === 0} sizes="(min-width: 768px) 50vw, 100vw" className="aspect-square w-full" imgClassName="p-[10%]" />
              </CarouselItem>
            ))}
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
      </div>
    </div>
  )
}
