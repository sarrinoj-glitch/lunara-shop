'use client'

import { useRef, type ReactNode } from 'react'
import { motion, useMotionTemplate, useMotionValue, useReducedMotion, useSpring, useTransform } from 'motion/react'
import { HOVER_QUERY, useMediaQuery } from '@/hooks/use-client-state'
import { cn } from '@/lib/utils'

/**
 * 3D-наклон за курсором + мягкий блик (spotlight). Только мышь, без reduced-motion.
 */
export function Tilt({ children, className, max = 8, glare = true }: { children: ReactNode; className?: string; max?: number; glare?: boolean }) {
  const ref = useRef<HTMLDivElement>(null)
  const canHover = useMediaQuery(HOVER_QUERY)
  const reduce = useReducedMotion()
  const px = useMotionValue(0.5)
  const py = useMotionValue(0.5)
  const sx = useSpring(px, { stiffness: 200, damping: 20 })
  const sy = useSpring(py, { stiffness: 200, damping: 20 })
  const rotateY = useTransform(sx, [0, 1], [-max, max])
  const rotateX = useTransform(sy, [0, 1], [max, -max])
  const gx = useTransform(sx, (v) => `${v * 100}%`)
  const gy = useTransform(sy, (v) => `${v * 100}%`)
  const background = useMotionTemplate`radial-gradient(circle at ${gx} ${gy}, rgba(251,247,242,0.45), transparent 55%)`
  const active = canHover && !reduce

  return (
    <div style={{ perspective: 1000 }} className={className}>
      <motion.div
        ref={ref}
        className="relative h-full w-full [transform-style:preserve-3d]"
        style={active ? { rotateX, rotateY } : undefined}
        onPointerMove={(e) => {
          if (!active || !ref.current) return
          const r = ref.current.getBoundingClientRect()
          px.set((e.clientX - r.left) / r.width)
          py.set((e.clientY - r.top) / r.height)
        }}
        onPointerLeave={() => {
          px.set(0.5)
          py.set(0.5)
        }}
      >
        {children}
        {active && glare ? (
          <motion.div aria-hidden className={cn('pointer-events-none absolute inset-0 z-20 opacity-0 mix-blend-soft-light transition-opacity duration-500 group-hover:opacity-100')} style={{ background }} />
        ) : null}
      </motion.div>
    </div>
  )
}
