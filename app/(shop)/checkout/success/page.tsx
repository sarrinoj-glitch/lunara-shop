import type { Metadata } from 'next'
import { Suspense } from 'react'
import { t } from '@/lib/i18n'
import { SuccessView } from './success-view'

export const metadata: Metadata = { title: t.checkout.title, robots: { index: false } }

async function Content({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams
  const n = typeof sp.n === 'string' && /^\d{1,9}$/.test(sp.n) ? Number(sp.n) : null
  return <SuccessView number={n} auto={sp.auto === '1'} />
}

export default function SuccessPage({ searchParams }: PageProps<'/checkout/success'>) {
  return (
    <Suspense fallback={<div className="mx-auto mt-20 h-80 max-w-xl animate-pulse bg-sand" />}>
      <Content searchParams={searchParams} />
    </Suspense>
  )
}
