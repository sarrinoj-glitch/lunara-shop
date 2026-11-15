'use client'

import { motion, useMotionValue, useReducedMotion, useSpring } from 'motion/react'
import { useRef, type ReactNode } from 'react'
import { HOVER_QUERY, useMediaQuery } from '@/hooks/use-client-state'

/**
 * Магнитный эффект: элемент тянется к курсору (±strength px) и пружинит назад.
 * Только для устройств с hover — на тач-экранах ничего не делает.
 */
export function Magnetic({ children, strength = 14, className }: { children: ReactNode; strength?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()
  const canHover = useMediaQuery(HOVER_QUERY)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const sx = useSpring(x, { stiffness: 220, damping: 16, mass: 0.4 })
  const sy = useSpring(y, { stiffness: 220, damping: 16, mass: 0.4 })

  const active = canHover && !reduce

  return (
    <motion.div
      ref={ref}
      className={className}
      style={active ? { x: sx, y: sy } : undefined}
      onPointerMove={(e) => {
        if (!active || !ref.current) return
        const r = ref.current.getBoundingClientRect()
        const dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2)
        const dy = (e.clientY - (r.top + r.height / 2)) / (r.height / 2)
        x.set(dx * strength)
        y.set(dy * strength)
      }}
      onPointerLeave={() => {
        x.set(0)
        y.set(0)
      }}
    >
      {children}
    </motion.div>
  )
}
