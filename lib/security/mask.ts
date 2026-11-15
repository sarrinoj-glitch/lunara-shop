/** +79280000000 → +7928***0000 */
export function maskPhone(phone: string) {
  const d = phone.replace(/\D/g, '')
  if (d.length < 8) return '***'
  return `+${d.slice(0, 4)}***${d.slice(-4)}`
}

/** Курбан → Ку*** */
export function maskName(name: string) {
  return name.length <= 2 ? `${name}***` : `${name.slice(0, 2)}***`
}
