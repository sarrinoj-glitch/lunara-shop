# SPEC — «LUNARA», интернет-магазин восточной косметики

Источник: `docs/PROJECT_IDEA.md`. Уровень детализации: реализуется без уточнений.

---

## 0. Глобальные решения
- **Стек:** Next.js 16 App Router (Cache Components: `use cache` + `cacheTag`) + TypeScript strict, Tailwind v4, shadcn/ui, `motion` (framer-motion), Supabase (Postgres + Storage), grammY, sharp, zod, строки UI в `messages/ru.json` через `lib/i18n.ts` (одна локаль, без библиотеки).
- **Роли:**
  - `anon` — покупательница: читает опубликованный каталог, создаёт заказ только через server action.
  - `owner` — владелица: управляет всем через Telegram-бот. Бот работает на сервере service-role-клиентом и проверяет Telegram ID по whitelist `OWNER_TELEGRAM_IDS`.
- **Валюта:** ₽, цены целые, хранятся в `numeric(12,2)`. Формат `2 795 ₽` (`Intl.NumberFormat('ru-RU')`).
- **Кэш витрины:** `'use cache'` + `cacheLife('max')` + `cacheTag('products')`. Бот после любых изменений вызывает `revalidateTag('products', 'max')`. Товар на сайте обновляется за ≤ 5 секунд.

---

## Модуль 1. Каталог (данные)

### User stories
- Как покупательница, я хочу видеть только товары в продаже, чтобы не выбирать скрытое.
- Как покупательница, я хочу фильтровать по категории и аромату, чтобы найти «свой» аромат во всей линейке.
- Как владелица, я хочу скрыть товар, не удаляя его, чтобы вернуть одной кнопкой.
- Как владелица, я хочу пометить товар «нет в наличии», чтобы его было видно, но нельзя было купить.

### Модель данных
```sql
brands (
  id uuid pk default gen_random_uuid(),
  name varchar(120) not null unique,
  slug varchar(120) not null unique,
  created_at timestamptz not null default now()
)

categories (
  id uuid pk, slug varchar(40) unique not null, name varchar(60) not null,
  sort int not null default 0, created_at timestamptz not null default now()
)
-- сид: litso «Лицо», telo «Тело», ruki «Руки», aromaty «Ароматы», dom «Для дома», nabory «Наборы»

products (
  id uuid pk,
  slug varchar(160) unique not null,          -- транслит названия + суффикс при коллизии
  brand_id uuid not null references brands(id),
  category_id uuid not null references categories(id),
  name varchar(200) not null,
  description text,                            -- длинный текст, ограничение 5000 через check
  aroma varchar(80),                           -- «Амбра, Ваниль и Пачули» — для фильтра-чипсов
  volume varchar(40),                          -- «200 мл», «50+10 мл»
  price numeric(12,2) not null check (price > 0),
  old_price numeric(12,2) check (old_price is null or old_price > price),
  discount_percent int generated always as (
    case when old_price is null then null else round((1 - price/old_price)*100)::int end) stored,
  status varchar(12) not null default 'draft' check (status in ('draft','published','hidden')),
  in_stock boolean not null default true,
  is_new boolean not null default false,
  is_hit boolean not null default false,
  sort int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz                      -- триггер set_updated_at
)

product_images (
  id uuid pk,
  product_id uuid not null references products(id) on delete cascade,  -- владение очевидно
  path varchar(300) not null,                  -- путь в bucket products
  width int, height int,
  sort int not null default 0,
  created_at timestamptz not null default now()
)
```
**Индексы** (под запросы витрины):
- `idx_products_published_sort on products(sort, created_at desc) where status='published'` — главная и каталог.
- `idx_products_category_id on products(category_id)` — JOIN и фильтр.
- `idx_products_brand_id on products(brand_id)`.
- `idx_product_images_product_id_sort on product_images(product_id, sort)`.
- `idx_products_name_trgm` GIN `gin_trgm_ops` по `name` — поиск в боте и на сайте.

