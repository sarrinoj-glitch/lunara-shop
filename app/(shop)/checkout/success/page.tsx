import type { Metadata } from 'next'
import { Suspense } from 'react'
import { t } from '@/lib/i18n'
import { SuccessView } from './success-view'

export const metadata: Metadata = { title: t.checkout.title, robots: { index: false } }

/** ?n и ?auto читаются в браузере — страница статична (работает и на GitHub Pages). */
export default function SuccessPage() {
  return (
    <Suspense fallback={<div className="mx-auto mt-20 h-80 max-w-xl animate-pulse bg-sand" />}>
      <SuccessView />
    </Suspense>
  )
}
