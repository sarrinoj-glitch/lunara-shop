import Link from 'next/link'
import { RevealLines, Stagger, FadeItem } from '@/components/motion/reveal'
import { ProductImage } from '@/components/shop/product-image'
import { t } from '@/lib/i18n'
import { cn } from '@/lib/utils'

export type ShowcaseCategory = { slug: string; name: string; count: number; image: string | null }

/** Крупные карточки категорий: огромное слово наезжает на фото (skincareagents). */
export function CategoriesShowcase({ categories }: { categories: ShowcaseCategory[] }) {
  const items = categories.slice(0, 3)
  return (
    <section className="mx-auto max-w-[1440px] px-4 py-16 md:px-8 md:py-24">
      <div className="mb-10 flex items-end justify-between gap-4">
        <RevealLines className="display text-4xl md:text-6xl" lines={[t.home.categoriesTitle]} />
        <Link href="/catalog" className="text-xs uppercase tracking-[0.2em] underline-offset-8 hover:text-terracotta hover:underline">
          {t.common.allProducts}
        </Link>
      </div>
      <Stagger className="grid gap-10 md:grid-cols-3 md:gap-6" stagger={0.12}>
        {items.map((c, i) => (
          <FadeItem key={c.slug} className={cn(i === 1 && 'md:mt-24', i === 2 && 'md:mt-10')}>
            <Link href={`/catalog?category=${c.slug}`} className="group relative block">
              <div className={cn('relative overflow-hidden', i === 1 ? 'arch' : '')}>
                <ProductImage
                  src={c.image}
                  alt={c.name}
                  sizes="(min-width: 768px) 33vw, 100vw"
                  className="aspect-[4/5] w-full"
                  imgClassName="p-[14%] transition-transform duration-[1.2s] ease-[cubic-bezier(.22,1,.36,1)] group-hover:scale-[1.08]"
                />
              </div>
              <h3 className="display pointer-events-none absolute -bottom-5 left-3 text-[17vw] leading-none text-espresso transition-transform duration-700 ease-[cubic-bezier(.22,1,.36,1)] group-hover:-translate-y-2 group-hover:translate-x-2 md:-bottom-6 md:text-[5.6vw]">
                {c.name}
              </h3>
              <span className="absolute right-3 top-3 text-xs tabular-nums text-muted-foreground">
                {String(c.count).padStart(2, '0')}
              </span>
            </Link>
          </FadeItem>
        ))}
      </Stagger>
    </section>
  )
}
