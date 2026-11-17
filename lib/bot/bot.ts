import 'server-only'
import { Bot, InlineKeyboard, type Context } from 'grammy'
import { env } from '@/lib/env'
import { logger } from '@/lib/logger'
import { formatPrice } from '@/lib/format'
import { publicEnv, storageUrl } from '@/lib/public-env'
import { B } from './texts'
import {
  draftCaption,
  esc,
  fixKeyboard,
  mainMenu,
  orderKeyboard,
  orderText,
  previewKeyboard,
  productCaption,
  productKeyboard,
  productPhotoUrl,
  productUrl,
} from './render'
import { appendPhoto, clearPending, getPending, getSession, leaveFlow, setSession, type BotState, type Draft } from './session'
import * as repo from './repo'
import { downloadTelegramFile, MAX_PHOTOS, uploadProductImage } from './images'

/* ---------- helpers ---------- */

const parsePrice = (text: string) => {
  const n = Number(text.replace(/[\s ₽руб.,]/gi, ''))
  return Number.isInteger(n) && n > 0 && n <= 10_000_000 ? n : null
}

const cancelKb = new InlineKeyboard().text(B.cancel, 'a:cancel')
const skipKb = (field: string) => new InlineKeyboard().text(B.skip, `a:skip:${field}`).text(B.cancel, 'a:cancel')

async function chatId(ctx: Context) {
  return ctx.chat!.id
}

async function sendProductCard(ctx: Context, productId: string) {
  const p = await repo.getProduct(productId)
  if (!p) return ctx.reply(B.products.gone)
  const photo = productPhotoUrl(p)
  if (photo) {
    try {
      return await ctx.replyWithPhoto(photo, { caption: productCaption(p), parse_mode: 'HTML', reply_markup: productKeyboard(p) })
    } catch {
      /* фото недоступно Telegram (например, локальный Supabase) — шлём текстом */
    }
  }
  return ctx.reply(productCaption(p), { parse_mode: 'HTML', reply_markup: productKeyboard(p) })
}

async function refreshCard(ctx: Context, productId: string) {
  const p = await repo.getProduct(productId)
  if (!p) return
  const opts = { parse_mode: 'HTML' as const, reply_markup: productKeyboard(p) }
  try {
    if (ctx.callbackQuery?.message && 'photo' in ctx.callbackQuery.message && ctx.callbackQuery.message.photo) {
      await ctx.editMessageCaption({ caption: productCaption(p), ...opts })
    } else {
      await ctx.editMessageText(productCaption(p), opts)
    }
  } catch {
    /* «message is not modified» — игнорируем */
  }
}

async function askStep(ctx: Context, state: BotState, d: Draft) {
  const id = await chatId(ctx)
  switch (state) {
    case 'add.photos':
      await setSession(id, state, { ...d, photos: [], lastGroup: null })
      return ctx.reply(B.add.photos, { reply_markup: new InlineKeyboard().text(B.done, 'a:done').text(B.cancel, 'a:cancel') })
    case 'add.name':
      await setSession(id, state, d)
      return ctx.reply(B.add.name, { parse_mode: 'HTML', reply_markup: cancelKb })
    case 'add.price':
      await setSession(id, state, d)
      return ctx.reply(B.add.price, { parse_mode: 'HTML', reply_markup: cancelKb })
    case 'add.old_price':
      await setSession(id, state, d)
      return ctx.reply(B.add.oldPrice, { reply_markup: new InlineKeyboard().text(B.add.noDiscount, 'a:nodisc').text(B.cancel, 'a:cancel') })
    case 'add.category': {
      await setSession(id, state, d)
      const cats = await repo.listCategories()
      const kb = new InlineKeyboard()
      cats.forEach((c, i) => {
        kb.text(c.name, `a:cat:${c.slug}`)
        if (i % 2 === 1) kb.row()
      })
      return ctx.reply(B.add.category, { reply_markup: kb.row().text(B.cancel, 'a:cancel') })
    }
    case 'add.aroma': {
      const options = await repo.listAromas(10)
      await setSession(id, state, { ...d, aromaOptions: options })
      const kb = new InlineKeyboard()
      options.forEach((a, i) => kb.text(a, `a:ar:${i}`).row())
      kb.text(B.add.aromaOther, 'a:ar:other').text(B.skip, 'a:skip:aroma')
      return ctx.reply(B.add.aroma, { reply_markup: kb })
    }
    case 'add.volume':
      await setSession(id, state, d)
      return ctx.reply(B.add.volume, { parse_mode: 'HTML', reply_markup: skipKb('volume') })
    case 'add.description':
      await setSession(id, state, d)
      return ctx.reply(B.add.description, { reply_markup: skipKb('description') })
    case 'add.preview':
      return showPreview(ctx, d)
    default:
      return
  }
}

