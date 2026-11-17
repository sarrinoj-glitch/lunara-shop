-- Незаконченный товар из бота: сохраняется, если владелица ушла с середины
-- добавления (/start, другой раздел меню, перерыв больше 24 ч), чтобы потом продолжить.
-- Формат: {"state": "add.price", "data": {...черновик...}}. null — незаконченного нет.
-- Откат: alter table public.bot_sessions drop column pending;

alter table public.bot_sessions add column pending jsonb;
