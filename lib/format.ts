const rub = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 })

export function formatPrice(value: number | string | null | undefined) {
  if (value === null || value === undefined) return ''
  return `${rub.format(Number(value))} ₽`
}

export function plural(n: number, forms: [string, string, string]) {
  const n10 = n % 10
  const n100 = n % 100
  if (n10 === 1 && n100 !== 11) return forms[0]
  if (n10 >= 2 && n10 <= 4 && (n100 < 10 || n100 >= 20)) return forms[1]
  return forms[2]
}
