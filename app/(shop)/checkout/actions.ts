'use server'

import { headers } from 'next/headers'
import { createOrderSchema, type CreateOrderInput } from '@/lib/schemas/order'
import { createOrder } from '@/lib/orders/create'
import { AppError, E, type ActionResult } from '@/lib/errors'
import { rateLimit } from '@/lib/rate-limit'
import { logger } from '@/lib/logger'
import { createPublicClient } from '@/lib/supabase/server'
import { isDemo } from '@/lib/env'
import { getAllProducts } from '@/lib/catalog/queries'

export async function createOrderAction(
  input: CreateOrderInput,
): Promise<ActionResult<{ number: number; total: number; whatsappUrl: string }>> {
  const traceId = crypto.randomUUID()
  const parsed = createOrderSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: { code: E.VALIDATION, message: 'Проверьте поля формы', traceId, details: parsed.error.flatten() } }
  }

  const h = await headers()
  const ip = h.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'local'
  if (!rateLimit(`order:${ip}`, 5, 10 * 60_000)) {
    return { ok: false, error: { code: E.RATE_LIMIT, message: 'Слишком много попыток', traceId } }
  }

  logger.info({ traceId, action: 'order.create.start', items: parsed.data.items.length }, 'in')
  try {
    const data = await createOrder(parsed.data, { traceId })
    return { ok: true, data }
  } catch (e) {
    if (e instanceof AppError) return { ok: false, error: { code: e.code, message: e.message, traceId, details: e.details } }
    logger.error({ traceId, code: E.DATASOURCE_DOWN, err: String(e) }, 'order.create failed')
    return { ok: false, error: { code: E.DATASOURCE_DOWN, message: 'Сервис временно недоступен', traceId } }
  }
}

/** Сверка корзины с актуальными ценами и наличием. */
export async function refreshCartAction(
  productIds: string[],
): Promise<ActionResult<{ productId: string; price: number; available: boolean }[]>> {
  const ids = productIds.filter((id) => /^[0-9a-f-]{36}$/i.test(id)).slice(0, 50)
  if (ids.length === 0) return { ok: true, data: [] }
  if (isDemo) {
    const all = await getAllProducts()
    return {
      ok: true,
      data: ids.map((id) => {
        const p = all.find((x) => x.id === id)
        return { productId: id, price: p?.price ?? 0, available: Boolean(p?.inStock) }
      }),
    }
  }
  const { data, error } = await createPublicClient().from('products').select('id, price, in_stock').in('id', ids)
  if (error) return { ok: false, error: { code: E.DATASOURCE_DOWN, message: 'Не удалось обновить корзину' } }
  return {
    ok: true,
    data: ids.map((id) => {
      const p = data?.find((x) => x.id === id)
      return { productId: id, price: p ? Number(p.price) : 0, available: Boolean(p?.in_stock) }
    }),
  }
}
