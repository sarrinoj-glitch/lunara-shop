'use client'

import { motion } from 'motion/react'
import { usePathname } from 'next/navigation'
import { SpinningText } from '@/components/motion/spinning-text'
import { t } from '@/lib/i18n'
import { waLink } from '@/lib/site-config'
import { cn } from '@/lib/utils'
import { WhatsappIcon } from './whatsapp-icon'

/** Плавающий вращающийся бейдж «Написать в WhatsApp» (мотив skincareagents). */
export function WhatsappBadge() {
  const pathname = usePathname()
  const onProduct = pathname.startsWith('/product/')
  const onCheckout = pathname.startsWith('/checkout')
  if (onCheckout) return null

  return (
    <motion.a
      href={waLink()}
      target="_blank"
      rel="noopener"
      aria-label={t.common.whatsapp}
      initial={{ opacity: 0, scale: 0.6, rotate: -30 }}
      animate={{ opacity: 1, scale: 1, rotate: 0 }}
      transition={{ delay: 1.2, type: 'spring', stiffness: 160, damping: 14 }}
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.94 }}
      className={cn(
        'fixed right-3 z-30 rounded-full bg-ivory/90 text-espresso shadow-[0_8px_30px_-12px_rgba(74,44,33,.45)] backdrop-blur md:right-6 md:bottom-6',
        onProduct ? 'bottom-24' : 'bottom-4',
      )}
    >
      <SpinningText text={t.home.badge} size={96} className="md:hidden">
        <span className="grid size-11 place-items-center rounded-full bg-terracotta text-ivory">
          <WhatsappIcon className="size-5" />
        </span>
      </SpinningText>
      <SpinningText text={t.home.badge} size={120} className="hidden md:inline-grid">
        <span className="grid size-14 place-items-center rounded-full bg-terracotta text-ivory">
          <WhatsappIcon className="size-6" />
        </span>
      </SpinningText>
    </motion.a>
  )
}