/** Следующий шаг мастера (или возврат в превью, если правили одно поле). */
async function next(ctx: Context, current: BotState, d: Draft) {
  if (d.returnTo === 'preview') return askStep(ctx, 'add.preview', { ...d, returnTo: undefined })
  const order: BotState[] = ['add.photos', 'add.name', 'add.price', 'add.old_price', 'add.category', 'add.aroma', 'add.volume', 'add.description', 'add.preview']
  const nextState = order[order.indexOf(current) + 1] ?? 'add.preview'
  return askStep(ctx, nextState, d)
}

async function showPreview(ctx: Context, d: Draft) {
  const id = await chatId(ctx)
  await setSession(id, 'add.preview', d)
  const cats = await repo.listCategories()
  const caption = `${B.add.previewTitle}\n\n${draftCaption(d, cats.find((c) => c.slug === d.categorySlug)?.name)}`
  if (d.photos?.[0]) {
    return ctx.replyWithPhoto(d.photos[0], { caption: caption.slice(0, 1024), parse_mode: 'HTML', reply_markup: previewKeyboard })
  }
  return ctx.reply(caption, { parse_mode: 'HTML', reply_markup: previewKeyboard })
}

async function saveDraft(ctx: Context, d: Draft, status: 'published' | 'draft') {
  const id = await chatId(ctx)
  if (!d.name || !d.price || !d.categorySlug || !d.photos?.length) {
    await ctx.reply('Не хватает данных — давайте пройдём шаги ещё раз.')
    return askStep(ctx, 'add.photos', {})
  }
  await ctx.reply(B.add.uploading)
  const created = await repo.createProduct({
    name: d.name,
    price: d.price,
    oldPrice: d.oldPrice ?? null,
    categorySlug: d.categorySlug,
    aroma: d.aroma ?? null,
    volume: d.volume ?? null,
    description: d.description ?? null,
    status,
  })
  const uploaded = []
  for (const fileId of d.photos.slice(0, MAX_PHOTOS)) {
    const buf = await downloadTelegramFile(env.TELEGRAM_BOT_TOKEN!, fileId)
    uploaded.push(await uploadProductImage(created.id, buf))
  }
  await repo.addImages(created.id, uploaded)
  repo.refreshSite()
  await setSession(id, 'idle', {})
  const publishedText = publicEnv.siteUrl.startsWith('https://') ? B.add.published(productUrl(created.slug)) : B.add.publishedLocal
  return ctx.reply(status === 'published' ? publishedText : B.add.drafted, { reply_markup: mainMenu })
}

/** Какой шаг должен быть активен, чтобы кнопка мастера сработала (старые кнопки в чате игнорируем). */
const addActionState: Record<string, (arg: string) => BotState> = {
  done: () => 'add.photos',
  nodisc: () => 'add.old_price',
  cat: () => 'add.category',
  ar: () => 'add.aroma',
  skip: (arg) => `add.${arg}` as BotState,
  pub: () => 'add.preview',
  draft: () => 'add.preview',
  fix: () => 'add.preview',
}

/** «➕ Добавить товар»: если есть незаконченный — предлагаем продолжить. */
async function startAdd(ctx: Context) {
  const id = await chatId(ctx)
  await leaveFlow(id)
  const pending = await getPending(id)
  if (pending) {
    return ctx.reply(B.add.pending(pending.data.name ?? '', pending.data.photos?.length ?? 0), {
      reply_markup: new InlineKeyboard().text(B.add.resume, 'a:resume').text(B.add.fresh, 'a:fresh'),
    })
  }
  return askStep(ctx, 'add.photos', {})
}

async function resumeAdd(ctx: Context) {
  const id = await chatId(ctx)
  const pending = await getPending(id)
  await clearPending(id)
  if (!pending) return askStep(ctx, 'add.photos', {})
  const { state, data } = pending
  if (state === 'add.photos') {
    await setSession(id, state, { ...data, lastGroup: null })
    const n = data.photos?.length ?? 0
    return ctx.reply(n ? B.add.photoReceived(n) : B.add.photos, {
      reply_markup: new InlineKeyboard().text(B.done, 'a:done').text(B.cancel, 'a:cancel'),
    })
  }
  return askStep(ctx, state, data)
}

