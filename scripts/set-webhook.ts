export {}
/**
 * Регистрирует вебхук Telegram и команды бота.
 * Запуск: pnpm bot:set-webhook   (NEXT_PUBLIC_SITE_URL должен быть публичным https)
 */
const token = process.env.TELEGRAM_BOT_TOKEN
const secret = process.env.TELEGRAM_WEBHOOK_SECRET
const site = process.env.NEXT_PUBLIC_SITE_URL

if (!token || !secret || !site) throw new Error('Нужны TELEGRAM_BOT_TOKEN, TELEGRAM_WEBHOOK_SECRET, NEXT_PUBLIC_SITE_URL')
if (!site.startsWith('https://')) throw new Error('Telegram требует https-адрес сайта')

async function call(method: string, body: unknown) {
  const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
  const json = await res.json()
  console.log(method, json.ok ? '✅' : '❌', json.description ?? '')
}

await call('setWebhook', {
  url: `${site}/api/telegram/webhook`,
  secret_token: secret,
  allowed_updates: ['message', 'callback_query'],
  drop_pending_updates: true,
})
await call('setMyCommands', {
  commands: [
    { command: 'start', description: 'Главное меню' },
    { command: 'help', description: 'Как пользоваться' },
  ],
})
await call('setMyDescription', { description: 'Бот для управления магазином АМБРА: товары, цены, фото и заказы.' })
