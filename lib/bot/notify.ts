import 'server-only'
import { env } from '@/lib/env'
import { getOrder } from './repo'
import { orderKeyboard, orderText } from './render'

/** Отправляет владелице карточку нового заказа в Telegram. */
export async function notifyOwnerAboutOrder(orderId: string) {
  if (!env.TELEGRAM_BOT_TOKEN || env.OWNER_TELEGRAM_IDS.length === 0) return
  const o = await getOrder(orderId)
  if (!o) return
  const text = orderText({ ...o, total: Number(o.total) }, true)
  const reply_markup = orderKeyboard(o)
  await Promise.all(
    env.OWNER_TELEGRAM_IDS.map((chat_id) =>
      fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ chat_id, text, parse_mode: 'HTML', reply_markup }),
      }),
    ),
  )
}
