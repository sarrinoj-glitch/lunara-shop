# Правила проекта «АМБРА» (перекрывают общие правила с Рабочего стола)

Общие правила в `~/Desktop/.claude/rules/` написаны для другого проекта (CRM с Wazzup). Здесь действует следующее.

## Что неприменимо
- Wazzup24, `conversations`, `messages`, роли manager/head/admin, LLM Orchestrator в этом проекте не используются.
- Заказы в WhatsApp уходят ссылкой `wa.me` с готовым текстом, API WhatsApp не используется.
- Админки на сайте нет. Вся админка — Telegram-бот, владелица определяется по `OWNER_TELEGRAM_IDS`.

## Что действует как есть
- Миграции, RLS на каждой таблице, numeric для денег, CHECK вместо ENUM, индексы под запросы из `docs/SPEC.md`.
- zod на входе, коды ошибок из `lib/errors.ts`, `respond()/errorResponse()`, traceId, `logger` вместо console, `maskPhone` в логах.
- 4 состояния экрана, строки в `messages/ru.json`, токены цветов, a11y.

## Специфика
- Bucket `products` публичный на чтение (это фото товаров), запись только service-role. Путь `<productId>/<uuid>.webp`, имя файла от пользователя не используется.
- Вебхук Telegram проверяет `X-Telegram-Bot-Api-Secret-Token`, повторные `update_id` игнорируются (`bot_updates`).
- Тексты бота пишутся простым языком без терминов («товар скрыт с сайта», а не «status=hidden»).
- Анимации только через `motion` и `MotionConfig reducedMotion="user"`. Тяжёлые эффекты (магнит, курсор-превью) только на `(hover: hover)`.
