---
tags: [decision, admin, telegram]
date: 2026-11-15
---

# Админка магазина — Telegram-бот, а не веб-панель

**Решение:** владелица управляет каталогом и заказами только через Telegram-бот. Веб-админки нет.

**Почему:** владелица работает с телефона, с техникой средне. Пользователь выбрал вариант «Б» из трёх: своя PWA-админка, бот или CMS. Готовые CMS отбросили, они слишком сложные на телефоне.

**Как устроено** (`lib/bot/`):
- вебхук `app/api/telegram/webhook/route.ts`: проверка `X-Telegram-Bot-Api-Secret-Token`, дедуп по `bot_updates.update_id`;
- доступ только по whitelist `OWNER_TELEGRAM_IDS`;
- состояние диалога хранится в `bot_sessions` (FSM: `add.photos → name → price → old_price → category → aroma → volume → description → preview`);
- альбом фото приходит параллельными апдейтами, поэтому фото добавляются атомарно через RPC `bot_append_photo`, см. [[альбом фото в Telegram приходит параллельными апдейтами]];
- фото обрабатываются через sharp (WebP, ≤1600px) и кладутся в Storage `products/<productId>/<uuid>.webp`;
- после изменений вызывается `revalidateTag('products','max')`.

**Как проверить без Telegram:** `pnpm test:bot` (19 проверок, Bot API подменяется).

См. также [[заказы уходят в WhatsApp ссылкой wa.me и дублируются в бот]].
