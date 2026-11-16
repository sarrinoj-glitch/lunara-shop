'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { siteConfig } from '@/lib/site-config'
import { t } from '@/lib/i18n'
import { EASE } from './motion-provider'

const KEY = 'lunara-intro'

/**
 * Интро при первом заходе за сессию: монограмма «L» рисуется линией,
 * буквы LUNARA появляются по одной, терракотовая шторка уезжает вверх.
 * Оверлей рендерится на сервере; inline-скрипт в layout ставит html[data-intro="done"]
 * для повторных заходов (CSS прячет оверлей до гидрации). Без JS оверлей сам
 * исчезает CSS-анимацией через 2.6 с.
 */
export function Intro() {
  const reduce = useReducedMotion()
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    let seen = false
    try {
      seen = sessionStorage.getItem(KEY) === '1'
      sessionStorage.setItem(KEY, '1')
    } catch {
      /* приватный режим */
    }
    if (seen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- одноразовое решение по внешнему хранилищу
      setVisible(false)
      return
    }
    const id = setTimeout(() => setVisible(false), reduce ? 300 : 1900)
    return () => clearTimeout(id)
  }, [reduce])

  const letters = siteConfig.name.split('')

  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          key="intro"
          data-intro-overlay
          aria-hidden
          className="grain fixed inset-0 z-[200] grid place-items-center bg-terracotta text-ivory"
          exit={{ y: '-100%', transition: { duration: 0.9, ease: EASE } }}
        >
          <div className="relative z-[2] flex flex-col items-center gap-6">
            <svg viewBox="0 0 80 110" className="h-24 w-auto md:h-28" fill="none" stroke="currentColor" strokeWidth="1.2">
              {/* арка-рамка */}
              <motion.path
                d="M8 106 V44 A32 32 0 0 1 72 44 V106 Z"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.55 }}
                transition={{ duration: 1.1, ease: EASE }}
              />
              {/* монограмма L */}
              <motion.path
                d="M32 34 V84 H54"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.8, ease: EASE, delay: 0.35 }}
              />
            </svg>
            <div className="flex overflow-hidden text-3xl font-light tracking-[0.5em] md:text-4xl">
              {letters.map((ch, i) => (
                <motion.span
                  key={i}
                  initial={{ y: '110%' }}
                  animate={{ y: '0%' }}
                  transition={{ duration: 0.7, ease: EASE, delay: 0.6 + i * 0.06 }}
                >
                  {ch}
                </motion.span>
              ))}
            </div>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.8 }}
              transition={{ delay: 1.1 }}
              className="accent-serif text-lg"
            >
              {t.intro.tagline}
            </motion.p>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}

/** Скрипт до гидрации: повторный заход за сессию — оверлей не показываем вовсе. */
export const introScript = `try{if(sessionStorage.getItem('${KEY}')==='1')document.documentElement.dataset.intro='done'}catch(e){}`
