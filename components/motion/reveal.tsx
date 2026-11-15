'use client'

import { motion, type Variants } from 'motion/react'
import type { ElementType, ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { EASE } from './motion-provider'

/** Построчный reveal снизу из маски (заголовки секций). */
export function RevealLines({
  lines,
  className,
  lineClassName,
  as: Tag = 'h2',
  delay = 0,
  immediate = false,
}: {
  lines: ReactNode[]
  className?: string
  lineClassName?: string
  as?: ElementType
  delay?: number
  /** true — анимировать при монтировании (hero), иначе при появлении в вьюпорте */
  immediate?: boolean
}) {
  const trigger = immediate
    ? { initial: 'hidden', animate: 'show' }
    : { initial: 'hidden', whileInView: 'show', viewport: { once: true, margin: '-10% 0px' } }

  return (
    <Tag className={className}>
      <motion.span
        className="block"
        {...trigger}
        variants={{ show: { transition: { staggerChildren: 0.09, delayChildren: delay } } }}
      >
        {lines.map((line, i) => (
          <span key={i} className="block overflow-hidden pb-[0.06em]">
            <motion.span
              className={cn('block will-change-transform', lineClassName)}
              variants={{
                hidden: { y: '105%' },
                show: { y: '0%', transition: { duration: 0.9, ease: EASE } },
              }}
            >
              {line}
            </motion.span>
          </span>
        ))}
      </motion.span>
    </Tag>
  )
}

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } },
}

/** Контейнер со stagger-появлением детей <FadeItem>. */
export function Stagger({
  children,
  className,
  as = 'div',
  stagger = 0.07,
  onMount = false,
}: {
  children: ReactNode
  className?: string
  as?: 'div' | 'ul' | 'section'
  stagger?: number
  /** true — анимировать сразу при монтировании (основной контент вверху страницы) */
  onMount?: boolean
}) {
  const Comp = motion[as]
  const trigger = onMount ? { animate: 'show' } : { whileInView: 'show', viewport: { once: true, margin: '-8% 0px' } }
  return (
    <Comp
      className={className}
      initial="hidden"
      {...trigger}
      variants={{ show: { transition: { staggerChildren: stagger } } }}
    >
      {children}
    </Comp>
  )
}

export function FadeItem({
  children,
  className,
  as = 'div',
}: {
  children: ReactNode
  className?: string
  as?: 'div' | 'li'
}) {
  const Comp = motion[as]
  return (
    <Comp className={className} variants={fadeUp}>
      {children}
    </Comp>
  )
}

/** Одиночное появление при скролле. */
export function FadeIn({ children, className, delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-8% 0px' }}
      transition={{ duration: 0.8, ease: EASE, delay }}
    >
      {children}
    </motion.div>
  )
}
