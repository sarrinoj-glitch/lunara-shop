'use client'

import { motion, useScroll, useSpring } from 'motion/react'

/** Тонкая терракотовая полоса прогресса чтения под шапкой. */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, { stiffness: 140, damping: 30, restDelta: 0.001 })
  return <motion.div aria-hidden className="absolute inset-x-0 bottom-0 h-px origin-left bg-terracotta" style={{ scaleX }} />
}