**RLS:**
- Включён на всех таблицах.
- `anon` и `authenticated`: SELECT `brands`, `categories`, `product_images` (если родительский товар `published`), `products where status='published'`.
- Запись всем закрыта. Пишет только service-role (сервер и бот).

### Бизнес-логика
- На витрине только `status='published'`.
- `in_stock=false`: карточка видна, кнопка «Нет в наличии» неактивна.
- Сортировка каталога: `sort asc, created_at desc`. Варианты: «Сначала новые», «Дешевле», «Дороже», «Со скидкой».
- Цена на карточке: `price`. Если есть `old_price`, она перечёркнута, и рядом бейдж `−{discount_percent}%`.

### Крайние случаи
- У товара нет фото → плейсхолдер с монограммой «А» на песочном фоне.
- `old_price <= price` из бота → бот отклоняет: «Старая цена должна быть больше новой».
- Удалённый товар есть в старой корзине → при открытии корзины позиция помечается «Товар больше недоступен» и исключается из суммы.

---

## Модуль 2. Витрина (экраны)

Все экраны: **Loading** (скелетоны), **Error** (текст + «Попробовать снова» + traceId), **Empty** (объяснение + CTA), **Success**. Mobile-first.

### 2.1 Главная `/`
1. **Шапка (sticky):**
   - Слева «Каталог» (бургер, открывает Sheet с категориями), по центру логотип «LUNARA», справа поиск, WhatsApp, корзина со счётчиком.
   - При скролле > 40px шапка сжимается (h 72→56) и получает `backdrop-blur` и кремовую подложку.
2. **Hero:**
   - Слева огромный заголовок uppercase thin «ВОСТОЧНЫЙ / РИТУАЛ / УХОДА», курсивное слово-акцент Cormorant.
   - Справа packshot в **арочной рамке** (фирменный мотив, отсылка к марокканским аркам на упаковке).
   - Под заголовком круглая кнопка «Смотреть →» с магнитным эффектом.
   - Слайдер из 3 слайдов (линейки ароматов), счётчик `01/03` и стрелки.
3. **Бегущая строка** на терракотовом фоне: «ОРИГИНАЛЬНАЯ ПРОДУКЦИЯ ✦ ПРОБНИК К КАЖДОМУ ЗАКАЗУ ✦ ДОСТАВКА ПО РОССИИ ✦ ОФОРМЛЕНИЕ В WHATSAPP ✦». Скорость зависит от скорости скролла.
4. **Категории:** 3 крупные карточки «ТЕЛО / ЛИЦО / АРОМАТЫ». Огромное слово наезжает на фото. На hover фото увеличивается до scale 1.06, слово сдвигается.
5. **Вкладки «Новинки · Хиты · Скидки»:** анимированное подчёркивание (`layoutId`) и сетка 2 колонки на мобиле, 4 на десктопе, по 8 товаров. Ниже кнопка «Весь каталог».
6. **Ритуалы ароматов:** список линеек ароматов крупным текстом (accordion-список, как журнал skincareagents). На десктопе при hover за курсором следует фото товара линейки, на мобиле фото выезжает внутри раскрытой строки. Клик ведёт в `/catalog?aroma=…`.
7. **«Как заказать» 01/02/03:** «Соберите корзину» → «Оформите за минуту» → «Мы напишем в WhatsApp». Номера outline-цифрами 120px.
8. **Манифест:** «Ритуалы Востока. Хаммам, специи, роза — у вас дома.» Коллаж из 3 фото в арках, тонкая SVG-линия рисуется при скролле (`pathLength`).
9. **Футер:** тёмно-коричневый, контакты, WhatsApp, Telegram, «© LUNARA 2026», «Политика конфиденциальности».
10. **Плавающий бейдж (fixed, справа снизу):** круглый вращающийся текст «НАПИСАТЬ В WHATSAPP ✦ КОНСУЛЬТАЦИЯ ✦», внутри иконка WhatsApp. На мобиле 72px, сдвигается выше нижней панели корзины.