async function photoMenu(ctx: Context, pid: string) {
  const p = await repo.getProduct(pid)
  if (!p) return ctx.reply(B.products.gone)
  const kb = new InlineKeyboard().text(B.card.photoReplace, `p:phrep:${pid}`)
  if (p.images.length < MAX_PHOTOS) kb.text(B.card.photoAdd, `p:phadd:${pid}`)
  kb.row()
  if (p.images.length > 1) kb.text(B.card.photoDelete, `p:phdel:${pid}`)
  kb.text(B.cancel, 'a:cancel')
  return ctx.reply(B.card.photoMenu(p.images.length), { reply_markup: kb })
}

async function askDeletePhoto(ctx: Context, pid: string) {
  const p = await repo.getProduct(pid)
  if (!p) return ctx.reply(B.products.gone)
  if (p.images.length <= 1) return ctx.reply(B.card.lastPhoto)
  try {
    // Показываем фото с номерами. Локальный Supabase Telegram не видит — тогда просто номера.
    await ctx.replyWithMediaGroup(
      p.images.map((img, i) => ({ type: 'photo' as const, media: storageUrl(img.path), caption: String(i + 1) })),
    )
  } catch {
    /* фото недоступны Telegram */
  }
  const kb = new InlineKeyboard()
  p.images.forEach((img, i) => {
    kb.text(String(i + 1), `i:rm:${img.id}`)
    if (i % 3 === 2) kb.row()
  })
  return ctx.reply(B.card.askDeletePhoto(p.images.length), { reply_markup: kb.row().text(B.cancel, 'a:cancel') })
}

async function listToKeyboard(items: { id: string; name: string; price: number; status: string; in_stock: boolean }[]) {
  const kb = new InlineKeyboard()
  for (const p of items) {
    const mark = p.status === 'hidden' ? '🙈 ' : p.status === 'draft' ? '💾 ' : !p.in_stock ? '🚫 ' : ''
    kb.text(`${mark}${p.name.slice(0, 40)} · ${formatPrice(p.price)}`, `p:v:${p.id}`).row()
  }
  return kb
}

async function showOrders(ctx: Context) {
  const orders = await repo.listOpenOrders()
  if (orders.length === 0) return ctx.reply(B.orders.empty, { reply_markup: mainMenu })
  const kb = new InlineKeyboard()
  for (const o of orders) {
    kb.text(`№${o.number} · ${o.customer_name} · ${formatPrice(o.total)} · ${B.orders.statuses[o.status]}`, `o:v:${o.id}`).row()
  }
  return ctx.reply(B.orders.title, { reply_markup: kb })
}

/* ---------- bot ---------- */

let instance: Bot | null = null

