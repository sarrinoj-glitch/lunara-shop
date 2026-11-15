# Запуск в продакшн

## Сейчас: GitHub Pages (статическая витрина, без сервера)
- Workflow `.github/workflows/pages.yml` собирает `pnpm build:pages` и публикует `out/`.
- Адрес: `https://<owner>.github.io/<repo>/` (basePath = имя репозитория).
- Ограничения: заказы не сохраняются (только WhatsApp), Telegram-бота нет, каталог берётся из `data/seed`. Чтобы обновить товары, правится `data/seed/products.json` и фото в `public/catalog/`, потом push.
- Номер WhatsApp задаётся в Actions Variables `WHATSAPP_NUMBER` / `WHATSAPP_DISPLAY`.

## Потом: полный режим (Vercel + Supabase + бот, ≈ 20 минут)

## 0. Что понадобится
- Аккаунты: [supabase.com](https://supabase.com) (Free), [vercel.com](https://vercel.com) (Hobby), GitHub.
- Номер WhatsApp владелицы.
- Telegram владелицы.

## 1. Supabase
1. Создать проект в регионе `eu-central-1` (Frankfurt).
2. Привязать проект и применить миграции:
   ```bash
   pnpm supabase link --project-ref <ref>
   pnpm supabase db push
   ```
3. Взять ключи в Settings → API: `URL`, `anon`, `service_role`.

## 2. Telegram-бот
1. В [@BotFather](https://t.me/BotFather) выполнить `/newbot` → получить `TELEGRAM_BOT_TOKEN`. Аватарку и описание можно задать там же.
2. Владелица пишет [@userinfobot](https://t.me/userinfobot) → её числовой ID пойдёт в `OWNER_TELEGRAM_IDS`.
3. Секрет вебхука: `openssl rand -hex 24` → `TELEGRAM_WEBHOOK_SECRET`.

## 3. Vercel
1. Импортировать репозиторий.
2. В Environment Variables внести всё из `.env.example`, `NEXT_PUBLIC_SITE_URL` = боевой домен.
3. Задеплоить.

## 4. Каталог и вебхук
```bash
# локально, с прод-переменными в .env.production.local
pnpm tsx --env-file=.env.production.local scripts/seed-catalog.ts
pnpm tsx --env-file=.env.production.local scripts/set-webhook.ts
```

## 5. Проверка
- [ ] Главная открывается, видны 62 товара.
- [ ] Владелица пишет боту `/start` → видит меню.
- [ ] Тестовый заказ → открылся WhatsApp, заказ пришёл в бот.
- [ ] Добавить тестовый товар через бот → он появился на сайте → удалить.

## Локальная разработка
```bash
colima start                # Docker для Supabase
pnpm supabase start         # БД + Storage на :54321
pnpm seed:catalog           # 62 товара
pnpm dev                    # http://localhost:3000
pnpm test:bot               # smoke-тест бота без Telegram
```