### 2.2 Каталог `/catalog`
- **Параметры:** `?category=telo&aroma=<slug>&sort=new|cheap|expensive|sale&q=`.
- **Шапка страницы:** заголовок категории uppercase, число товаров.
- **Ряд чипсов-категорий:** горизонтальный скролл. Под ним чипсы ароматов, как ингредиентные подборки cosmetos.
- **Сортировка:** select shadcn.
- **Сетка:** 2/3/4 колонки. Пагинации нет (≤ 200 товаров), подгрузка через `content-visibility`.
- **Empty:** «В этой подборке пока пусто. Попробуйте другой аромат или загляните во все товары.» + [Сбросить фильтры].

### 2.3 Карточка товара (компонент)
- Квадратное фото на песочном фоне `--sand`. Фото с белым фоном садятся через `mix-blend-multiply`.
- Бейджи: `−35%` (терракота), «Хит», «Новинка», «Нет в наличии».
- Hover (desktop): crossfade на 2-е фото, снизу выезжает кнопка «В корзину».
- Mobile: всегда видна круглая кнопка «+».
- Под фото: объём (мелко), название (2 строки), цена и старая цена.

### 2.4 Товар `/product/[slug]`
- **Галерея:** Embla (shadcn Carousel), свайп, точки. На десктопе миниатюры слева.
- **Справа:** бренд, название (Cormorant 40px), аромат-чип, объём, цена и старая цена, бейдж скидки.
- **Кнопки:** [− 1 +] и «В корзину» (полная ширина). Ниже «Спросить в WhatsApp» (wa.me с текстом «Здравствуйте! Вопрос по товару: …»).
- **Accordion:** «Описание», «Доставка и оплата», «Возврат».
- **Блок «Тот же аромат»:** товары с тем же `aroma`, до 8.
- **Mobile:** sticky-панель снизу с ценой и «В корзину».
- `generateMetadata`: title, description, og:image. JSON-LD Product.
- 404 → `not-found.tsx`: «Этот товар закончился или снят с продажи» + [В каталог].

### 2.5 Корзина (Sheet справа) и `/checkout`
- **Состояние:** zustand + `persist` в localStorage: `{ productId, slug, name, price, image, qty }[]`.
- **Sheet:**
  - Список позиций, кнопки ±, удалить (с undo-тостом), итог.
  - Кнопка «Оформить заказ» ведёт на `/checkout`.
  - Empty: «Корзина пока пуста. Начните с хитов — их выбирают чаще всего.» + [Смотреть хиты].
- **При открытии корзины:** server action `refreshCart(ids)` возвращает актуальные цены и наличие. Расхождения подсвечиваются.
- **`/checkout`:**
  - Форма react-hook-form + zod: имя (2–60), телефон (маска +7, 11 цифр), город (2–80), комментарий (≤ 500), чекбокс согласия на обработку ПДн (обязателен).
  - Справа (на мобиле сверху, сворачиваемо) состав заказа.
  - Кнопка «Оформить в WhatsApp».

### Анимации — карта (motion)
| Элемент | Эффект | Реализация |
|---|---|---|
| Заголовки секций | построчный reveal снизу из маски | `motion.span` + `overflow-hidden`, `whileInView`, stagger 0.08 |
| Hero-фото | лёгкий параллакс при скролле, y 0→−60 | `useScroll` + `useTransform` |
| Круглые CTA | магнит к курсору ±12px, стрелка уезжает и возвращается | `useMotionValue` + spring |
| Бегущая строка | бесконечный скролл, ускорение от скорости скролла | `useVelocity` (21st.dev «scroll-velocity marquee» как основа) |
| Сетки товаров | появление карточек stagger, fade+y16 | `variants` |
| Вкладки | скользящее подчёркивание + crossfade сетки | `layoutId`, `AnimatePresence mode="wait"` |
| Добавление в корзину | миниатюра «летит» в иконку корзины, счётчик подпрыгивает | portal + `animate` к rect иконки |
| Ритуалы | изображение следует за курсором | `useSpring` от mouse |
| Манифест | SVG-линия рисуется при скролле | `pathLength` от `scrollYProgress` |
| WhatsApp-бейдж | вращение текста по кругу 20s linear | CSS `animate-spin` slow / motion |
| Шапка | сжатие + blur | `useScroll` → state |

