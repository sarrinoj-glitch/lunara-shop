# LUNARA — бутик восточной косметики

Интернет-магазин La Sultane de Saba. Заказы приходят в WhatsApp, каталогом владелица управляет через Telegram-бот.

**Стек:** Next.js 16 (App Router, Cache Components) · Tailwind v4 · shadcn/ui · motion · Supabase · grammY.

## Режимы работы
| Режим | Когда | Что работает |
|---|---|---|
| **Демо** | ключи Supabase не заданы | витрина из `data/seed` (62 товара), корзина, заказ → WhatsApp. Заказы не сохраняются, бот выключен |
| **Полный** | заданы `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | каталог из БД, заказы в БД и в Telegram, админ-бот |

## Быстрый старт (демо)
```bash
pnpm install
pnpm dev   # http://localhost:3000
```

## Документы
- [docs/PROJECT_IDEA.md](docs/PROJECT_IDEA.md) — идея и бизнес-контекст
- [docs/SPEC.md](docs/SPEC.md) — спецификация (источник истины)
- [docs/DEPLOY.md](docs/DEPLOY.md) — запуск в продакшн
- [docs/ИНСТРУКЦИЯ_ДЛЯ_ВЛАДЕЛИЦЫ.md](docs/ИНСТРУКЦИЯ_ДЛЯ_ВЛАДЕЛИЦЫ.md) — как вести магазин через бот
