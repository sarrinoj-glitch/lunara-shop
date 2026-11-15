import type { Metadata } from 'next'
import { t } from '@/lib/i18n'
import { CheckoutForm } from './_components/checkout-form'

export const metadata: Metadata = { title: t.checkout.title, robots: { index: false } }

export default function CheckoutPage() {
  return (
    <div className="mx-auto max-w-[1200px] px-4 pb-10 pt-8 md:px-8 md:pt-14">
      <h1 className="display text-[13vw] leading-[0.85] md:text-8xl">{t.checkout.title}</h1>
      <p className="mt-4 max-w-xl text-muted-foreground">{t.checkout.subtitle}</p>
      <CheckoutForm />
    </div>
  )
}
