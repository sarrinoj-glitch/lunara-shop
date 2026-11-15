/**
 * Smoke-тест Telegram-бота без Telegram: подменяет Bot API и прогоняет сценарии владелицы
 * против локальной БД. Запуск: pnpm test:bot
 */
import { readFileSync } from 'node:fs'
import path from 'node:path'

process.env.TELEGRAM_BOT_TOKEN = '123456:TEST_TOKEN_abcdefghijklmnopqrstuvwxyz'
process.env.TELEGRAM_WEBHOOK_SECRET = 'test-secret-1234567890'
process.env.OWNER_TELEGRAM_IDS = '111'

const OWNER = 111
const STRANGER = 999
const sent: { method: string; payload: Record<string, unknown> }[] = []
const samplePhoto = readFileSync(path.resolve(__dirname, '..', 'public/catalog', 'krem-dlya-ruk-ambra-vanil-i-pachuli-1.webp'))

// Подмена прямых fetch к Telegram (скачивание фото)
const realFetch = globalThis.fetch
globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
  const url = String(input)
  if (url.includes('api.telegram.org') && url.includes('/getFile')) {
    return new Response(JSON.stringify({ ok: true, result: { file_path: 'photos/test.jpg' } }))
  }
  if (url.includes('api.telegram.org/file/')) return new Response(samplePhoto)
  return realFetch(input, init)
}) as typeof fetch

let updateId = 1000
const chat = (id: number) => ({ id, type: 'private' as const, first_name: 'T' })
const from = (id: number) => ({ id, is_bot: false, first_name: 'T' })
const msg = (id: number, extra: Record<string, unknown>) => ({
  update_id: ++updateId,
  message: { message_id: updateId, date: Math.floor(Date.now() / 1000), chat: chat(id), from: from(id), ...extra },
})
const text = (t: string, id = OWNER) => msg(id, { text: t, ...(t.startsWith('/') ? { entities: [{ type: 'bot_command', offset: 0, length: t.length }] } : {}) })
const photo = (fileId: string, group?: string) =>
  msg(OWNER, { photo: [{ file_id: fileId, file_unique_id: fileId, width: 800, height: 800 }], ...(group ? { media_group_id: group } : {}) })
const cb = (data: string) => ({
  update_id: ++updateId,
  callback_query: {
    id: String(updateId),
    from: from(OWNER),
    chat_instance: '1',
    data,
    message: { message_id: 1, date: 0, chat: chat(OWNER), text: 'x' },
  },
})

function lastText() {
  const m = [...sent].reverse().find((s) => s.method === 'sendMessage' || s.method === 'sendPhoto' || s.method === 'editMessageText' || s.method === 'editMessageCaption')
  return String(m?.payload.text ?? m?.payload.caption ?? '')
}

function assert(cond: unknown, label: string) {
  if (!cond) {
    console.error('❌', label, '\n   последний ответ бота:', lastText().slice(0, 300))
    process.exit(1)
  }
  console.log('✅', label)
}

async function main() {
  const { getBot } = await import('../lib/bot/bot')
  const { createAdminClient } = await import('../lib/supabase/server')
  const db = createAdminClient()
  const bot = getBot()
  bot.botInfo = {
    id: 1, is_bot: true, first_name: 'Lunara', username: 'lunara_test_bot', can_join_groups: false,
    can_read_all_group_messages: false, supports_inline_queries: false, can_connect_to_business: false, has_main_web_app: false,
  } as typeof bot.botInfo
  bot.api.config.use(async (_prev, method, payload) => {
    sent.push({ method, payload: payload as Record<string, unknown> })
    const result =
      method === 'answerCallbackQuery' || method.startsWith('set')
        ? true
        : { message_id: sent.length, date: 0, chat: chat(OWNER), text: (payload as { text?: string }).text ?? '' }
    return { ok: true, result } as never
  })
  const run = async (u: object) => bot.handleUpdate(u as Parameters<typeof bot.handleUpdate>[0])

  // Чистим следы прошлых прогонов
  await db.from('products').delete().like('name', 'Тестовый крем%')
  await db.from('bot_sessions').delete().eq('chat_id', OWNER)

  // 1. Чужой пользователь
  await run(text('/start', STRANGER))
  assert(lastText().includes('только для владельца'), 'чужой пользователь не получает доступ')

  // 2. Старт
  await run(text('/start'))
  assert(lastText().includes('помогаю вести магазин'), '/start показывает приветствие и меню')

  // 3. Добавление товара
  await run(text('➕ Добавить товар'))
  assert(lastText().includes('Пришлите фото'), 'бот просит фото')
  await run(text('какой-то текст'))
  assert(lastText().includes('нужно фото'), 'текст вместо фото — подсказка')
  await Promise.all([run(photo('F1', 'album1')), run(photo('F2', 'album1'))])
  await run(cb('a:done'))
  assert(lastText().includes('Как называется'), 'после «Готово» бот спрашивает название')
  await run(text('Тестовый крем для рук'))
  await run(text('сто рублей'))
  assert(lastText().includes('Не поняла цену'), 'некорректная цена отклоняется')
  await run(text('1 990'))
  await run(text('1000'))
  assert(lastText().includes('больше новой'), 'старая цена меньше новой отклоняется')
  await run(text('2500'))
  assert(lastText().includes('категорию'), 'после цен — выбор категории')
  await run(cb('a:cat:ruki'))
  assert(lastText().includes('аромат'), 'после категории — аромат')
  await run(cb('a:ar:0'))
  await run(text('50 мл'))
  await run(cb('a:skip:description'))
  assert(lastText().includes('Тестовый крем для рук') && lastText().includes('фото: 2'), 'превью с названием и 2 фото (альбом не потерялся)')
  await run(cb('a:pub'))
  assert(lastText().includes('Товар уже на сайте'), 'товар опубликован')

  const { data: p } = await db
    .from('products')
    .select('id, slug, price, old_price, status, aroma, volume, category:categories(slug), images:product_images(path)')
    .eq('name', 'Тестовый крем для рук')
    .single()
  assert(p && Number(p.price) === 1990 && Number(p.old_price) === 2500, 'в БД верные цены')
  assert(p?.status === 'published' && (p.category as { slug: string }).slug === 'ruki', 'в БД статус и категория')
  assert(p?.images.length === 2, 'в БД 2 фото, файлы в Storage')

  // 4. Поиск и правки
  await run(text('Тестовый крем'))
  assert(lastText().includes('Нашла: 1'), 'поиск по части названия')
  await run(cb(`p:v:${p!.id}`))
  await run(cb(`p:stock:${p!.id}`))
  await run(cb(`p:vis:${p!.id}`))
  await run(cb(`p:price:${p!.id}`))
  await run(text('2100'))
  const { data: p2 } = await db.from('products').select('price, in_stock, status').eq('id', p!.id).single()
  assert(p2 && !p2.in_stock && p2.status === 'hidden' && Number(p2.price) === 2100, 'наличие, скрытие и цена меняются кнопками')

  // 5. Удаление
  await run(cb(`p:del:${p!.id}`))
  assert(lastText().includes('Лучше скрыть'), 'удаление спрашивает подтверждение')
  await run(cb(`p:delok:${p!.id}`))
  const { data: gone } = await db.from('products').select('id').eq('id', p!.id).maybeSingle()
  assert(!gone, 'товар удалён')

  // 6. Заказы
  await run(text('🧾 Заказы'))
  assert(/Открытые заказы|Новых заказов нет/.test(lastText()), 'раздел заказов отвечает')

  console.log(`\nВсё прошло. Вызовов Bot API: ${sent.length}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
