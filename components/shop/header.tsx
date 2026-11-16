'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useHydrated } from '@/hooks/use-client-state'
import { useUI } from '@/lib/ui/store'
import { ScrollProgress } from '@/components/motion/scroll-progress'
import { motion, useMotionValueEvent, useScroll } from 'motion/react'
import { Menu, Search, ShoppingBag } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import { t } from '@/lib/i18n'
import { siteConfig, waLink } from '@/lib/site-config'
import { cartCount, useCart } from '@/lib/cart/store'
import { WhatsappIcon } from './whatsapp-icon'

const CATEGORY_LINKS = [
  { label: 'Тело', href: '/catalog?category=telo' },
  { label: 'Лицо', href: '/catalog?category=litso' },
  { label: 'Руки', href: '/catalog?category=ruki' },
  { label: 'Ароматы', href: '/catalog?category=aromaty' },
  { label: 'Для дома', href: '/catalog?category=dom' },
  { label: 'Наборы', href: '/catalog?category=nabory' },
]

function CartButton() {
  const items = useCart((s) => s.items)
  const bump = useCart((s) => s.bump)
  const setOpen = useCart((s) => s.setOpen)
  const hydrated = useHydrated()
  const count = hydrated ? cartCount(items) : 0

  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      data-cart-target
      aria-label={`${t.cart.open}${count ? `, ${count}` : ''}`}
      className="relative grid size-10 place-items-center transition-colors hover:text-terracotta"
    >
      <ShoppingBag className="size-[22px]" strokeWidth={1.4} aria-hidden />
      {count > 0 ? (
        <motion.span
          key={bump}
          initial={{ scale: 0.4 }}
          animate={{ scale: [1.5, 1] }}
          transition={{ type: 'spring', stiffness: 500, damping: 14 }}
          className="absolute -right-0.5 -top-0.5 grid min-w-[18px] place-items-center rounded-full bg-terracotta px-1 text-[10px] font-medium leading-[18px] text-ivory"
        >
          {count}
        </motion.span>
      ) : null}
    </button>
  )
}

export function Header() {
  const { scrollY } = useScroll()
  const [compact, setCompact] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const setSearchOpen = useUI((st) => st.setSearchOpen)
  useMotionValueEvent(scrollY, 'change', (v) => setCompact(v > 40))

  return (
    <header
      className={cn(
        'sticky top-0 z-40 transition-[background-color,backdrop-filter,height,border-color] duration-500',
        compact ? 'h-14 border-b border-line bg-cream/85 backdrop-blur-md' : 'h-[72px] border-b border-transparent',
      )}
    >
      <ScrollProgress />
      <div className="mx-auto grid h-full max-w-[1440px] grid-cols-[1fr_auto_1fr] items-center px-4 md:px-8">
        <div className="flex items-center gap-1 md:gap-6">
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <button type="button" className="flex items-center gap-2 py-2 text-xs uppercase tracking-[0.2em] hover:text-terracotta" aria-label={t.common.openMenu}>
                <Menu className="size-5" strokeWidth={1.4} aria-hidden />
                <span className="hidden sm:inline">{t.common.catalog}</span>
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[88vw] max-w-md border-none bg-cream p-0">
              <SheetHeader className="border-b border-line px-6 py-5">
                <SheetTitle className="display text-2xl">{t.header.categories}</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col px-6 py-4">
                <Link href="/catalog" onClick={() => setMenuOpen(false)} className="display border-b border-line py-4 text-3xl hover:text-terracotta">
                  {t.catalog.all}
                </Link>
                {CATEGORY_LINKS.map((c, i) => (
                  <motion.div key={c.href} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 * i + 0.1 }}>
                    <Link href={c.href} onClick={() => setMenuOpen(false)} className="display block border-b border-line py-4 text-3xl hover:text-terracotta">
                      {c.label}
                    </Link>
                  </motion.div>
                ))}
              </nav>
              <div className="mt-auto px-6 pb-8">
                <a href={waLink()} target="_blank" rel="noopener" className="flex items-center gap-3 text-sm hover:text-terracotta">
                  <WhatsappIcon className="size-5" /> {siteConfig.whatsappDisplay}
                </a>
              </div>
            </SheetContent>
          </Sheet>
          <nav className="hidden items-center gap-6 lg:flex" aria-label={t.header.categories}>
            {t.header.nav.map((n) => (
              <Link key={n.href} href={n.href} className="text-xs uppercase tracking-[0.2em] transition-colors hover:text-terracotta">
                {n.label}
              </Link>
            ))}
          </nav>
        </div>

        <Link href="/" className="group flex flex-col items-center leading-none" aria-label={siteConfig.name}>
          <span className={cn('font-light tracking-[0.42em] transition-all duration-500', compact ? 'text-xl' : 'text-2xl md:text-[28px]')}>
            {siteConfig.name}
          </span>
          <span className={cn('accent-serif text-[11px] text-terracotta transition-all duration-500', compact ? 'h-0 opacity-0' : 'mt-1 opacity-100')}>
            {siteConfig.tagline.toLowerCase()}
          </span>
        </Link>

        <div className="flex items-center justify-end gap-1 md:gap-3">
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="grid size-10 place-items-center hover:text-terracotta"
            aria-label={t.search.open}
            title={t.search.hint}
          >
            <Search className="size-5" strokeWidth={1.4} aria-hidden />
          </button>
          <a href={waLink()} target="_blank" rel="noopener" className="hidden size-10 place-items-center hover:text-terracotta sm:grid" aria-label={t.common.whatsapp}>
            <WhatsappIcon className="size-5" />
          </a>
          <CartButton />
        </div>
      </div>
    </header>
  )
}
