'use client'

import Link from 'next/link'
import { useEffect, useMemo } from 'react'
import { motion } from 'motion/react'
import { Button } from '@/components/ui/button'
import { WhatsappIcon } from '@/components/shop/whatsapp-icon'
import { RevealLines } from '@/components/motion/reveal'
import { useSessionValue } from '@/hooks/use-client-state'
import { fmt, t } from '@/lib/i18n'
import { waLink } from '@/lib/site-config'

export function SuccessView({ number, auto }: { number: number | null; auto: boolean }) {
  const raw = useSessionValue('ambra-last-order')
  const url = useMemo(() => {
    if (!raw) return null
    try {
      const saved = JSON.parse(raw) as { n: number; url: string }
      return !number || saved.n === number ? saved.url : null
    } catch {
      return null
    }
  }, [raw, number])

  // На мобиле сразу переводим в WhatsApp (кнопка ниже — запасной путь)
  useEffect(() => {
    if (!auto || !url) return
    const id = setTimeout(() => window.location.assign(url), 700)
    return () => clearTimeout(id)
  }, [auto, url])

  return (
    <section className="mx-auto flex max-w-2xl flex-col items-center px-6 py-20 text-center md:py-28">
      <motion.div
        initial={{ clipPath: 'inset(100% 0 0 0)' }}
        animate={{ clipPath: 'inset(0% 0 0 0)' }}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        className="arch grid h-48 w-32 place-items-center bg-terracotta text-ivory"
      >
        <motion.svg viewBox="0 0 24 24" className="size-12" fill="none" stroke="currentColor" strokeWidth={1.4} aria-hidden>
          <motion.path d="M5 12.5l4.5 4.5L19 7.5" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.7, duration: 0.6 }} />
        </motion.svg>
      </motion.div>
      <RevealLines
        as="h1"
        immediate
        delay={0.3}
        className="display mt-10 text-4xl md:text-6xl"
        lines={[number ? fmt(t.checkout.successTitle, { n: number }) : t.checkout.successTitle.replace(' №{n}', '')]}
      />
      <p className="mt-5 max-w-md text-muted-foreground">{t.checkout.successText}</p>
      <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
        <Button asChild size="lg" className="h-14 gap-2 rounded-full px-8 text-xs uppercase tracking-[0.2em]">
          <a href={url ?? waLink()} target="_blank" rel="noopener">
            <WhatsappIcon className="size-5" /> {t.checkout.openWhatsapp}
          </a>
        </Button>
        <Button asChild size="lg" variant="outline" className="h-14 rounded-full border-espresso px-8 text-xs uppercase tracking-[0.2em]">
          <Link href="/">{t.checkout.backToShop}</Link>
        </Button>
      </div>
    </section>
  )
}
