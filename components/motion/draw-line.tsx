'use client'

import { motion, useScroll, useTransform } from 'motion/react'
import { useRef } from 'react'
import { cn } from '@/lib/utils'

/** Тонкая SVG-кривая, которая «рисуется» по мере скролла секции. */
export function DrawLine({ className, d }: { className?: string; d?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 85%', 'end 30%'] })
  const pathLength = useTransform(scrollYProgress, [0, 1], [0, 1])
  return (
    <div ref={ref} className={cn('pointer-events-none', className)} aria-hidden>
      <svg viewBox="0 0 1200 600" fill="none" preserveAspectRatio="none" className="h-full w-full">
        <motion.path
          d={d ?? 'M-20 420 C 220 120, 420 560, 640 300 S 1020 40, 1220 260'}
          stroke="currentColor"
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
          style={{ pathLength }}
        />
      </svg>
    </div>
  )
}
