import { timingSafeEqual } from 'node:crypto'
import { env, isDemo } from '@/lib/env'
import { logger } from '@/lib/logger'
import { E } from '@/lib/errors'
import { errorResponse, respond } from '@/lib/http'
import { getBot } from '@/lib/bot/bot'
import { createAdminClient } from '@/lib/supabase/server'

export const maxDuration = 60

function safeEqual(a: string, b: string) {
  const ab = Buffer.from(a)
  const bb = Buffer.from(b)
  return ab.length === bb.length && timingSafeEqual(ab, bb)
}

export async function POST(req: Request) {
  const traceId = crypto.randomUUID()
  if (isDemo) return errorResponse(E.DATASOURCE_DOWN, 'Бот недоступен: Supabase не подключён (демо-режим)', traceId)
  const secret = req.headers.get('x-telegram-bot-api-secret-token') ?? ''
  if (!env.TELEGRAM_WEBHOOK_SECRET || !safeEqual(secret, env.TELEGRAM_WEBHOOK_SECRET)) {
    logger.warn({ traceId, ip: req.headers.get('x-forwarded-for') }, 'telegram webhook: bad secret')
    return errorResponse(E.AUTH_REQUIRED, 'Неверная подпись', traceId)
  }

  const update = await req.json().catch(() => null)
  if (!update || typeof update.update_id !== 'number') return errorResponse(E.VALIDATION, 'Bad update', traceId)

  // Идемпотентность: Telegram может повторить апдейт
  const { error: dupError } = await createAdminClient().from('bot_updates').insert({ update_id: update.update_id })
  if (dupError) return respond({ ok: true, duplicate: true })

  try {
    const bot = getBot()
    if (!bot.isInited()) await bot.init()
    await bot.handleUpdate(update)
  } catch (err) {
    logger.error({ traceId, code: E.DATASOURCE_DOWN, err: String(err) }, 'telegram webhook failed')
  }
  // Всегда 200, иначе Telegram будет бесконечно ретраить
  return respond({ ok: true })
}