export function getBot() {
  if (instance) return instance
  if (!env.TELEGRAM_BOT_TOKEN) throw new Error('TELEGRAM_BOT_TOKEN не задан')
  const bot = new Bot(env.TELEGRAM_BOT_TOKEN)

  // Доступ только владелице
  bot.use(async (ctx, nextMw) => {
    const uid = ctx.from?.id
    if (!uid || !env.OWNER_TELEGRAM_IDS.includes(uid)) {
      if (ctx.chat?.type === 'private' && uid) await ctx.reply(B.notOwner(uid), { parse_mode: 'HTML' })
      return
    }
    await nextMw()
  })

  bot.command(['start', 'menu'], async (ctx) => {
    // Сбрасываем сценарий; незаконченный товар откладывается (см. leaveFlow)
    await leaveFlow(ctx.chat.id)
    await ctx.reply(B.start, { parse_mode: 'HTML', reply_markup: mainMenu })
  })
  bot.command('help', (ctx) => ctx.reply(B.help, { reply_markup: mainMenu }))

  bot.hears(B.menu.help, (ctx) => ctx.reply(B.help, { reply_markup: mainMenu }))
  bot.hears(B.menu.add, (ctx) => startAdd(ctx))
  bot.hears(B.menu.orders, async (ctx) => {
    await leaveFlow(ctx.chat.id)
    return showOrders(ctx)
  })
  bot.hears(B.menu.products, async (ctx) => {
    await leaveFlow(ctx.chat.id)
    await setSession(ctx.chat.id, 'search', {})
    const kb = new InlineKeyboard()
      .text(B.products.latest, 'l:latest')
      .text(B.products.drafts, 'l:drafts')
      .row()
      .text(B.products.hidden, 'l:hidden')
      .text(B.products.outOfStock, 'l:outOfStock')
    return ctx.reply(B.products.ask, { reply_markup: kb })
  })

  /* --- фото --- */
  bot.on('message:photo', async (ctx) => {
    const s = await getSession(ctx.chat.id)
    if (s.state !== 'add.photos' && s.state !== 'edit.photos') {
      return ctx.reply('Чтобы добавить товар, нажмите «➕ Добавить товар» 👇', { reply_markup: mainMenu })
    }
    const best = ctx.message.photo.at(-1)!
    const { photo_count, first_in_group } = await appendPhoto(ctx.chat.id, best.file_id, ctx.message.media_group_id ?? null)
    if (photo_count > MAX_PHOTOS && first_in_group) return ctx.reply(B.add.tooMany)
    if (first_in_group) {
      const done = s.state === 'edit.photos' ? 'e:pdone' : 'a:done'
      return ctx.reply(B.add.photoReceived(Math.min(photo_count, MAX_PHOTOS)), {
        reply_markup: new InlineKeyboard().text(B.done, done).text(B.cancel, 'a:cancel'),
      })
    }
  })

  /* --- текст по состоянию --- */
  bot.on('message:text', async (ctx) => {
    const id = ctx.chat.id
    const text = ctx.message.text.trim()
    const s = await getSession(id)
    const d = s.data

    switch (s.state) {
      case 'add.photos':
      case 'edit.photos':
        return ctx.reply(B.add.needPhoto)
      case 'add.name':
        if (text.length < 2 || text.length > 200) return ctx.reply(B.add.badName)
        return next(ctx, s.state, { ...d, name: text })
      case 'add.price': {
        const price = parsePrice(text)
        if (!price) return ctx.reply(B.add.badPrice)
        const oldPrice = d.oldPrice && d.oldPrice > price ? d.oldPrice : null
        return next(ctx, s.state, { ...d, price, oldPrice })
      }
      case 'add.old_price': {
        const old = parsePrice(text)
        if (!old || !d.price || old <= d.price) return ctx.reply(B.add.badOldPrice(formatPrice(d.price ?? 0)))
        return next(ctx, s.state, { ...d, oldPrice: old })
      }
      case 'add.aroma':
        return next(ctx, s.state, { ...d, aroma: text.slice(0, 80) })
      case 'add.volume':
        return next(ctx, s.state, { ...d, volume: text.slice(0, 40) })
      case 'add.description':
        return next(ctx, s.state, { ...d, description: text.slice(0, 5000) })
      case 'edit.price': {
        const price = parsePrice(text)
        if (!price || !d.productId) return ctx.reply(B.add.badPrice)
        const p = await repo.getProduct(d.productId)
        await repo.updateProduct(d.productId, { price, old_price: p?.old_price && p.old_price > price ? p.old_price : null })
        await setSession(id, 'idle', {})
        await ctx.reply(B.card.saved, { reply_markup: mainMenu })
        return sendProductCard(ctx, d.productId)
      }
      case 'edit.old_price': {
        const old = parsePrice(text)
        const p = d.productId ? await repo.getProduct(d.productId) : null
        if (!old || !p || old <= p.price) return ctx.reply(B.add.badOldPrice(formatPrice(p?.price ?? 0)))
        await repo.updateProduct(p.id, { old_price: old })
        await setSession(id, 'idle', {})
        await ctx.reply(B.card.saved, { reply_markup: mainMenu })
        return sendProductCard(ctx, p.id)
      }
      case 'edit.name':
        if (!d.productId || text.length < 2 || text.length > 200) return ctx.reply(B.add.badName)
        await repo.updateProduct(d.productId, { name: text })
        await setSession(id, 'idle', {})
        await ctx.reply(B.card.saved, { reply_markup: mainMenu })
        return sendProductCard(ctx, d.productId)
      case 'edit.description':
        if (!d.productId) return
        await repo.updateProduct(d.productId, { description: text.slice(0, 5000) })
        await setSession(id, 'idle', {})
        await ctx.reply(B.card.saved, { reply_markup: mainMenu })
        return sendProductCard(ctx, d.productId)
      case 'search':
      case 'idle':
      default: {
        // Любой текст вне сценария — поиск товара
        const found = await repo.searchProducts(text)
        if (found.length === 0) return ctx.reply(B.products.notFound, { reply_markup: mainMenu })
        return ctx.reply(B.products.found(found.length), { reply_markup: await listToKeyboard(found) })
      }
    }
  })

  /* --- кнопки --- */
  bot.on('callback_query:data', async (ctx) => {
    const data = ctx.callbackQuery.data
    const id = ctx.chat!.id
    await ctx.answerCallbackQuery().catch(() => undefined)
    const s = await getSession(id)
    const d = s.data
    const [scope, action, ...rest] = data.split(':')
    const arg = rest.join(':')

    if (scope === 'a') {
      const required = addActionState[action]?.(arg)
      if (required && s.state !== required) return ctx.reply(B.stale, { reply_markup: mainMenu })
      switch (action) {
        case 'cancel':
          await setSession(id, 'idle', {})
          return ctx.reply(B.cancelled, { reply_markup: mainMenu })
        case 'resume':
          return resumeAdd(ctx)
        case 'fresh':
          await clearPending(id)
          return askStep(ctx, 'add.photos', {})
        case 'done': {
          const fresh = await getSession(id)
          const photos = (fresh.data.photos ?? []).slice(0, MAX_PHOTOS)
          if (photos.length === 0) return ctx.reply(B.add.noPhotos)
          return next(ctx, 'add.photos', { ...fresh.data, photos })
        }
        case 'nodisc':
          return next(ctx, 'add.old_price', { ...d, oldPrice: null })
        case 'cat':
          return next(ctx, 'add.category', { ...d, categorySlug: arg })
        case 'ar':
          if (arg === 'other') {
            await setSession(id, 'add.aroma', d)
            return ctx.reply(B.add.aromaAsk, { parse_mode: 'HTML' })
          }
          return next(ctx, 'add.aroma', { ...d, aroma: d.aromaOptions?.[Number(arg)] ?? null })
        case 'skip': {
          const field = arg as 'aroma' | 'volume' | 'description'
          return next(ctx, `add.${field}` as BotState, { ...d, [field]: null })
        }
        case 'pub':
          return saveDraft(ctx, d, 'published')
        case 'draft':
          return saveDraft(ctx, d, 'draft')
        case 'fix':
          if (!arg) return ctx.reply(B.add.whatToFix, { reply_markup: fixKeyboard })
          return askStep(ctx, `add.${arg}` as BotState, { ...d, returnTo: 'preview' })
      }
    }

    if (scope === 'l') {
      const list = await repo.listProducts(action as 'latest' | 'hidden' | 'outOfStock' | 'drafts')
      if (list.length === 0) return ctx.reply(B.products.notFound)
      return ctx.reply(B.products.found(list.length), { reply_markup: await listToKeyboard(list) })
    }

    if (scope === 'p') {
      const pid = arg
      const p = await repo.getProduct(pid)
      if (!p) return ctx.reply(B.products.gone)
      switch (action) {
        case 'v':
          return sendProductCard(ctx, pid)
        case 'price':
          await setSession(id, 'edit.price', { productId: pid })
          return ctx.reply(B.card.askPrice, { reply_markup: cancelKb })
        case 'disc':
          await setSession(id, 'edit.old_price', { productId: pid })
          return ctx.reply(B.card.askOldPrice, {
            reply_markup: new InlineKeyboard().text(B.card.removeDiscount, `p:nodisc:${pid}`).text(B.cancel, 'a:cancel'),
          })
        case 'nodisc':
          await repo.updateProduct(pid, { old_price: null })
          await setSession(id, 'idle', {})
          await ctx.reply(B.card.saved, { reply_markup: mainMenu })
          return sendProductCard(ctx, pid)
        case 'name':
          await setSession(id, 'edit.name', { productId: pid })
          return ctx.reply(B.card.askName, { reply_markup: cancelKb })
        case 'desc':
          await setSession(id, 'edit.description', { productId: pid })
          return ctx.reply(B.card.askDescription, { reply_markup: cancelKb })
        case 'photo':
          return photoMenu(ctx, pid)
        case 'phrep':
        case 'phadd': {
          const mode = action === 'phrep' ? 'replace' : 'append'
          const free = MAX_PHOTOS - p.images.length
          if (mode === 'append' && free <= 0) return ctx.reply(B.card.photosFull)
          await setSession(id, 'edit.photos', { productId: pid, photos: [], lastGroup: null, photoMode: mode })
          return ctx.reply(mode === 'replace' ? B.card.askPhotos : B.card.askPhotosAdd(free), {
            parse_mode: 'HTML',
            reply_markup: new InlineKeyboard().text(B.done, 'e:pdone').text(B.cancel, 'a:cancel'),
          })
        }
        case 'phdel':
          return askDeletePhoto(ctx, pid)
        case 'stock':
          await repo.updateProduct(pid, { in_stock: !p.in_stock })
          return refreshCard(ctx, pid)
        case 'vis':
          await repo.updateProduct(pid, { status: p.status === 'hidden' ? 'published' : 'hidden' })
          return refreshCard(ctx, pid)
        case 'pub':
          await repo.updateProduct(pid, { status: 'published' })
          return refreshCard(ctx, pid)
        case 'hit':
          await repo.updateProduct(pid, { is_hit: !p.is_hit })
          return refreshCard(ctx, pid)
        case 'new':
          await repo.updateProduct(pid, { is_new: !p.is_new })
          return refreshCard(ctx, pid)
        case 'del':
          return ctx.reply(`${B.card.confirmRemove}\n<b>${esc(p.name)}</b>`, {
            parse_mode: 'HTML',
            reply_markup: new InlineKeyboard()
              .text(B.card.hide, `p:hideok:${pid}`)
              .row()
              .text(B.card.removeForever, `p:delok:${pid}`)
              .row()
              .text(B.cancel, 'a:cancel'),
          })
        case 'hideok':
          await repo.updateProduct(pid, { status: 'hidden' })
          return ctx.reply(B.card.saved, { reply_markup: mainMenu })
        case 'delok':
          await repo.deleteProduct(pid)
          return ctx.reply(B.card.removed, { reply_markup: mainMenu })
      }
    }

    if (scope === 'i' && action === 'rm') {
      const res = await repo.deleteImage(arg)
      if (!res.ok) return ctx.reply(res.reason === 'last' ? B.card.lastPhoto : B.stale, { reply_markup: mainMenu })
      await ctx.reply(B.card.photoDeleted, { reply_markup: mainMenu })
      return sendProductCard(ctx, res.productId)
    }

    if (scope === 'e' && action === 'pdone') {
      if (s.state !== 'edit.photos') return ctx.reply(B.stale, { reply_markup: mainMenu })
      const fresh = await getSession(id)
      const pid = fresh.data.productId
      if (!pid) return
      const product = await repo.getProduct(pid)
      if (!product) return ctx.reply(B.products.gone)
      const append = fresh.data.photoMode === 'append'
      const limit = append ? MAX_PHOTOS - product.images.length : MAX_PHOTOS
      const received = fresh.data.photos ?? []
      const photos = received.slice(0, Math.max(limit, 0))
      if (received.length === 0) return ctx.reply(B.add.noPhotos)
      if (photos.length === 0) return ctx.reply(B.card.photosFull)
      await ctx.reply(B.add.uploading)
      const uploaded = []
      for (const fileId of photos) {
        uploaded.push(await uploadProductImage(pid, await downloadTelegramFile(env.TELEGRAM_BOT_TOKEN!, fileId)))
      }
      if (append) await repo.appendImages(pid, uploaded)
      else await repo.replaceImages(pid, uploaded)
      repo.refreshSite()
      if (append && received.length > photos.length) await ctx.reply(B.card.photosTrimmed(photos.length))
      await setSession(id, 'idle', {})
      await ctx.reply(B.card.saved, { reply_markup: mainMenu })
      return sendProductCard(ctx, pid)
    }

    if (scope === 'o') {
      if (action === 'v') {
        const o = await repo.getOrder(arg)
        if (!o) return
        return ctx.reply(orderText({ ...o, total: Number(o.total) }), { parse_mode: 'HTML', reply_markup: orderKeyboard(o) })
      }
      if (action === 's') {
        const [status, oid] = arg.split(':') as ['in_work' | 'done' | 'cancelled', string]
        await repo.setOrderStatus(oid, status)
        const o = await repo.getOrder(oid)
        if (!o) return
        try {
          await ctx.editMessageText(orderText({ ...o, total: Number(o.total) }), { parse_mode: 'HTML', reply_markup: orderKeyboard(o) })
        } catch {
          /* not modified */
        }
      }
    }
  })

  bot.catch((err) => {
    logger.error({ err: String(err.error), update: err.ctx.update.update_id }, 'bot error')
    err.ctx.reply('Ой, что-то пошло не так 😔 Попробуйте ещё раз или отправьте /start').catch(() => undefined)
  })

  instance = bot
  return bot
}