`prefers-reduced-motion` отключает параллакс, магнит, marquee-ускорение и полёт в корзину (`MotionConfig reducedMotion="user"`).

### Дизайн-система
- **Цвета (CSS-токены, Tailwind theme):**
  - `--terracotta #B4532A`
  - `--terracotta-deep #8E3B1C`
  - `--clay #D98B65`
  - `--brown #4A2C21`
  - `--espresso #2A1810` (текст)
  - `--cream #F6EEE4` (фон)
  - `--sand #ECDCC9` (подложки фото)
  - `--ivory #FBF7F2`
  - Все пары текст/фон ≥ 4.5:1: espresso на cream 15:1, cream на terracotta 4.6:1.
- **Шрифты (next/font, cyrillic):**
  - **Jost** 300/400/500 — заголовки uppercase и UI.
  - **Cormorant Garamond** 400 italic — акцентные слова и названия товара.
- **Фирменные мотивы:** арка (`border-radius: 999px 999px 0 0`), тонкие линии 1px brown/20, зерно-текстура 3% на терракотовых секциях.
- **Скругления:** карточки 0, кнопки pill, арки.

---

## Модуль 3. Заказы

### User stories
- Как покупательница, я хочу оформить заказ за минуту без регистрации, чтобы быстро договориться о доставке в WhatsApp.
- Как владелица, я хочу получать каждый заказ в Telegram, даже если клиентка не отправила сообщение в WhatsApp.
- Как владелица, я хочу менять статус заказа, чтобы видеть, что обработано.

### Модель данных
```sql
orders (
  id uuid pk,
  number int generated always as identity (start with 1001) unique,
  customer_name varchar(60) not null,
  customer_phone varchar(16) not null,          -- E.164 +7XXXXXXXXXX
  city varchar(80) not null,
  comment varchar(500),
  total numeric(12,2) not null check (total >= 0),
  status varchar(12) not null default 'new' check (status in ('new','in_work','done','cancelled')),
  idempotency_key uuid not null unique,         -- генерится на клиенте, защита от двойного клика
  created_at timestamptz not null default now(),
  updated_at timestamptz
)
order_items (
  id uuid pk,
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  name_snapshot varchar(200) not null,
  price_snapshot numeric(12,2) not null,
  quantity int not null check (quantity between 1 and 99),
  line_total numeric(12,2) generated always as (quantity * price_snapshot) stored,
  created_at timestamptz not null default now()
)
```
- **Индексы:** `idx_orders_status_created on orders(created_at desc) where status in ('new','in_work')` для бота. `idx_order_items_order_id`.
- **RLS:** включён, политик для anon/authenticated нет (deny). Пишет только server action через service-role.

### Server action `createOrder` (`app/checkout/actions.ts`)
- **Вход:** `{ idempotencyKey: uuid, customer: {name, phone, city, comment?}, items: [{productId, qty}] (1..50), consent: true }`.
- **Логика:**
  1. zod.
  2. Rate limit: 5 заказов в 10 минут с IP (in-memory LRU, MVP).
  3. Если `idempotencyKey` уже есть, вернуть существующий заказ.
  4. Загрузить товары из БД, игнорировать цены клиента. Все должны быть `published` и `in_stock`, иначе `E.VALIDATION` со списком.
  5. Транзакция (RPC `create_order` в SQL) создаёт order и items.
  6. Уведомить владелицу в Telegram (fire-and-forget, ошибка логируется, заказ не падает).
  7. Вернуть `{ ok: true, data: { number, whatsappUrl } }`.
