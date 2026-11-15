'use client'

import { animate } from 'motion'

/**
 * «Полёт» миниатюры товара в иконку корзины.
 * Источник — элемент с фото, цель — [data-cart-target].
 */
export function flyToCart(source: HTMLElement | null, imageSrc: string | null) {
  if (!source || !imageSrc) return
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  const target = document.querySelector<HTMLElement>('[data-cart-target]')
  if (!target) return

  const from = source.getBoundingClientRect()
  const to = target.getBoundingClientRect()
  const size = Math.min(from.width, 140)

  const ghost = document.createElement('img')
  ghost.src = imageSrc
  ghost.alt = ''
  Object.assign(ghost.style, {
    position: 'fixed',
    left: `${from.left + from.width / 2 - size / 2}px`,
    top: `${from.top + from.height / 2 - size / 2}px`,
    width: `${size}px`,
    height: `${size}px`,
    objectFit: 'contain',
    borderRadius: '999px 999px 0 0',
    background: 'var(--sand)',
    zIndex: '100',
    pointerEvents: 'none',
    mixBlendMode: 'multiply',
  })
  document.body.appendChild(ghost)

  const dx = to.left + to.width / 2 - (from.left + from.width / 2)
  const dy = to.top + to.height / 2 - (from.top + from.height / 2)

  animate(
    ghost,
    { x: [0, dx * 0.6, dx], y: [0, dy - 120, dy], scale: [1, 0.6, 0.12], opacity: [1, 1, 0.4] },
    { duration: 0.8, ease: [0.22, 1, 0.36, 1] },
  ).then(() => ghost.remove())
}
