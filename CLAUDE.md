# CLAUDE.md — «АМБРА», интернет-магазин восточной косметики

## Обзор
Витрина La Sultane de Saba (потом и других брендов). Покупательница собирает корзину и оформляет заказ. Заказ сохраняется в БД и открывается в WhatsApp владелицы (wa.me), копия приходит ей в Telegram-бот. Каталогом владелица управляет **только через Telegram-бот** с телефона.
- Идея: `docs/PROJECT_IDEA.md`
- Спецификация (источник истины): `docs/SPEC.md`
- Шаблон новой фичи: `SPEC_TEMPLATE.md`
- Деплой: `docs/DEPLOY.md`, инструкция владелице: `docs/ИНСТРУКЦИЯ_ДЛЯ_ВЛАДЕЛИЦЫ.md`

## Стек
Next.js 16 App Router (Cache Components) · TypeScript strict · Tailwind v4 · shadcn/ui · motion (framer-motion) · Supabase (Postgres, Storage) · grammY · sharp · zod · react-hook-form · zustand · pnpm. Строки UI — `messages/ru.json` через `lib/i18n.ts`.

## Архитектура
```
app/
  (shop)/           витрина: page.tsx, catalog/, product/[slug]/, checkout/
  api/telegram/webhook/route.ts   вход бота (тонкий)
components/
  ui/               shadcn
  motion/           переиспользуемые анимации (reveal, magnetic, marquee, arch)
  shop/             карточки, шапка, корзина
lib/
  catalog/          чтение каталога (кэш + теги)
  orders/           создание заказа, текст для WhatsApp
  bot/              FSM бота, сценарии, клавиатуры
  supabase/         клиенты (server/admin)
  env.ts logger.ts errors.ts http.ts site-config.ts
messages/ru.json    все строки UI
supabase/migrations/ SQL
scripts/            seed-catalog.ts, set-webhook.ts
data/seed/          products.json + images (стартовый каталог)
```

## Правила
- Next.js 16 отличается от прежних версий: перед кодом смотреть `node_modules/next/dist/docs/` (см. AGENTS.md).
- Правила лежат в `../.claude/rules/` (общие) и `.claude/rules/` (этот проект). Если они расходятся, побеждают правила проекта.
- На витрине только `status='published'`. Цены считает сервер, ценам с клиента не верим.
- Запись в БД идёт только с сервера через service-role (server actions, бот). У anon есть только SELECT опубликованного.
- После изменений каталога вызывать `revalidateTag('products')`.
- Анимации только через `motion`, с поддержкой `prefers-reduced-motion`.
- Цвета берутся только из токенов (`terracotta`, `brown`, `espresso`, `cream`, `sand`, `clay`, `ivory`), hex в компонентах не пишем.
- Каждый экран реализует 4 состояния: loading/error/empty/success.

## Команды
```
pnpm dev                 # локально :3000
pnpm build && pnpm start
pnpm lint && pnpm typecheck
supabase start           # локальная БД (нужен colima/docker)
supabase db reset        # применить миграции + seed.sql
pnpm db:types            # сгенерировать types/database.ts
pnpm seed:catalog        # загрузить 62 товара + фото
pnpm bot:set-webhook     # зарегистрировать вебхук Telegram (нужен публичный URL)
pnpm test:bot            # smoke-тест бота без Telegram (19 проверок)
```

## Obsidian Knowledge Vault
Хранилище знаний: `./салон_хранилище/`

### При старте сессии
Прочитай `салон_хранилище/00-home/index.md` и `салон_хранилище/00-home/текущие приоритеты.md`. Если задача касается модуля, прочитай заметку из `knowledge/`.

### Правила заметок
- Имя файла — утверждение, а не категория
- `[[wiki-ссылки]]` в тексте
- frontmatter `tags` и `date`
- язык русский

### При завершении («сохрани сессию»)
1. Заметка в `sessions/` с датой
2. Обновить `текущие приоритеты.md`
3. Решение → `knowledge/decisions/`, баг → `knowledge/debugging/`
4. Обновить `index.md`
