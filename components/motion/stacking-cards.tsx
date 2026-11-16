'use client'

// Основа — 21st.dev «Stacking Cards» (danielpetho / Khoa Phan, https://www.pldkhoa.dev).
// Карточки закрепляются и уменьшаются, ложась стопкой при прокрутке страницы.
import { createContext, useContext, useRef, type HTMLAttributes, type PropsWithChildren } from 'react'
import { motion, useScroll, useTransform, type MotionValue, type UseScrollOptions } from 'motion/react'
import { cn } from '@/lib/utils'

const StackingCardsContext = createContext<{ progress: MotionValue<number>; scaleMultiplier?: number; totalCards: number } | null>(null)

function useStackingCardsContext() {
  const ctx = useContext(StackingCardsContext)
  if (!ctx) throw new Error('StackingCardItem must be used within StackingCards')
  return ctx
}

export default function StackingCards({
  children,
  className,
  scrollOptions,
  scaleMultiplier,
  totalCards,
  ...props
}: PropsWithChildren & HTMLAttributes<HTMLDivElement> & { scrollOptions?: UseScrollOptions; scaleMultiplier?: number; totalCards: number }) {
  const targetRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ offset: ['start start', 'end end'], ...scrollOptions, target: targetRef })
  return (
    <StackingCardsContext.Provider value={{ progress: scrollYProgress, scaleMultiplier, totalCards }}>
      <div className={cn(className)} ref={targetRef} {...props}>
        {children}
      </div>
    </StackingCardsContext.Provider>
  )
}

export function StackingCardItem({ index, topPosition, className, children, ...props }: HTMLAttributes<HTMLDivElement> & PropsWithChildren & { index: number; topPosition?: string }) {
  const { progress, scaleMultiplier, totalCards } = useStackingCardsContext()
  const scaleTo = 1 - (totalCards - index) * (scaleMultiplier ?? 0.03)
  const scale = useTransform(progress, [index * (1 / totalCards), 1], [1, scaleTo])
  const top = topPosition ?? `${5 + index * 3}%`
  return (
    <div className={cn('sticky top-0 h-full', className)} {...props}>
      <motion.div className="relative h-full origin-top" style={{ top, scale }}>
        {children}
      </motion.div>
    </div>
  )
}
