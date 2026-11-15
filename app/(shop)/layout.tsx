import { Header } from '@/components/shop/header'
import { Footer } from '@/components/shop/footer'
import { CartSheet } from '@/components/shop/cart-sheet'
import { WhatsappBadge } from '@/components/shop/whatsapp-badge'
import { t } from '@/lib/i18n'

export default function ShopLayout({ children }: LayoutProps<'/'>) {
  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:bg-ivory focus:px-4 focus:py-2">
        {t.common.skipToContent}
      </a>
      <Header />
      <main id="main">{children}</main>
      <Footer />
      <CartSheet />
      <WhatsappBadge />
    </>
  )
}
