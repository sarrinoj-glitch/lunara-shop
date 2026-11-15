'use client'

import { useSyncExternalStore } from 'react'

const noop = () => () => {}

/** true только на клиенте после гидратации (без setState в эффекте). */
export function useHydrated() {
  return useSyncExternalStore(
    noop,
    () => true,
    () => false,
  )
}

/** Подписка на media query; на сервере — false. */
export function useMediaQuery(query: string) {
  return useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia(query)
      mq.addEventListener('change', cb)
      return () => mq.removeEventListener('change', cb)
    },
    () => window.matchMedia(query).matches,
    () => false,
  )
}

export const HOVER_QUERY = '(hover: hover) and (pointer: fine)'

/** Значение из sessionStorage (строка) — стабильный snapshot. */
export function useSessionValue(key: string) {
  return useSyncExternalStore(
    noop,
    () => {
      try {
        return sessionStorage.getItem(key)
      } catch {
        return null
      }
    },
    () => null,
  )
}
