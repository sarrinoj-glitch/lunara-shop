import 'server-only'
import { createAdminClient } from '@/lib/supabase/server'
import { AppError, E } from '@/lib/errors'
import { logger } from '@/lib/logger'
import { maskPhone } from '@/lib/security/mask'
import { waLink } from '@/lib/site-config'
import { env, isDemo } from '@/lib/env'
import { demoProducts } from '@/lib/catalog/demo-source'
import { buildWhatsappText } from './whatsapp-text'
import { notifyOwnerAboutOrder } from '@/lib/bot/notify'
import type { z } from 'zod'
import type { createOrderSchema } from '@/lib/schemas/order'

type Input = z.output<typeof createOrderSchema>

/**
 * Демо-режим (без Supabase): заказ не сохраняется, цены берутся из стартового каталога,
 * номер — из времени. Покупательница всё равно попадает в WhatsApp с полным текстом заказа.
 */
function createDemoOrder(input: Input, ctx: { traceId: string }) {
  const lines = input.items.map((i) => {
    const p = demoProducts.find((x) => x.id === i.productId)
    if (!p || !p.inStock) return null
    return { name: p.name, qty: i.qty, price: p.price }
  })
  const unavailable = input.items.filter((_, idx) => lines[idx] === null).map((i) => i.productId)
  if (unavailable.length) throw new AppError(E.UNAVAILABLE_ITEMS, 'Некоторые товары недоступны', { productIds: unavailable })

  const items = lines.filter((l): l is NonNullable<typeof l> => l !== null)
  const total = items.reduce((s, i) => s + i.price * i.qty, 0)
  const number = 1000 + (Math.floor(Date.now() / 1000) % 9000)
  logger.info({ traceId: ctx.traceId, action: 'order.created.demo', number, phone: maskPhone(input.customer.phone) }, 'order')
  const text = buildWhatsappText({ number, total, name: input.customer.name, city: input.customer.city, comment: input.customer.comment, items })
  return { number, total, whatsappUrl: waLink(text, env.NEXT_PUBLIC_WHATSAPP_NUMBER) }
}

export async function createOrder(input: Input, ctx: { traceId: string }) {
  if (isDemo) return createDemoOrder(input, ctx)
  const supabase = createAdminClient()

  const { data, error } = await supabase.rpc('create_order', {
    p_idempotency_key: input.idempotencyKey,
    p_name: input.customer.name,
    p_phone: `+${input.customer.phone}`,
    p_city: input.customer.city,
    p_comment: input.customer.comment ?? '',
    p_items: input.items.map((i) => ({ product_id: i.productId, quantity: i.qty })),
  })

  if (error) {
    if (error.message.startsWith('UNAVAILABLE:')) {
      const ids = error.message.replace('UNAVAILABLE:', '').split(',')
      throw new AppError(E.UNAVAILABLE_ITEMS, 'Некоторые товары недоступны', { productIds: ids })
    }
    logger.error({ traceId: ctx.traceId, code: E.DATASOURCE_DOWN, err: error.message }, 'create_order failed')
    throw new AppError(E.DATASOURCE_DOWN, 'Не удалось сохранить заказ')
  }

  const row = data?.[0]
  if (!row) throw new AppError(E.DATASOURCE_DOWN, 'Не удалось сохранить заказ')

  const { data: items } = await supabase
    .from('order_items')
    .select('name_snapshot, price_snapshot, quantity')
    .eq('order_id', row.order_id)

  const text = buildWhatsappText({
    number: row.order_number,
    total: Number(row.order_total),
    name: input.customer.name,
    city: input.customer.city,
    comment: input.customer.comment,
    items: (items ?? []).map((i) => ({ name: i.name_snapshot, qty: i.quantity, price: Number(i.price_snapshot) })),
  })

  logger.info(
    { traceId: ctx.traceId, action: 'order.created', number: row.order_number, phone: maskPhone(input.customer.phone), created: row.created },
    'order',
  )

  if (row.created) {
    // Уведомление владелице — не блокирует и не роняет заказ
    notifyOwnerAboutOrder(row.order_id).catch((err) =>
      logger.warn({ traceId: ctx.traceId, err: String(err) }, 'telegram notify failed'),
    )
  }

  return {
    number: row.order_number,
    total: Number(row.order_total),
    whatsappUrl: waLink(text, env.NEXT_PUBLIC_WHATSAPP_NUMBER),
  }
}
