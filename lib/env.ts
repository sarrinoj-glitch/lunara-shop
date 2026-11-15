import 'server-only'
import { z } from 'zod'

// Пустая строка в .env = «не задано»
const optional = <T extends z.ZodTypeAny>(s: T) => z.preprocess((v) => (v === '' ? undefined : v), s.optional())

const schema = z.object({
  NEXT_PUBLIC_SITE_URL: z.string().url().default('http://localhost:3000'),
  // Supabase необязателен: без него сайт работает в демо-режиме (каталог из data/seed)
  NEXT_PUBLIC_SUPABASE_URL: optional(z.string().url()),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: optional(z.string().min(20)),
  SUPABASE_SERVICE_ROLE_KEY: optional(z.string().min(20)),
  NEXT_PUBLIC_WHATSAPP_NUMBER: z
    .string()
    .regex(/^\d{10,15}$/, 'только цифры, например 79991234567')
    .default('79990000000'),
  TELEGRAM_BOT_TOKEN: optional(z.string().regex(/^\d+:[\w-]{30,}$/, 'формат 123456:ABC…')),
  TELEGRAM_WEBHOOK_SECRET: optional(z.string().min(16)),
  OWNER_TELEGRAM_IDS: z
    .string()
    .optional()
    .transform((v) => (v ? v.split(',').map((s) => Number(s.trim())).filter((n) => Number.isFinite(n) && n > 0) : [])),
})

const parsed = schema.safeParse(process.env)
if (!parsed.success) {
  // Fail fast: перечисляем только имена переменных, значения не логируем
  const names = parsed.error.issues.map((i) => i.path.join('.')).join(', ')
  throw new Error(`Некорректные переменные окружения: ${names}`)
}

export const env = parsed.data

/** Демо-режим: нет Supabase → каталог из seed, заказы не сохраняются (только WhatsApp). */
export const isDemo = !(env.NEXT_PUBLIC_SUPABASE_URL && env.NEXT_PUBLIC_SUPABASE_ANON_KEY && env.SUPABASE_SERVICE_ROLE_KEY)
