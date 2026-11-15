---
tags: [decision, deploy, github-pages]
date: 2026-11-16
---

# Витрина публикуется на GitHub Pages статической сборкой

**Решение пользователя (2026-11-16):** GitHub Pages, репозиторий публичный. Vercel не используем.

**Как устроено:**
- `NEXT_PUBLIC_STATIC_EXPORT=1` → `output: 'export'`, `basePath=/lunara-shop`, `trailingSlash`, `images.unoptimized`;
- **Cache Components (PPR) несовместимы со статическим экспортом** («PPR cannot be enabled in export mode»), поэтому в статике `cacheComponents: false`;
- `'use cache'` без Cache Components не работает, поэтому `turbopack.resolveAlias` подменяет `@/lib/catalog/queries` на `static-queries.ts`, а `@/app/(shop)/checkout/actions` (server actions) на клиентский `lib/orders/static-actions.ts`;
- вебхук, robots и sitemap оформлены как `route.server.ts`; `pageExtensions` включает `server.ts` только в серверном режиме. Метаданные `robots.ts`/`sitemap.ts` с `.server` Next не распознаёт, поэтому они сделаны route-обработчиками;
- для статики `scripts/static-meta.ts` пишет `out/robots.txt`, `sitemap.xml` и `.nojekyll`;
- фильтры каталога и `?n` на странице успеха читаются в браузере (`useSearchParams`), одинаково для обоих режимов;
- фото в демо-данных идут с префиксом `NEXT_PUBLIC_BASE_PATH`, потому что next/image без оптимизатора basePath не добавляет.

**Приватность:** перед открытием репозитория почта в коммитах заменена на `…@users.noreply.github.com`, и он же задан в локальном `git config`.

**Ограничения:** заказы не сохраняются, бота нет, товары меняются через `data/seed` и push.

Связано с [[без ключей Supabase сайт работает в демо-режиме из seed]], [[архитектура магазина LUNARA]].
