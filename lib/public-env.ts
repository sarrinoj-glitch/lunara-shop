// Публичные переменные, безопасные для клиента (инлайнятся Next.js на этапе сборки).
export const publicEnv = {
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000',
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
}

export function storageUrl(path: string) {
  return `${publicEnv.supabaseUrl}/storage/v1/object/public/products/${path}`
}