- **`whatsappUrl`:** `https://wa.me/<NEXT_PUBLIC_WHATSAPP_NUMBER>?text=<urlencoded>`. Текст:
  ```
  Здравствуйте! Заказ №1024 на сайте LUNARA
  1. Крем для рук Амбра, Ваниль и Пачули × 2 — 5 590 ₽
  2. …
  Итого: 9 590 ₽
  Имя: Анна, город: Казань
  Комментарий: …
  ```
- **Клиент:**
  - Открывает `whatsappUrl` (на мобиле в том же окне, на десктопе в новой вкладке).
  - Показывает `/checkout/success?n=1024`: «Заказ №1024 принят. Если WhatsApp не открылся — [Открыть WhatsApp]. Мы также получили заказ и свяжемся с вами.»
  - Очищает корзину.
- **Ошибки:** 422 (товар недоступен → подсветить в корзине), 429, 503 (БД).

### Крайние случаи
- Двойной клик → одна запись (idempotency).
- Цена изменилась между корзиной и заказом → в заказ идёт цена БД, покупательница видит актуальную сумму на success-экране.
- Telegram недоступен → заказ сохранён, в логах warn.

---

## Модуль 4. Telegram-бот (админка)

### User stories
- Как владелица, я хочу добавить товар, ответив на 5–6 простых вопросов, чтобы не разбираться в админках.
- Как владелица, я хочу найти товар по слову и поменять цену или фото кнопкой.
- Как владелица, я хочу видеть новые заказы и отмечать их «в работе» или «выполнен».

### Технически
- **Route:** `POST /api/telegram/webhook`.
  - Проверка заголовка `X-Telegram-Bot-Api-Secret-Token === TELEGRAM_WEBHOOK_SECRET`, иначе 401.
  - Если `from.id` не в `OWNER_TELEGRAM_IDS`, ответ «Этот бот только для владельца магазина» без доступа к данным.
- **Идемпотентность:** таблица `bot_updates(update_id bigint pk, created_at)`. Повтор → 200 без действий.
- **Состояние диалога:** таблица `bot_sessions(chat_id bigint pk, state varchar(40), data jsonb not null default '{}', updated_at timestamptz)`. Сессия старше 24 ч сбрасывается.
- **Фото:**
  - `getFile` → скачать → sharp: rotate (EXIF), resize до 1600px по длинной стороне, WebP q80.
  - Загрузка в bucket `products` по пути `<productId>/<uuid>.webp`.
  - Максимум 6 фото на товар, файл ≤ 20 МБ (лимит Bot API).
- **Регистрация вебхука:** скрипт `pnpm bot:set-webhook` (setWebhook с secret_token, allowed_updates `message`, `callback_query`) и `setMyCommands`.

### Главное меню (reply keyboard, всегда снизу)
`➕ Добавить товар` · `📦 Товары` · `🧾 Заказы` · `❓ Помощь`

### Сценарий «Добавить товар» (FSM)
| Шаг (state) | Бот пишет | Ввод | Валидация |
|---|---|---|---|
| `add.photos` | «Пришлите фото товара (1–6). Когда закончите — нажмите «Готово»» [Готово] [Отмена] | фото / альбом | ≥ 1 фото |
| `add.name` | «Как называется товар?» | текст | 2–200 |
| `add.price` | «Цена в рублях? Например: 2795» | число | целое 1..10 000 000, пробелы игнор |
| `add.old_price` | «Есть старая цена (для скидки)?» [Нет скидки] | число | > price |
| `add.category` | «Категория?» inline-кнопки 6 категорий | callback | — |
| `add.aroma` | «Аромат?» кнопки существующих ароматов + [Другой — напишу] [Пропустить] | callback / текст | ≤ 80 |
| `add.volume` | «Объём? Например: 200 мл» [Пропустить] | текст | ≤ 40 |
| `add.description` | «Описание (можно скопировать с упаковки)» [Пропустить] | текст | ≤ 5000 |
| `add.preview` | превью-карточка (фото + текст) [✅ Опубликовать] [💾 В черновик] [✏️ Исправить…] [Отмена] | callback | — |

