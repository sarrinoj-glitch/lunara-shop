---
tags: [decision, deploy, demo]
date: 2026-11-15
---

# Без ключей Supabase сайт работает в демо-режиме из seed

**Решение (запрос пользователя 2026-11-15):** «пока Supabase не надо, заглушку». Если `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` и `SUPABASE_SERVICE_ROLE_KEY` не заданы, `isDemo = true` (`lib/env.ts`).

**Что делает демо-режим:**
- каталог берётся из `data/seed/products.json` через `lib/catalog/demo-source.ts`, фото лежат в `public/catalog/`;
- id товаров — стабильные псевдо-uuid по индексу (`00000000-0000-4000-8000-…`), их хватает для корзины и формы;
- заказ не сохраняется: номер вычисляется из времени, цены берутся из seed, WhatsApp открывается как обычно;
- вебхук бота отвечает 503.

**Разметка каталога** (категория, аромат, хиты, новинки) вынесена в `lib/catalog/seed-map.ts`. Ею пользуются и демо-источник, и `scripts/seed-catalog.ts`.

**Чтобы включить полный режим:** задать три ключа Supabase, выполнить `db push` и `seed:catalog` (см. `docs/DEPLOY.md`). Код менять не нужно.

**Репозиторий:** github.com/sarrinoj-glitch/ambra-shop (private).

Связано с [[архитектура магазина АМБРА]], [[заказы уходят в WhatsApp ссылкой wa.me и дублируются в бот]].
