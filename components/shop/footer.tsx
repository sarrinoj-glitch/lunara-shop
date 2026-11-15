import Link from 'next/link'
import { t } from '@/lib/i18n'
import { siteConfig, waLink } from '@/lib/site-config'
import { WhatsappIcon } from './whatsapp-icon'

export function Footer() {
  return (
    <footer className="grain mt-8 bg-espresso text-ivory/85">
      <div className="relative z-[2] mx-auto max-w-[1440px] px-4 pb-10 pt-16 md:px-8">
        <p className="display text-[19vw] leading-[0.8] text-ivory/90 md:text-[15vw]" aria-hidden>
          {siteConfig.name}
        </p>
        <div className="mt-12 grid gap-10 border-t border-ivory/15 pt-10 sm:grid-cols-2 lg:grid-cols-4">
          <p className="max-w-xs text-sm leading-relaxed text-ivory/70">{t.footer.about}</p>
          <div>
            <p className="mb-4 text-xs uppercase tracking-[0.2em] text-clay">{t.footer.shop}</p>
            <ul className="space-y-2 text-sm">
              <li><Link href="/catalog" className="hover:text-clay">{t.common.allProducts}</Link></li>
              <li><Link href="/catalog?category=telo" className="hover:text-clay">Тело</Link></li>
              <li><Link href="/catalog?category=aromaty" className="hover:text-clay">Ароматы</Link></li>
              <li><Link href="/catalog?sort=sale" className="hover:text-clay">{t.home.tabs.sale}</Link></li>
            </ul>
          </div>
          <div>
            <p className="mb-4 text-xs uppercase tracking-[0.2em] text-clay">{t.footer.help}</p>
            <ul className="space-y-2 text-sm">
              <li><Link href="/#how" className="hover:text-clay">{t.footer.howToOrder}</Link></li>
              <li><Link href="/privacy" className="hover:text-clay">{t.footer.privacy}</Link></li>
            </ul>
          </div>
          <div>
            <p className="mb-4 text-xs uppercase tracking-[0.2em] text-clay">{t.header.contacts}</p>
            <a href={waLink()} target="_blank" rel="noopener" className="flex items-center gap-2 text-sm hover:text-clay">
              <WhatsappIcon className="size-4" /> {siteConfig.whatsappDisplay}
            </a>
          </div>
        </div>
        <p className="mt-12 text-xs text-ivory/50">
          © {siteConfig.name} 2026 · {t.footer.rights}
        </p>
      </div>
    </footer>
  )
}
