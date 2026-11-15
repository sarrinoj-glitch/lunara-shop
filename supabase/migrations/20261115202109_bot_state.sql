-- Состояние Telegram-бота. Откат: drop table bot_sessions, bot_updates.

create table public.bot_updates (
  update_id bigint primary key,
  created_at timestamptz not null default now()
);

create table public.bot_sessions (
  chat_id bigint primary key,
  state varchar(40) not null default 'idle',
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

create trigger trg_bot_sessions_updated_at before update on public.bot_sessions
for each row execute function public.set_updated_at();

alter table public.bot_updates enable row level security;
alter table public.bot_sessions enable row level security;
-- Политик нет: доступ только service_role.
