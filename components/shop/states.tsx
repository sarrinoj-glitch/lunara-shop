'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { t } from '@/lib/i18n'
import { ProductCardSkeleton } from './product-card'

export function ErrorState({ reset, digest }: { reset: () => void; digest?: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center gap-5 px-6 py-24 text-center" role="alert">
      <div className="arch grid h-36 w-24 place-items-center bg-sand">
        <span className="accent-serif text-5xl text-terracotta">!</span>
      </div>
      <h1 className="display text-3xl">{t.common.errorTitle}</h1>
      <p className="text-muted-foreground">{t.common.errorText}</p>
      <Button onClick={reset} className="rounded-full px-8">
        {t.common.retry}
      </Button>
      {digest ? (
        <button
          type="button"
          className="text-xs text-muted-foreground underline-offset-4 hover:underline"
          onClick={() => {
            navigator.clipboard?.writeText(digest).then(() => setCopied(true))
          }}
          title={t.common.copy}
        >
          {t.common.errorCode}: {digest} {copied ? '✓' : ''}
        </button>
      ) : null}
    </div>
  )
}

export function EmptyState({ title, text, cta }: { title: string; text: string; cta?: { label: string; href: string } }) {
  return (
    <div className="flex flex-col items-center gap-4 px-6 py-20 text-center">
      <div className="arch grid h-36 w-24 place-items-center bg-sand">
        <span className="accent-serif text-5xl text-terracotta">А</span>
      </div>
      <p className="display text-2xl md:text-3xl">{title}</p>
      <p className="max-w-md text-muted-foreground">{text}</p>
      {cta ? (
        <Button asChild variant="outline" className="rounded-full border-espresso px-8">
          <Link href={cta.href}>{cta.label}</Link>
        </Button>
      ) : null}
    </div>
  )
}

export function GridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-8 md:grid-cols-3 md:gap-x-6 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  )
}
