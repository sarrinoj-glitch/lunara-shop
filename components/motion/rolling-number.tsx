'use client'

import { motion } from 'motion/react'
import { cn } from '@/lib/utils'

const DIGITS = '0123456789'.split('')

/**
 * «Счётчик-одометр»: каждая цифра — колонка 0–9, которая прокатывается к нужному значению.
 * Не-цифры (пробел, ₽, −) выводятся как есть. Цифры выровнены справа, поэтому
 * при смене разрядности колонки не «прыгают».
 */
export function RollingText({ value, className }: { value: string; className?: string }) {
  const chars = value.split('')
  return (
    <span className={cn('inline-flex overflow-hidden tabular-nums', className)} aria-label={value}>
      {chars.map((ch, i) => {
        const key = chars.length - i // стабильный ключ справа налево
        if (!/\d/.test(ch)) {
          return (
            <span key={`c${key}`} aria-hidden className="whitespace-pre">
              {ch}
            </span>
          )
        }
        return (
          <span key={`d${key}`} aria-hidden className="relative inline-block h-[1.15em] overflow-hidden leading-[1.15em]">
            <span className="invisible">0</span>
            <motion.span
              className="absolute inset-x-0 top-0 flex flex-col"
              initial={false}
              animate={{ y: `${-Number(ch) * 1.15}em` }}
              transition={{ type: 'spring', stiffness: 220, damping: 26 }}
            >
              {DIGITS.map((d) => (
                <span key={d} className="h-[1.15em]">
                  {d}
                </span>
              ))}
            </motion.span>
          </span>
        )
      })}
    </span>
  )
}
