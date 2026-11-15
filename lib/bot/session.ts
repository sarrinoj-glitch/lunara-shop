import 'server-only'
import { createAdminClient } from '@/lib/supabase/server'
import type { Json } from '@/types/database'

export type BotState =
  | 'idle'
  | 'add.photos'
  | 'add.name'
  | 'add.price'
  | 'add.old_price'
  | 'add.category'
  | 'add.aroma'
  | 'add.volume'
  | 'add.description'
  | 'add.preview'
  | 'search'
  | 'edit.price'
  | 'edit.old_price'
  | 'edit.name'
  | 'edit.description'
  | 'edit.photos'

export type Draft = {
  productId?: string // если редактируем существующий
  photos?: string[] // telegram file_id
  lastGroup?: string | null
  name?: string
  price?: number
  oldPrice?: number | null
  categorySlug?: string
  aroma?: string | null
  volume?: string | null
  description?: string | null
  /** куда вернуться после правки поля в превью */
  returnTo?: 'preview'
  /** варианты ароматов, показанные кнопками (индекс в callback) */
  aromaOptions?: string[]
}

export type Session = { state: BotState; data: Draft }

const TTL_MS = 24 * 60 * 60 * 1000

export async function getSession(chatId: number): Promise<Session> {
  const db = createAdminClient()
  const { data } = await db.from('bot_sessions').select('state, data, updated_at, created_at').eq('chat_id', chatId).maybeSingle()
  if (!data) {
    await db.from('bot_sessions').insert({ chat_id: chatId, state: 'idle', data: {} })
    return { state: 'idle', data: {} }
  }
  const touched = new Date(data.updated_at ?? data.created_at).getTime()
  if (Date.now() - touched > TTL_MS && data.state !== 'idle') {
    return { state: 'idle', data: (data.data ?? {}) as Draft }
  }
  return { state: data.state as BotState, data: (data.data ?? {}) as Draft }
}

export async function setSession(chatId: number, state: BotState, data: Draft) {
  const db = createAdminClient()
  await db.from('bot_sessions').upsert({ chat_id: chatId, state, data: data as unknown as { [key: string]: Json } })
}

export async function patchSession(chatId: number, state: BotState, patch: Partial<Draft>) {
  const s = await getSession(chatId)
  await setSession(chatId, state, { ...s.data, ...patch })
}

export async function appendPhoto(chatId: number, fileId: string, groupId: string | null) {
  const db = createAdminClient()
  // p_group_id в SQL допускает null (одиночное фото), генератор типов этого не знает
  const { data } = await db.rpc('bot_append_photo', { p_chat_id: chatId, p_file_id: fileId, p_group_id: groupId as string })
  return data?.[0] ?? { photo_count: 0, first_in_group: true }
}
