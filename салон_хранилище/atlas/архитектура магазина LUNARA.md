---
tags: [atlas, architecture]
date: 2026-11-15
---

# Архитектура магазина LUNARA

```
Покупательница → Next.js 16 (Vercel) ──use cache/cacheTag──► Supabase (Postgres + Storage)
                      │ server action createOrder → RPC create_order
                      ▼
                wa.me/<номер>?text=…        + уведомление → Telegram владелицы
Владелица → Telegram → /api/telegram/webhook → lib/bot (FSM) → Supabase → revalidateTag
```

- **БД:** `brands`, `categories`, `products`, `product_images`, `orders`, `order_items`, `bot_sessions`, `bot_updates`.
- **RLS:** anon читает только `published`, всё остальное доступно только service_role.
- **Кэш:** все опубликованные товары читаются одним запросом `getAllProducts()` (`'use cache'`, `cacheLife('max')`, `cacheTag('products')`), фильтрация идёт в памяти, товаров меньше 200.
- **Страницы:** `/` и 62 `/product/*` пререндерятся (PPR), `/catalog` стримится по searchParams.
- **Next.js 16:** ломающие изменения. Error boundary получает `retry`, а не `reset`; `revalidateTag(tag, 'max')`; типы `PageProps`/`LayoutProps` генерирует `next typegen`.
- **Документы:** `docs/PROJECT_IDEA.md`, `docs/SPEC.md`, `docs/DEPLOY.md`, `docs/ИНСТРУКЦИЯ_ДЛЯ_ВЛАДЕЛИЦЫ.md`.

Решения: [[админка магазина — Telegram-бот, а не веб-панель]], [[заказы уходят в WhatsApp ссылкой wa.me и дублируются в бот]], [[дизайн LUNARA — редакционный бутик в терракоте с мотивом арки]].

## Обновление 2026-11-16
- **Режимы сборки:**
  - серверный (Vercel + Supabase + бот);
  - демо без Supabase (`isDemo`);
  - статический для GitHub Pages (`NEXT_PUBLIC_STATIC_EXPORT=1`, `pnpm build:pages`). См. [[статический экспорт Next 16 несовместим с Cache Components]].
- **Живой сайт:** https://sarrinoj-glitch.github.io/lunara-shop/. Workflow `.github/workflows/pages.yml` публикует при push в `main`.
- **Слой анимаций** (`components/motion/`):
  - `intro`, `custom-cursor`, `scroll-progress`;
  - `stacking-cards` (21st.dev), `scroll-word-reveal`, `tilt`, `count-up`, `rolling-number`;
  - ранее: `reveal`, `magnetic`, `velocity-marquee`, `spinning-text`, `draw-line`, `parallax`.
- **Магазинные оверлеи:**
  - `components/shop/quick-view.tsx` (Dialog / vaul Drawer);
  - `search-command.tsx` (cmdk ⌘K);
  - `add-to-cart-button.tsx` (морфинг);
  - состояние в `lib/ui/store.ts`.
- **Переходы страниц:** React `ViewTransition`, имя `productVT(slug)` у фото в карточке и первого фото галереи.
- Подробности в [[вторая версия витрины живёт в ветке v2 и публикуется в подпапке v2]].