После публикации: «Готово! Товар на сайте: <ссылка>», revalidate. «✏️ Исправить» ведёт в меню полей.

### Сценарий «Товары»
- Бот: «Напишите часть названия или выберите:» [Последние 10] [Скрытые] [Нет в наличии].
- Поиск: trigram, до 10 результатов кнопками.
- **Карточка товара в боте** (фото + цена + статус):
  - [💰 Цена] [🏷 Скидка] [📷 Фото] [✏️ Название] [📝 Описание]
  - [✅ В наличии / 🚫 Нет в наличии]
  - [🙈 Скрыть / 👁 Показать]
  - [⭐ Хит] [🆕 Новинка]
  - [🗑 Удалить]
- **«📷 Фото»:** «Пришлите новые фото — они заменят старые» или [Добавить к текущим] / [Удалить фото №…].
- **«🗑 Удалить»:** подтверждение «Удалить навсегда? Лучше скрыть — тогда можно вернуть.» [🙈 Скрыть] [🗑 Удалить навсегда] [Отмена]. Удаление также чистит файлы в Storage.

### Сценарий «Заказы»
- Список: 10 последних `new` и `in_work`. Для каждого: «№1024 · Анна · 9 590 ₽ · новый».
- Карточка заказа: состав, телефон (кликабельный), город, комментарий.
  - Кнопки: [✍️ Написать в WhatsApp] (wa.me на номер клиентки), [🔄 В работе] [✅ Выполнен] [❌ Отменён].
- **Уведомление о новом заказе** приходит автоматически с теми же кнопками.

### Крайние случаи
- Владелица прислала текст, когда бот ждёт фото → «Сейчас нужно фото 📷 или нажмите «Готово»».
- Альбом из 10 фото → берём первые 6, сообщаем.
- Сессия протухла посреди добавления → «Начнём заново?», черновик сохранён как `draft`.
- `/start` в любой момент сбрасывает состояние, черновик остаётся.

---

## Модуль 5. Сид каталога
- **Скрипт:** `pnpm seed:catalog`.
  - Читает `data/seed/products.json` и `data/seed/images/*`.
  - Сжимает фото в WebP и грузит в Storage.
  - Upsert по `slug`: brand «La Sultane de Saba», категории, aroma (извлекается из названия по словарю линеек).
  - Ставит `status='published'`. `is_hit` получают 8 позиций, `is_new` — 8 последних.
- **Идемпотентен:** повторный запуск ничего не дублирует.

## Модуль 6. Нефункциональное
- **Lighthouse mobile:** Performance ≥ 85, A11y ≥ 95, SEO ≥ 95.
- **SEO:** `sitemap.ts`, `robots.ts`, `opengraph-image` с логотипом.
- **Изображения:** `next/image` с remotePatterns Supabase и `sizes` на каждой картинке.
- **Логи:** `lib/logger` (pino) с маскировкой телефонов `maskPhone`.
- **Env:** zod-валидация в `lib/env.ts`.

## Env
```
NEXT_PUBLIC_SITE_URL
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_WHATSAPP_NUMBER    # 79XXXXXXXXX (публичный — он и так виден в ссылке wa.me)
NEXT_PUBLIC_WHATSAPP_DISPLAY   # +7 (999) 123-45-67
TELEGRAM_BOT_TOKEN
TELEGRAM_WEBHOOK_SECRET
OWNER_TELEGRAM_IDS             # через запятую
```
