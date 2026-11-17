import 'server-only'
import { InlineKeyboard, Keyboard } from 'grammy'
import { formatPrice } from '@/lib/format'
import { storageUrl, publicEnv } from '@/lib/public-env'
import { B } from './texts'
import type { BotProduct } from './repo'
import type { Draft } from './session'

export const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

export const mainMenu = new Keyboard()
  .text(B.menu.add)
  .text(B.menu.products)
  .row()
  .text(B.menu.orders)
  .text(B.menu.help)
  .resized()
  .persistent()

export const productUrl = (slug: string) => `${publicEnv.siteUrl}/product/${slug}`

export function productCaption(p: BotProduct) {
  const lines = [
    `<b>${esc(p.name)}</b>`,
    p.old_price ? `${formatPrice(p.price)}  <s>${formatPrice(p.old_price)}</s>` : formatPrice(p.price),
    [p.category?.name, p.aroma, p.volume].filter(Boolean).map((x) => esc(String(x))).join(' · '),
    '',
    `${B.card.statuses[p.status] ?? p.status} · ${p.in_stock ? 'в наличии' : 'нет в наличии'} · фото: ${p.images.length}`,
  ]
  return lines.filter((l) => l !== undefined).join('\n')
}

export function productKeyboard(p: BotProduct) {
  const kb = new InlineKeyboard()
    .text(B.card.price, `p:price:${p.id}`)
    .text(B.card.discount, `p:disc:${p.id}`)
    .row()
    .text(B.card.photos, `p:photo:${p.id}`)
    .text(B.card.name, `p:name:${p.id}`)
    .text(B.card.description, `p:desc:${p.id}`)
    .row()
    .text(p.in_stock ? B.card.outOfStock : B.card.inStock, `p:stock:${p.id}`)
    .row()
  if (p.status === 'draft') kb.text(B.card.publish, `p:pub:${p.id}`)
  else kb.text(p.status === 'hidden' ? B.card.show : B.card.hide, `p:vis:${p.id}`)
  kb.row().text(B.card.hit(p.is_hit), `p:hit:${p.id}`).text(B.card.isNew(p.is_new), `p:new:${p.id}`).row()
  // Telegram отклоняет кнопки-ссылки на localhost — в локальном режиме кнопки нет
  if (p.status === 'published' && publicEnv.siteUrl.startsWith('https://')) kb.url(B.card.open, productUrl(p.slug))
  kb.text(B.card.remove, `p:del:${p.id}`)
  return kb
}

export function productPhotoUrl(p: BotProduct) {
  return p.images[0] ? storageUrl(p.images[0].path) : null
}

export function draftCaption(d: Draft, categoryName?: string) {
  return [
    `<b>${esc(d.name ?? '')}</b>`,
    d.oldPrice ? `${formatPrice(d.price)}  <s>${formatPrice(d.oldPrice)}</s>` : formatPrice(d.price),
    [categoryName, d.aroma, d.volume].filter(Boolean).map((x) => esc(String(x))).join(' · '),
    d.description ? `\n${esc(d.description.slice(0, 600))}${d.description.length > 600 ? '…' : ''}` : '',
    `\n📷 фото: ${d.photos?.length ?? 0}`,
  ]
    .filter(Boolean)
    .join('\n')
}

export const previewKeyboard = new InlineKeyboard()
  .text(B.add.publish, 'a:pub')
  .row()
  .text(B.add.toDraft, 'a:draft')
  .text(B.add.fix, 'a:fix')
  .row()
  .text(B.cancel, 'a:cancel')

export const fixKeyboard = new InlineKeyboard()
  .text('Название', 'a:fix:name')
  .text('Цена', 'a:fix:price')
  .row()
  .text('Скидка', 'a:fix:old_price')
  .text('Категория', 'a:fix:category')
  .row()
  .text('Аромат', 'a:fix:aroma')
  .text('Объём', 'a:fix:volume')
  .row()
  .text('Описание', 'a:fix:description')
  .text('Фото', 'a:fix:photos')

type OrderFull = {
  id: string
  number: number
  customer_name: string
  customer_phone: string
  city: string
  comment: string | null
  total: number
  status: string
  items: { name_snapshot: string; price_snapshot: number; quantity: number }[]
}

export function orderText(o: OrderFull, isNew = false) {
  const lines = [
    isNew ? B.orders.newOrder : '',
    `<b>Заказ №${o.number}</b> · ${B.orders.statuses[o.status] ?? o.status}`,
    '',
    ...o.items.map((i, idx) => `${idx + 1}. ${esc(i.name_snapshot)} × ${i.quantity} — ${formatPrice(Number(i.price_snapshot) * i.quantity)}`),
    '',
    `<b>Итого: ${formatPrice(o.total)}</b>`,
    `👤 ${esc(o.customer_name)}`,
    `📞 ${esc(o.customer_phone)}`,
    `📍 ${esc(o.city)}`,
    o.comment ? `💬 ${esc(o.comment)}` : '',
  ]
  return lines.filter((l, i) => l !== '' || (i > 0 && i < lines.length - 1)).join('\n').trim()
}

export function orderKeyboard(o: { id: string; customer_phone: string; number: number }) {
  const phone = o.customer_phone.replace(/\D/g, '')
  const hello = encodeURIComponent(`Здравствуйте! Это магазин LUNARA, по вашему заказу №${o.number} 🌿`)
  return new InlineKeyboard()
    .url(B.orders.write, `https://wa.me/${phone}?text=${hello}`)
    .row()
    .text(B.orders.inWork, `o:s:in_work:${o.id}`)
    .text(B.orders.done, `o:s:done:${o.id}`)
    .row()
    .text(B.orders.cancel, `o:s:cancelled:${o.id}`)
}
