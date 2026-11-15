/**
 * Разметка стартового каталога (data/seed/products.json): категория, аромат, хиты, новинки.
 * Чистые функции — используются и сид-скриптом, и демо-источником данных.
 */

export type SeedProduct = {
  slug: string
  name: string
  description: string
  price: number
  old_price: number | null
  volume: string | null
  in_stock: boolean
  images: string[]
  source_url: string
}

export const CATEGORIES = [
  { slug: 'telo', name: 'Тело', sort: 1 },
  { slug: 'litso', name: 'Лицо', sort: 2 },
  { slug: 'ruki', name: 'Руки', sort: 3 },
  { slug: 'aromaty', name: 'Ароматы', sort: 4 },
  { slug: 'dom', name: 'Для дома', sort: 5 },
  { slug: 'nabory', name: 'Наборы', sort: 6 },
] as const

export const SEED_BRAND = 'La Sultane de Saba'

const norm = (s: string) => s.toLowerCase().replace(/ё/g, 'е')

// Порядок важен: более длинные совпадения раньше
const AROMAS: [RegExp, string][] = [
  [/мускус, ладан и роза/, 'Мускус, Ладан и Роза'],
  [/мускус, ладан и ваниль/, 'Мускус, Ладан и Ваниль'],
  [/амбра, ваниль и пачули|дорог[аеи] специй/, 'Амбра, Ваниль и Пачули'],
  [/амбра, мускус и сантал/, 'Амбра, Мускус и Сантал'],
  [/лотос и франжипани/, 'Лотос и Франжипани'],
  [/зеленый чай и имбирь|дарджилинг/, 'Зелёный чай и Имбирь'],
  [/цветы апельсина/, 'Цветы апельсина'],
  [/алоэ вера и цветы тиаре/, 'Алоэ вера и Тиаре'],
  [/лукум/, 'Лукум'],
  [/удовое дерево/, 'Удовое дерево'],
  [/с розой|роза/, 'Роза'],
  [/эвкалипт/, 'Эвкалипт'],
  [/кедр/, 'Кедр и Пачули'],
]

export function aromaOf(name: string) {
  const n = norm(name)
  return AROMAS.find(([re]) => re.test(n))?.[1] ?? null
}

export function categoryOf(name: string): (typeof CATEGORIES)[number]['slug'] {
  const n = norm(name)
  if (/набор/.test(n)) return 'nabory'
  if (/свеча|диффузор/.test(n)) return 'dom'
  if (/парфюмерная вода/.test(n)) return 'aromaty'
  if (/для рук/.test(n)) return 'ruki'
  if (/для лица(?! и тела)/.test(n) || /^вв-крем/.test(n)) return 'litso'
  return 'telo'
}

/** «… 300мл» в конце названия — лишнее, объём есть отдельным полем */
export function cleanName(name: string) {
  return name.replace(/\s+\d+\s?мл$/i, '').trim()
}

export function volumeOf(p: Pick<SeedProduct, 'name' | 'volume'>) {
  const fromName = p.name.match(/(\d+)\s?мл$/i)
  const v = p.volume ?? (fromName ? `${fromName[1]}мл` : null)
  return v ? v.replace(/(\d)(мл|г)\b/g, '$1 $2').replace(/\+/g, ' + ') : null
}

const sourceId = (p: SeedProduct) => Number(p.source_url.match(/\.(\d+)\/?$/)?.[1] ?? 0)

const HIT_PATTERNS = [
  /^крем для рук амбра, ваниль/i,
  /^лосьон для тела амбра, ваниль/i,
  /^парфюмерная вода амбра, ваниль/i,
  /^масло карите для тела и волос амбра, ваниль/i,
  /^гоммаж для тела амбра, ваниль/i,
  /^мыло для лица и тела черное/i,
  /^маска-рассул/i,
  /^крем для душа с розой/i,
]

export const isHit = (cleanedName: string) => HIT_PATTERNS.some((re) => re.test(cleanedName))

/** 8 самых свежих позиций (по id карточки источника) — «новинки». */
export function newestSlugs(products: SeedProduct[], n = 8) {
  return new Set([...products].sort((a, b) => sourceId(b) - sourceId(a)).slice(0, n).map((p) => p.slug))
}

export const discountOf = (price: number, oldPrice: number | null) =>
  oldPrice && oldPrice > price ? Math.round((1 - price / oldPrice) * 100) : null
