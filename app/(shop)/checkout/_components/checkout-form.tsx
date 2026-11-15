'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { ProductImage } from '@/components/shop/product-image'
import { EmptyState } from '@/components/shop/states'
import { useHydrated } from '@/hooks/use-client-state'
import { WhatsappIcon } from '@/components/shop/whatsapp-icon'
import { customerSchema, type CustomerInput } from '@/lib/schemas/order'
import { cartTotal, useCart } from '@/lib/cart/store'
import { formatPrice } from '@/lib/format'
import { t } from '@/lib/i18n'
import { createOrderAction, refreshCartAction } from '@/app/(shop)/checkout/actions'
import { E } from '@/lib/errors'

/** +7 (999) 123-45-67 */
function maskPhoneInput(raw: string) {
  let d = raw.replace(/\D/g, '')
  if (d.startsWith('8')) d = `7${d.slice(1)}`
  if (!d.startsWith('7')) d = `7${d}`
  d = d.slice(0, 11)
  const p = d.slice(1)
  let out = '+7'
  if (p.length > 0) out += ` (${p.slice(0, 3)}`
  if (p.length >= 3) out += ')'
  if (p.length > 3) out += ` ${p.slice(3, 6)}`
  if (p.length > 6) out += `-${p.slice(6, 8)}`
  if (p.length > 8) out += `-${p.slice(8, 10)}`
  return out
}

function FieldError({ msg, id }: { msg?: string; id: string }) {
  return msg ? (
    <p id={id} className="mt-1.5 text-xs text-destructive" role="alert">
      {msg}
    </p>
  ) : null
}

