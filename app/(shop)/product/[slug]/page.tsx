import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'
import { getAllProducts, getProductBySlug } from '@/lib/catalog/queries'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { ProductCard, ProductBadges } from '@/components/shop/product-card'
import { RevealLines } from '@/components/motion/reveal'
import { formatPrice } from '@/lib/format'
import { fmt, t } from '@/lib/i18n'
import { publicEnv } from '@/lib/public-env'
import { siteConfig, waLink } from '@/lib/site-config'
import { WhatsappIcon } from '@/components/shop/whatsapp-icon'
import { ProductGallery } from './_components/product-gallery'
import { BuyBox } from './_components/buy-box'

export async function generateStaticParams() {
  const products = await getAllProducts()
  return products.map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({ params }: PageProps<'/product/[slug]'>): Promise<Metadata> {
  const { slug } = await params
  const p = await getProductBySlug(slug)
  if (!p) return { title: t.product.notFoundTitle }
  const description = (p.description ?? `${p.name} — ${p.brand}`).slice(0, 160)
  return {
    title: p.name,
    description,
    openGraph: { title: p.name, description, images: p.images[0] ? [{ url: p.images[0] }] : undefined },
  }
}

async function ProductContent({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const [p, all] = await Promise.all([getProductBySlug(slug), getAllProducts()])
  if (!p) notFound()

  const same = all.filter((x) => x.id !== p.id && p.aromaSlug && x.aromaSlug === p.aromaSlug).slice(0, 8)
  const url = `${publicEnv.siteUrl}/product/${p.slug}`

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: p.name,
    image: p.images,
    description: p.description ?? undefined,
    brand: { '@type': 'Brand', name: p.brand },
    offers: {
      '@type': 'Offer',
      price: p.price,
      priceCurrency: 'RUB',
      availability: p.inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      url,
    },
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
      <nav className="mb-6 text-xs uppercase tracking-[0.16em] text-muted-foreground" aria-label="Хлебные крошки">
        <Link href="/catalog" className="hover:text-terracotta">{t.common.catalog}</Link>
        <span className="mx-2">/</span>
        <Link href={`/catalog?category=${p.category.slug}`} className="hover:text-terracotta">{p.category.name}</Link>
      </nav>

      <div className="grid gap-8 md:grid-cols-[1.1fr_1fr] md:gap-14">
        <ProductGallery images={p.images} name={p.name} badges={<ProductBadges p={p} className="absolute left-3 top-3 z-10" />} />

        <div className="md:sticky md:top-24 md:self-start">
          <p className="text-xs uppercase tracking-[0.3em] text-terracotta">{p.brand}</p>
          <h1 className="accent-serif mt-3 text-[34px] not-italic leading-[1.05] md:text-5xl">{p.name}</h1>
          <div className="mt-4 flex flex-wrap gap-2">
            {p.aroma ? (
              <Link href={`/catalog?aroma=${p.aromaSlug}`} className="rounded-full border border-line px-3 py-1 text-xs hover:border-terracotta hover:text-terracotta">
                {t.common.aroma}: <span className="accent-serif text-sm">{p.aroma}</span>
              </Link>
            ) : null}
            {p.volume ? <span className="rounded-full border border-line px-3 py-1 text-xs">{t.common.volume}: {p.volume}</span> : null}
          </div>

          <p className="mt-6 flex items-baseline gap-3">
            <span className="text-3xl font-light">{formatPrice(p.price)}</span>
            {p.oldPrice ? <s className="text-lg text-muted-foreground">{formatPrice(p.oldPrice)}</s> : null}
            {p.discount ? <span className="bg-terracotta px-2 py-0.5 text-xs text-ivory">−{p.discount}%</span> : null}
          </p>

          <BuyBox
            product={{ productId: p.id, slug: p.slug, name: p.name, price: p.price, image: p.images[0] ?? null }}
            inStock={p.inStock}
          />

          <a
            href={waLink(fmt(t.product.askText, { name: p.name, url }), siteConfig.whatsappNumber)}
            target="_blank"
            rel="noopener"
            className="mt-3 flex h-12 items-center justify-center gap-2 rounded-full border border-espresso text-xs uppercase tracking-[0.18em] transition-colors hover:border-terracotta hover:text-terracotta"
          >
            <WhatsappIcon className="size-4" /> {t.product.ask}
          </a>

          <Accordion type="single" collapsible defaultValue="description" className="mt-8 border-t border-line">
            <AccordionItem value="description" className="border-line">
              <AccordionTrigger className="py-5 text-xs uppercase tracking-[0.2em] hover:no-underline">{t.product.description}</AccordionTrigger>
              <AccordionContent className="whitespace-pre-line text-[15px] leading-relaxed text-espresso/85">
                {p.description ?? t.product.noDescription}
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="delivery" className="border-line">
              <AccordionTrigger className="py-5 text-xs uppercase tracking-[0.2em] hover:no-underline">{t.product.delivery}</AccordionTrigger>
              <AccordionContent className="text-[15px] leading-relaxed text-espresso/85">{t.product.deliveryText}</AccordionContent>
            </AccordionItem>
            <AccordionItem value="returns" className="border-line">
              <AccordionTrigger className="py-5 text-xs uppercase tracking-[0.2em] hover:no-underline">{t.product.returns}</AccordionTrigger>
              <AccordionContent className="text-[15px] leading-relaxed text-espresso/85">{t.product.returnsText}</AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>

      {same.length > 0 ? (
        <section className="mt-24">
          <RevealLines
            className="display mb-10 text-4xl md:text-6xl"
            lines={[t.product.sameAroma, <span key="a" className="accent-serif text-[0.6em] text-terracotta">{p.aroma}</span>]}
          />
          <div className="no-scrollbar -mx-4 flex snap-x gap-4 overflow-x-auto px-4 md:mx-0 md:grid md:grid-cols-4 md:gap-6 md:overflow-visible md:px-0">
            {same.map((x) => (
              <div key={x.id} className="w-[46vw] shrink-0 snap-start md:w-auto">
                <ProductCard p={x} sizes="(min-width: 768px) 25vw, 46vw" />
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </>
  )
}

export default function ProductPage({ params }: PageProps<'/product/[slug]'>) {
  return (
    <div className="mx-auto max-w-[1440px] px-4 pb-10 pt-6 md:px-8 md:pt-10">
      <Suspense
        fallback={
          <div className="grid gap-8 md:grid-cols-[1.1fr_1fr]" aria-busy="true">
            <div className="aspect-square animate-pulse bg-sand" />
            <div className="space-y-4">
              <div className="h-4 w-24 animate-pulse bg-sand" />
              <div className="h-12 w-4/5 animate-pulse bg-sand" />
              <div className="h-8 w-1/3 animate-pulse bg-sand" />
              <div className="h-14 w-full animate-pulse rounded-full bg-sand" />
            </div>
          </div>
        }
      >
        <ProductContent params={params} />
      </Suspense>
    </div>
  )
}
