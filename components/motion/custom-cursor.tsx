'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion, useMotionValue, useReducedMotion, useSpring } from 'motion/react'
import { HOVER_QUERY, useMediaQuery } from '@/hooks/use-client-state'

/**
 * Курсор-кольцо (только мышь): точка идёт за указателем мгновенно, кольцо — с пружиной.
 * Над элементом с data-cursor="Текст" кольцо раздувается и показывает подпись;
 * над ссылками и кнопками — слегка увеличивается. Нативный курсор не скрываем (доступность).
 */
export function CustomCursor() {
  const hover = useMediaQuery(HOVER_QUERY)
  const reduce = useReducedMotion()
  const x = useMotionValue(-100)
  const y = useMotionValue(-100)
  const rx = useSpring(x, { stiffness: 350, damping: 30, mass: 0.6 })
  const ry = useSpring(y, { stiffness: 350, damping: 30, mass: 0.6 })
  const [label, setLabel] = useState<string | null>(null)
  const [interactive, setInteractive] = useState(false)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!hover || reduce) return
    const move = (e: PointerEvent) => {
      x.set(e.clientX)
      y.set(e.clientY)
      setVisible(true)
    }
    const over = (e: PointerEvent) => {
      const el = (e.target as HTMLElement | null)?.closest<HTMLElement>('[data-cursor], a, button, [role="button"]')
      setLabel(el?.dataset.cursor ?? null)
      setInteractive(Boolean(el))
    }
    const leave = () => setVisible(false)
    window.addEventListener('pointermove', move, { passive: true })
    document.addEventListener('pointerover', over, { passive: true })
    document.documentElement.addEventListener('pointerleave', leave)
    return () => {
      window.removeEventListener('pointermove', move)
      document.removeEventListener('pointerover', over)
      document.documentElement.removeEventListener('pointerleave', leave)
    }
  }, [hover, reduce, x, y])

  if (!hover || reduce) return null

  const size = label ? 88 : interactive ? 46 : 30

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[150]">
      <motion.div className="absolute left-0 top-0 size-1.5 rounded-full bg-terracotta" style={{ x, y, translateX: '-50%', translateY: '-50%', opacity: visible ? 1 : 0 }} />
      <motion.div
        className="absolute left-0 top-0 grid place-items-center rounded-full border border-terracotta/70"
        style={{ x: rx, y: ry, translateX: '-50%', translateY: '-50%', opacity: visible ? 1 : 0 }}
        animate={{
          width: size,
          height: size,
          backgroundColor: label ? 'rgba(168,74,36,0.92)' : 'rgba(168,74,36,0)',
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 24 }}
      >
        <AnimatePresence>
          {label ? (
            <motion.span
              key={label}
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.6 }}
              className="text-[10px] font-medium uppercase tracking-[0.18em] text-ivory"
            >
              {label}
            </motion.span>
          ) : null}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
