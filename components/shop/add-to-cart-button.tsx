'use client'

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { t } from '@/lib/i18n'

type Phase = 'idle' | 'adding' | 'added'

/**
 * Кнопка «В корзину» с морфингом: нажатие → «Добавляем…» (спиннер) → рисуется галочка «Добавлено» → обратно.
 * onAdd вызывается сразу; фазы — чистая обратная связь.
 */
export function AddToCartButton({
  onAdd,
  disabled,
  className,
  label = t.common.toCart,
  disabledLabel = t.common.outOfStock,
  ariaLabel,
}: { onAdd: () => void; disabled?: boolean; className?: string; label?: string; disabledLabel?: string; ariaLabel?: string }) {
  const [phase, setPhase] = useState<Phase>('idle')
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  const click = () => {
    if (phase !== 'idle') return
    onAdd()
    setPhase('adding')
    timers.current.push(setTimeout(() => setPhase('added'), 380))
    timers.current.push(setTimeout(() => setPhase('idle'), 1800))
  }

  return (
    <motion.button
      type="button"
      disabled={disabled}
      onClick={click}
      whileTap={{ scale: 0.97 }}
      aria-live="polite"
      className={cn(
        'relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full text-xs font-medium uppercase tracking-[0.2em] text-ivory transition-colors duration-500 disabled:pointer-events-none disabled:opacity-50',
        phase === 'added' ? 'bg-brown' : 'bg-terracotta hover:bg-terracotta-deep',
        className,
      )}
      aria-label={ariaLabel}
    >
      <AnimatePresence mode="wait" initial={false}>
        {disabled ? (
          <span key="d">{disabledLabel}</span>
        ) : phase === 'idle' ? (
          <motion.span key="i" initial={{ y: 14, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -14, opacity: 0 }}>
            {label}
          </motion.span>
        ) : phase === 'adding' ? (
          <motion.span key="a" className="flex items-center gap-2" initial={{ y: 14, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -14, opacity: 0 }}>
            <Loader2 className="size-4 animate-spin" aria-hidden /> {t.common.adding}
          </motion.span>
        ) : (
          <motion.span key="ok" className="flex items-center gap-2" initial={{ y: 14, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -14, opacity: 0 }}>
            <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={2.2} aria-hidden>
              <motion.path d="M5 12.5l4.5 4.5L19 7.5" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.35 }} />
            </svg>
            {t.common.addedShort}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  )
}
