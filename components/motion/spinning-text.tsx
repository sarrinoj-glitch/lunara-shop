import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

/** Текст по кругу, медленно вращается; в центре — иконка. Чистый CSS (server-safe). */
export function SpinningText({
  text,
  size = 112,
  className,
  children,
}: {
  text: string
  size?: number
  className?: string
  children?: ReactNode
}) {
  const id = `circle-${text.length}-${size}`
  const r = size / 2 - 10
  return (
    <span className={cn('relative inline-grid place-items-center', className)} style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} className="absolute inset-0 animate-spin-slow" aria-hidden>
        <defs>
          <path id={id} d={`M ${size / 2},${size / 2} m -${r},0 a ${r},${r} 0 1,1 ${r * 2},0 a ${r},${r} 0 1,1 -${r * 2},0`} />
        </defs>
        <text className="fill-current text-[9.5px] font-medium uppercase tracking-[0.22em]">
          <textPath href={`#${id}`} startOffset="0">
            {text.repeat(2)}
          </textPath>
        </text>
      </svg>
      <span className="relative">{children}</span>
    </span>
  )
}
