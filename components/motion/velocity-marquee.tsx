'use client'

// Основа — 21st.dev «Scroll Based Velocity» (magicui), переписано под motion/react,
// одну строку, разделители ✦ и reduced-motion.
import {
  motion,
  useAnimationFrame,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
} from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

const wrap = (min: number, max: number, v: number) => {
  const range = max - min
  return ((((v - min) % range) + range) % range) + min
}

export function VelocityMarquee({
  items,
  baseVelocity = -2.5,
  className,
}: {
  items: string[]
  baseVelocity?: number
  className?: string
}) {
  const reduce = useReducedMotion()
  const baseX = useMotionValue(0)
  const { scrollY } = useScroll()
  const scrollVelocity = useVelocity(scrollY)
  const smooth = useSpring(scrollVelocity, { damping: 50, stiffness: 400 })
  const factor = useTransform(smooth, [0, 1000], [0, 4], { clamp: false })
  const direction = useRef(1)
  const containerRef = useRef<HTMLDivElement>(null)
  const chunkRef = useRef<HTMLSpanElement>(null)
  const [reps, setReps] = useState(2)

  useEffect(() => {
    const calc = () => {
      if (!containerRef.current || !chunkRef.current) return
      setReps(Math.max(2, Math.ceil(containerRef.current.offsetWidth / chunkRef.current.offsetWidth) + 2))
    }
    calc()
    window.addEventListener('resize', calc)
    return () => window.removeEventListener('resize', calc)
  }, [items])

  const x = useTransform(baseX, (v) => `${wrap(-100 / reps, 0, v)}%`)

  useAnimationFrame((_, delta) => {
    if (reduce) return
    let moveBy = direction.current * baseVelocity * (delta / 1000)
    const f = factor.get()
    if (f < 0) direction.current = -1
    else if (f > 0) direction.current = 1
    moveBy += direction.current * moveBy * f
    baseX.set(baseX.get() + moveBy)
  })

  return (
    <div ref={containerRef} className={cn('w-full overflow-hidden whitespace-nowrap', className)} aria-label={items.join(', ')}>
      <motion.div className="inline-flex" style={{ x }} aria-hidden>
        {Array.from({ length: reps }).map((_, i) => (
          <span key={i} ref={i === 0 ? chunkRef : undefined} className="inline-flex shrink-0 items-center">
            {items.map((item) => (
              <span key={item} className="inline-flex items-center">
                <span className="px-6 md:px-10">{item}</span>
                <span className="text-[0.6em]">✦</span>
              </span>
            ))}
          </span>
        ))}
      </motion.div>
    </div>
  )
}
