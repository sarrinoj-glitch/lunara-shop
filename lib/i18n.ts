import ru from '@/messages/ru.json'

/**
 * Все строки UI — в messages/ru.json (одна локаль, без роутинга).
 * Использование: `t.cart.title`, `fmt(t.checkout.successTitle, { n: 1024 })`.
 */
export const t = ru
export type Messages = typeof ru

export function fmt(template: string, vars: Record<string, string | number>) {
  return template.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? ''))
}
