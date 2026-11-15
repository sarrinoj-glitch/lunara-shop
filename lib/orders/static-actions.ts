'use client'

/**
 * Статическая версия actions для GitHub Pages (нет сервера).
 * Подменяет app/(shop)/checkout/actions.ts через resolveAlias в next.config.ts
 * при NEXT_PUBLIC_STATIC_EXPORT=1. Сигнатуры совпадают с серверными.
 * Заказ не сохраняется: текст собирается из корзины и уходит в WhatsApp.
 */
import { createOrderSchema, type CreateOrderInput } from '@/lib/schemas/order'
import { E, type ActionResult } from '@/lib/errors'
import { buildWhatsappText } from '@/lib/orders/whatsapp-text'
import { useCart } from '@/lib/cart/store'
import { waLink } from '@/lib/site-config'

export async function createOrderAction(
  input: CreateOrderInput,
): Promise<ActionResult<{ number: number; total: number; whatsappUrl: string }>> {
  const parsed = createOrderSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: { code: E.VALIDATION, message: 'Проверьте поля формы', details: parsed.error.flatten() } }
  }
  const cart = useCart.getState().items
  const items = parsed.data.items
    .map((i) => {
      const c = cart.find((x) => x.productId === i.productId)
      return c ? { name: c.name, qty: i.qty, price: c.price } : null
    })
    .filter((x): x is NonNullable<typeof x> => x !== null)

  const total = items.reduce((s, i) => s + i.price * i.qty, 0)
  const number = 1000 + (Math.floor(Date.now() / 1000) % 9000)
  const text = buildWhatsappText({
    number,
    total,
    name: parsed.data.customer.name,
    city: parsed.data.customer.city,
    comment: parsed.data.customer.comment,
    items,
  })
  return { ok: true, data: { number, total, whatsappUrl: waLink(text) } }
}

/** В статической сборке цены не меняются между загрузками — всё актуально. */
export async function refreshCartAction(
  productIds: string[],
): Promise<ActionResult<{ productId: string; price: number; available: boolean }[]>> {
  const cart = useCart.getState().items
  return {
    ok: true,
    data: productIds.map((id) => ({ productId: id, price: cart.find((c) => c.productId === id)?.price ?? 0, available: true })),
  }
}
