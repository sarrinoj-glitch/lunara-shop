import { getAllProducts, getAromas, getCategories } from '@/lib/catalog/queries'
import { VelocityMarquee } from '@/components/motion/velocity-marquee'
import { slugify } from '@/lib/slug'
import { t } from '@/lib/i18n'
import { Hero, type HeroSlide } from './_components/hero'
import { CategoriesShowcase } from './_components/categories-showcase'
import { ProductTabs } from './_components/product-tabs'
import { RitualsList } from './_components/rituals-list'
import { HowToOrder } from './_components/how-to-order'
import { Manifesto } from './_components/manifesto'
import { EmptyState } from '@/components/shop/states'
import { BrandStats } from './_components/brand-stats'
import { HammamRitual } from './_components/hammam-ritual'
import { AromaJourney } from './_components/aroma-journey'

export default async function HomePage() {
  const [products, categories, aromas] = await Promise.all([getAllProducts(), getCategories(), getAromas()])

  if (products.length === 0) {
    return (
      <EmptyState
        title="Витрина готовится"
        text="Скоро здесь появятся ароматы амбры, розы и специй. Пока можно написать нам в WhatsApp — подберём уход лично."
      />
    )
  }

  const pickImage = (pred: (p: (typeof products)[number]) => boolean) => products.find((p) => pred(p) && p.images[0])?.images[0] ?? null

  const slides: HeroSlide[] = t.home.slides.map((s) => {
    const slug = slugify(s.aroma)
    const lineProducts = products.filter((p) => p.aromaSlug === slug && p.images[0])
    const hero = lineProducts.find((p) => /лосьон|масло|парфюм/i.test(p.name)) ?? lineProducts[0]
    return { title: s.title, aroma: s.aroma, aromaSlug: slug, image: hero?.images[0] ?? null, alt: hero?.name ?? s.title }
  })

  const showcase = ['telo', 'aromaty', 'litso']
    .map((slug) => categories.find((c) => c.slug === slug))
    .filter((c): c is NonNullable<typeof c> => Boolean(c))
    .map((c) => ({ ...c, image: pickImage((p) => p.category.slug === c.slug) }))

  const groups = {
    new: products.filter((p) => p.isNew),
    hit: products.filter((p) => p.isHit),
    sale: [...products].filter((p) => p.discount).sort((a, b) => (b.discount ?? 0) - (a.discount ?? 0)),
  }

  const manifestoImages = [
    pickImage((p) => /маска-рассул/i.test(p.name)),
    pickImage((p) => /мыло/i.test(p.name)),
    pickImage((p) => /гоммаж/i.test(p.name)),
  ]

  const norm = (s: string) => s.toLowerCase().replace(/ё/g, 'е')
  const hammam = t.home.hammamSteps
    .map((s) => ({ step: s.step, text: s.text, product: products.find((p) => norm(p.name).startsWith(s.match) && p.images[0]) }))
    .filter((s): s is { step: string; text: string; product: (typeof products)[number] } => Boolean(s.product))

  const notes = t.home.aromaNotes as Record<string, string>
  const journey = aromas
    .filter((a) => notes[a.name])
    .map((a) => {
      const line = products.filter((p) => p.aromaSlug === a.slug && p.images[0])
      const hero = line.find((p) => /парфюм|лосьон|масло/i.test(p.name)) ?? line[0]
      return { slug: a.slug, name: a.name, count: a.count, image: hero?.images[0] ?? a.image, note: notes[a.name] }
    })

  const maxDiscount = Math.max(0, ...products.map((p) => p.discount ?? 0))
  const stats = { products: products.length, aromas: aromas.length, categories: categories.length, discount: maxDiscount }

  return (
    <>
      <Hero slides={slides} />
      <div className="grain border-y border-terracotta-deep bg-terracotta py-4 text-ivory md:py-5">
        <VelocityMarquee items={t.home.marquee} className="relative z-[2] text-lg font-light uppercase tracking-[0.14em] md:text-2xl" />
      </div>
      <BrandStats values={stats} />
      <CategoriesShowcase categories={showcase} />
      <ProductTabs groups={groups} />
      <HammamRitual steps={hammam} />
      <AromaJourney items={journey} />
      <RitualsList aromas={aromas} />
      <HowToOrder />
      <Manifesto images={manifestoImages} />
    </>
  )
}
