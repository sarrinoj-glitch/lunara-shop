import Image from 'next/image'
import { cn } from '@/lib/utils'

/**
 * Фото товара на песочной подложке. Packshot'ы с белым фоном «садятся»
 * через mix-blend-multiply — белый исчезает, остаётся только флакон.
 */
export function ProductImage({
  src,
  alt,
  sizes,
  priority,
  className,
  imgClassName,
}: {
  src: string | null | undefined
  alt: string
  sizes: string
  priority?: boolean
  className?: string
  imgClassName?: string
}) {
  return (
    <div className={cn('relative overflow-hidden bg-sand', className)}>
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          className={cn('object-contain mix-blend-multiply', imgClassName)}
        />
      ) : (
        <div className="absolute inset-0 grid place-items-center">
          <span className="accent-serif text-6xl text-brown/30" aria-hidden>
            L
          </span>
        </div>
      )}
    </div>
  )
}
