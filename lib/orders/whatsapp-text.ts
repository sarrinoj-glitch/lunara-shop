import { formatPrice } from '@/lib/format'
import { fmt, t } from '@/lib/i18n'
import { siteConfig } from '@/lib/site-config'

export type OrderForText = {
  number: number
  total: number
  name: string
  city: string
  comment?: string | null
  items: { name: string; qty: number; price: number }[]
}

/** Готовый текст заказа для wa.me. */
export function buildWhatsappText(o: OrderForText) {
  const lines = [
    fmt(t.checkout.waGreeting, { n: o.number, shop: siteConfig.name }),
    '',
    ...o.items.map((i, idx) => `${idx + 1}. ${i.name} × ${i.qty} — ${formatPrice(i.price * i.qty)}`),
    '',
    fmt(t.checkout.waTotal, { total: formatPrice(o.total) }),
    fmt(t.checkout.waCustomer, { name: o.name, city: o.city }),
  ]
  if (o.comment) lines.push(fmt(t.checkout.waComment, { comment: o.comment }))
  return lines.join('\n')
}
