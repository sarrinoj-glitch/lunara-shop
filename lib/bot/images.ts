import 'server-only'
import sharp from 'sharp'
import { createAdminClient } from '@/lib/supabase/server'

export const MAX_PHOTOS = 6

/** Сжимает фото с телефона: поворот по EXIF, ≤1600px, WebP q80. */
export async function processImage(input: Buffer) {
  const img = sharp(input, { failOn: 'none' }).rotate().resize(1600, 1600, { fit: 'inside', withoutEnlargement: true })
  const { data, info } = await img.webp({ quality: 80 }).toBuffer({ resolveWithObject: true })
  return { buffer: data, width: info.width, height: info.height }
}

export async function uploadProductImage(productId: string, buffer: Buffer) {
  const db = createAdminClient()
  const { buffer: webp, width, height } = await processImage(buffer)
  const path = `${productId}/${crypto.randomUUID()}.webp`
  const { error } = await db.storage.from('products').upload(path, webp, { contentType: 'image/webp', upsert: false })
  if (error) throw new Error(`storage upload failed: ${error.message}`)
  return { path, width, height }
}

export async function removeStorageFiles(paths: string[]) {
  if (paths.length === 0) return
  await createAdminClient().storage.from('products').remove(paths)
}

/** Скачивает файл из Telegram по file_id. */
export async function downloadTelegramFile(token: string, fileId: string): Promise<Buffer> {
  const meta = await fetch(`https://api.telegram.org/bot${token}/getFile?file_id=${encodeURIComponent(fileId)}`).then((r) => r.json())
  if (!meta.ok) throw new Error('getFile failed')
  const res = await fetch(`https://api.telegram.org/file/bot${token}/${meta.result.file_path}`)
  if (!res.ok) throw new Error('file download failed')
  return Buffer.from(await res.arrayBuffer())
}
