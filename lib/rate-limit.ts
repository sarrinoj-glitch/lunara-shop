import 'server-only'

/** Простой in-memory лимит (MVP). На Vercel работает в пределах одного инстанса. */
const hits = new Map<string, number[]>()

export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now()
  const arr = (hits.get(key) ?? []).filter((ts) => now - ts < windowMs)
  if (arr.length >= limit) {
    hits.set(key, arr)
    return false
  }
  arr.push(now)
  hits.set(key, arr)
  if (hits.size > 5000) hits.clear()
  return true
}
