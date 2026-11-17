/**
 * Локальный запуск Telegram-бота без сервера и вебхука (long polling).
 * Бот работает, пока открыт терминал; данные — в локальной БД (`supabase start`).
 * Запуск: pnpm bot:dev
 */
async function main() {
  const { env, isDemo } = await import('../lib/env')

  if (!env.TELEGRAM_BOT_TOKEN) {
    console.error(
      '❌ Нет TELEGRAM_BOT_TOKEN в .env.local.\n' +
        '   1. Откройте @BotFather в Telegram → /newbot → придумайте имя и username.\n' +
        '   2. Скопируйте токен в .env.local: TELEGRAM_BOT_TOKEN=123456:ABC…\n' +
        '   3. Запустите pnpm bot:dev ещё раз.',
    )
    process.exit(1)
  }
  if (isDemo) {
    console.error('❌ Supabase не подключён. Запустите `supabase start` и заполните ключи Supabase в .env.local.')
    process.exit(1)
  }

  const { getBot } = await import('../lib/bot/bot')
  const bot = getBot()

  // Если бот уже работает на сервере через вебхук, polling его перехватит — предупреждаем
  const hook = await bot.api.getWebhookInfo()
  if (hook.url) {
    await bot.api.deleteWebhook()
    console.warn(`⚠️  Сняла вебхук ${new URL(hook.url).host}. После проверки верните его: pnpm bot:set-webhook`)
  }
  await bot.api.setMyCommands([
    { command: 'start', description: 'Главное меню' },
    { command: 'help', description: 'Как пользоваться' },
  ])

  if (env.OWNER_TELEGRAM_IDS.length === 0) {
    console.warn(
      '⚠️  OWNER_TELEGRAM_IDS пуст — бот никого не пустит.\n' +
        '   Напишите боту /start: он ответит вашим Telegram ID. Впишите его в .env.local и перезапустите.',
    )
  }

  process.once('SIGINT', () => bot.stop())
  process.once('SIGTERM', () => bot.stop())

  await bot.start({
    allowed_updates: ['message', 'callback_query'],
    drop_pending_updates: true,
    onStart: (me) => console.log(`✅ Бот @${me.username} запущен. Откройте https://t.me/${me.username} и отправьте /start. Остановить: Ctrl+C`),
  })
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
