import type { Metadata } from 'next'
import { t } from '@/lib/i18n'

export const metadata: Metadata = { title: t.privacy.title }

export default function PrivacyPage() {
  return (
    <article className="mx-auto max-w-2xl px-4 py-16 md:py-24">
      <h1 className="display text-4xl md:text-6xl">{t.privacy.title}</h1>
      <p className="mt-8 leading-relaxed text-espresso/85">{t.privacy.text}</p>
    </article>
  )
}
