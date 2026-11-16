---
tags: [debugging, nextjs, github-pages]
date: 2026-11-16
---

# Статический экспорт Next 16 несовместим с Cache Components

**Цепочка ошибок при `output: 'export'`:**
1. `robots.txt`: требует `export const dynamic = "force-static"`.
2. Если добавить `dynamic`: «Route segment config "dynamic" is not compatible with `cacheComponents`».
3. Если оставить Cache Components: «Invariant: PPR cannot be enabled in export mode».
4. Если выключить Cache Components, перестаёт работать `'use cache'` в `lib/catalog/queries.ts`.

**Решение:**
- в статическом режиме `cacheComponents: false`, `partialPrefetching` не задаётся;
- `turbopack.resolveAlias` подменяет `@/lib/catalog/queries` на `static-queries.ts` (без `'use cache'`), а `@/app/(shop)/checkout/actions` на клиентский `lib/orders/static-actions.ts` (server actions в экспорте запрещены);
- вебхук, robots и sitemap — `route.server.ts`. `pageExtensions` включает `server.ts` только в серверном режиме;
- метаданные `robots.ts`/`sitemap.ts` с суффиксом `.server` Next **не распознаёт**, поэтому они переделаны в route-обработчики `app/robots.txt/route.server.ts` и `app/sitemap.xml/route.server.ts`;
- для статики `scripts/static-meta.ts` пишет `out/robots.txt`, `sitemap.xml` и `.nojekyll`;
- `searchParams` на сервере в экспорте недоступны, поэтому фильтры каталога и `?n` на странице успеха читаются в браузере через `useSearchParams`.

Связано с [[витрина публикуется на GitHub Pages статической сборкой]].
