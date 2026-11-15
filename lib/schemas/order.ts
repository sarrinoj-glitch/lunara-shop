import { z } from 'zod'
import { t } from '@/lib/i18n'

/** Нормализует российский номер к виду 7XXXXXXXXXX. */
export function normalizePhone(raw: string) {
  let d = raw.replace(/\D/g, '')
  if (d.length === 11 && d.startsWith('8')) d = `7${d.slice(1)}`
  if (d.length === 10) d = `7${d}`
  return d
}

export const customerSchema = z.object({
  name: z.string().trim().min(2, t.checkout.errors.name).max(60, t.checkout.errors.name),
  phone: z
    .string()
    .transform(normalizePhone)
    .refine((v) => /^7\d{10}$/.test(v), t.checkout.errors.phone),
  city: z.string().trim().min(2, t.checkout.errors.city).max(80, t.checkout.errors.city),
  comment: z.string().trim().max(500, t.checkout.errors.comment).optional().default(''),
  consent: z.literal(true, { error: t.checkout.errors.consent }),
})

export const createOrderSchema = z.object({
  idempotencyKey: z.string().uuid(),
  customer: customerSchema,
  items: z
    .array(z.object({ productId: z.string().uuid(), qty: z.number().int().min(1).max(99) }))
    .min(1)
    .max(50),
})

export type CustomerInput = z.input<typeof customerSchema>
export type CreateOrderInput = z.input<typeof createOrderSchema>
