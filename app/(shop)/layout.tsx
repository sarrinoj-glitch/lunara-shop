import { Header } from '@/components/shop/header'
import { Footer } from '@/components/shop/footer'
import { CartSheet } from '@/components/shop/cart-sheet'
import { WhatsappBadge } from '@/components/shop/whatsapp-badge'
import { QuickView } from '@/components/shop/quick-view'
import { SearchCommand } from '@/components/shop/search-command'
import { getAllProducts, getAromas, getCategories } from '@/lib/catalog/queries'
import { t } from '@/lib/i18n'

export default async function ShopLayout({ children }: LayoutProps<'/'>) {
  const [products, aromas, categories] = await Promise.all([getAllProducts(), getAromas(), getCategories()])
  const searchProducts = products.map((p) => ({
    slug: p.slug,
    name: p.name,
    price: p.price,
    image: p.images[0] ?? null,
    aroma: p.aroma,
    category: p.category.name,
  }))

  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:bg-ivory focus:px-4 focus:py-2">
        {t.common.skipToContent}
      </a>
      <Header />
      <main id="main">{children}</main>
      <Footer />
      <CartSheet />
      <QuickView />
      <SearchCommand
        products={searchProducts}
        aromas={aromas.map(({ slug, name, count }) => ({ slug, name, count }))}
        categories={categories.map(({ slug, name, count }) => ({ slug, name, count }))}
      />
      <WhatsappBadge />
    </>
  )
}
