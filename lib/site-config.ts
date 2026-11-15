/** Единое место для названия и контактов магазина (название — заглушка). */
export const siteConfig = {
  name: 'АМБРА',
  nameLatin: 'AMBRA',
  tagline: 'Восточный ритуал ухода',
  description:
    'АМБРА — бутик восточной косметики La Sultane de Saba: ароматы амбры, розы и специй, ритуалы хаммама у вас дома. Оформление заказа в WhatsApp.',
  whatsappDisplay: process.env.NEXT_PUBLIC_WHATSAPP_DISPLAY ?? '+7 (999) 000-00-00',
  whatsappNumber: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '79990000000',
  telegramUrl: process.env.NEXT_PUBLIC_TELEGRAM_URL ?? 'https://t.me/',
  instagramUrl: process.env.NEXT_PUBLIC_INSTAGRAM_URL ?? '',
  city: 'Россия',
}

export function waLink(text?: string, number = siteConfig.whatsappNumber) {
  return `https://wa.me/${number}${text ? `?text=${encodeURIComponent(text)}` : ''}`
}