export function CheckoutForm() {
  const router = useRouter()
  const { items, sync, clear } = useCart()
  const mounted = useHydrated()
  const [idempotencyKey] = useState(() => crypto.randomUUID())
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (items.length === 0) return
    refreshCartAction(items.map((i) => i.productId)).then((r) => r.ok && sync(r.data))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const available = useMemo(() => items.filter((i) => !i.unavailable), [items])
  const total = cartTotal(items)

  const form = useForm<CustomerInput>({
    resolver: zodResolver(customerSchema),
    defaultValues: { name: '', phone: '', city: '', comment: '', consent: undefined as unknown as true },
    mode: 'onTouched',
  })
  const { register, handleSubmit, formState, setValue, watch } = form
  const errors = formState.errors

  if (!mounted) {
    return <div className="mt-10 h-96 animate-pulse bg-sand" aria-busy="true" />
  }

  if (available.length === 0) {
    return <EmptyState title={t.checkout.emptyTitle} text={t.checkout.emptyText} cta={{ label: t.common.allProducts, href: '/catalog' }} />
  }

  const onSubmit = handleSubmit(async (values) => {
    setSubmitting(true)
    const desktop = window.matchMedia('(hover: hover) and (pointer: fine)').matches
    // На десктопе открываем вкладку сразу (жест пользователя) — иначе её заблокирует браузер
    const popup = desktop ? window.open('about:blank', '_blank') : null

    const res = await createOrderAction({
      idempotencyKey,
      customer: values,
      items: available.map((i) => ({ productId: i.productId, qty: i.qty })),
    })
    setSubmitting(false)

    if (!res.ok) {
      popup?.close()
      if (res.error.code === E.UNAVAILABLE_ITEMS) {
        const ids = (res.error.details as { productIds?: string[] })?.productIds ?? []
        sync(items.map((i) => ({ productId: i.productId, price: i.price, available: !ids.includes(i.productId) })))
        toast.error(t.checkout.errors.unavailable)
      } else if (res.error.code === E.RATE_LIMIT) {
        toast.error(t.checkout.errors.rateLimit)
      } else {
        toast.error(t.checkout.errors.server, { description: res.error.traceId ? `${t.common.errorCode}: ${res.error.traceId.slice(0, 8)}` : undefined })
      }
      return
    }

    try {
      sessionStorage.setItem('lunara-last-order', JSON.stringify({ n: res.data.number, url: res.data.whatsappUrl }))
    } catch {
      /* приватный режим */
    }
    clear()
    if (popup) {
      popup.location.href = res.data.whatsappUrl
      router.push(`/checkout/success?n=${res.data.number}`)
    } else {
      router.push(`/checkout/success?n=${res.data.number}&auto=1`)
    }
  })

  const consent = watch('consent')

  return (
    <div className="mt-10 grid gap-10 lg:grid-cols-[1.2fr_1fr] lg:gap-16">
      <form onSubmit={onSubmit} noValidate className="order-2 space-y-6 lg:order-1">
        <div>
          <Label htmlFor="name" className="text-xs uppercase tracking-[0.18em]">{t.checkout.name}</Label>
          <Input id="name" autoComplete="name" {...register('name')} aria-invalid={!!errors.name} aria-describedby="name-err" className="mt-2 h-12 rounded-none border-0 border-b border-espresso/40 bg-transparent px-0 text-base shadow-none focus-visible:border-terracotta focus-visible:ring-0" />
          <FieldError id="name-err" msg={errors.name?.message} />
        </div>
        <div>
          <Label htmlFor="phone" className="text-xs uppercase tracking-[0.18em]">{t.checkout.phone}</Label>
          <Input
            id="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="+7 (999) 123-45-67"
            {...register('phone', {
              onChange: (e) => setValue('phone', maskPhoneInput(e.target.value), { shouldValidate: Boolean(formState.errors.phone) }),
            })}
            aria-invalid={!!errors.phone}
            aria-describedby="phone-err"
            className="mt-2 h-12 rounded-none border-0 border-b border-espresso/40 bg-transparent px-0 text-base shadow-none focus-visible:border-terracotta focus-visible:ring-0"
          />
          <FieldError id="phone-err" msg={errors.phone?.message} />
        </div>
        <div>
          <Label htmlFor="city" className="text-xs uppercase tracking-[0.18em]">{t.checkout.city}</Label>
          <Input id="city" autoComplete="address-level2" {...register('city')} aria-invalid={!!errors.city} aria-describedby="city-err" className="mt-2 h-12 rounded-none border-0 border-b border-espresso/40 bg-transparent px-0 text-base shadow-none focus-visible:border-terracotta focus-visible:ring-0" />
          <FieldError id="city-err" msg={errors.city?.message} />
        </div>
        <div>
          <Label htmlFor="comment" className="text-xs uppercase tracking-[0.18em]">{t.checkout.comment}</Label>
          <Textarea id="comment" rows={3} placeholder={t.checkout.commentPlaceholder} {...register('comment')} aria-describedby="comment-err" className="mt-2 rounded-none border-espresso/30 bg-transparent text-base shadow-none focus-visible:border-terracotta focus-visible:ring-0" />
          <FieldError id="comment-err" msg={errors.comment?.message} />
        </div>
        <div>
          <label className="flex cursor-pointer items-start gap-3 text-sm">
            <Checkbox
              checked={consent === true}
              onCheckedChange={(v) => setValue('consent', (v === true) as true, { shouldValidate: true })}
              aria-invalid={!!errors.consent}
              aria-describedby="consent-err"
              className="mt-0.5 rounded-none border-espresso data-[state=checked]:border-terracotta data-[state=checked]:bg-terracotta"
            />
            <span>
              {t.checkout.consent} (<Link href="/privacy" className="underline underline-offset-4 hover:text-terracotta">{t.footer.privacy.toLowerCase()}</Link>)
            </span>
          </label>
          <FieldError id="consent-err" msg={errors.consent?.message} />
        </div>
        <Button type="submit" size="lg" disabled={submitting} className="h-14 w-full gap-3 rounded-full text-xs uppercase tracking-[0.2em]">
          {submitting ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <WhatsappIcon className="size-5" />}
          {submitting ? t.checkout.submitting : `${t.checkout.submit} · ${formatPrice(total)}`}
        </Button>
      </form>

      <aside className="order-1 h-fit bg-ivory p-5 md:p-8 lg:sticky lg:top-24 lg:order-2" aria-label={t.checkout.yourOrder}>
        <p className="mb-4 text-xs uppercase tracking-[0.2em]">{t.checkout.yourOrder}</p>
        <ul className="divide-y divide-line">
          {items.map((i) => (
            <li key={i.productId} className="flex items-center gap-4 py-3">
              <ProductImage src={i.image} alt={i.name} sizes="56px" className="size-14 shrink-0" imgClassName="p-1" />
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-sm">{i.name}</p>
                <p className="text-xs text-muted-foreground">
                  {i.unavailable ? <span className="text-destructive">{t.cart.unavailable}</span> : `× ${i.qty}`}
                </p>
              </div>
              <span className="text-sm">{i.unavailable ? '—' : formatPrice(i.price * i.qty)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex items-baseline justify-between border-t border-line pt-4">
          <span className="text-xs uppercase tracking-[0.2em]">{t.cart.total}</span>
          <span className="text-2xl font-light">{formatPrice(total)}</span>
        </div>
      </aside>
    </div>
  )
}
