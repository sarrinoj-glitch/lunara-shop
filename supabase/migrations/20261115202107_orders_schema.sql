-- Заказы. Откат: drop function create_order; drop table order_items, orders.

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  number int generated always as identity (start with 1001) unique,
  customer_name varchar(60) not null,
  customer_phone varchar(16) not null,
  city varchar(80) not null,
  comment varchar(500),
  total numeric(12,2) not null check (total >= 0),
  status varchar(12) not null default 'new' check (status in ('new','in_work','done','cancelled')),
  idempotency_key uuid not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

create trigger trg_orders_updated_at before update on public.orders
for each row execute function public.set_updated_at();

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  name_snapshot varchar(200) not null,
  price_snapshot numeric(12,2) not null,
  quantity int not null check (quantity between 1 and 99),
  line_total numeric(12,2) generated always as (quantity * price_snapshot) stored,
  created_at timestamptz not null default now()
);

create index idx_orders_open_created on public.orders (created_at desc) where status in ('new','in_work');
create index idx_order_items_order_id on public.order_items (order_id);

alter table public.orders enable row level security;
alter table public.order_items enable row level security;
-- Политик нет: anon/authenticated не имеют доступа. Пишет только service_role.

-- Атомарное создание заказа. Цены берутся из БД, не от клиента.
-- p_items: [{ "product_id": uuid, "quantity": int }]
create or replace function public.create_order(
  p_idempotency_key uuid,
  p_name varchar, p_phone varchar, p_city varchar, p_comment varchar,
  p_items jsonb
) returns table (order_id uuid, order_number int, order_total numeric, created boolean)
language plpgsql security definer set search_path = public as $$
declare
  v_order public.orders;
  v_total numeric(12,2);
  v_unavailable text;
begin
  select * into v_order from public.orders o where o.idempotency_key = p_idempotency_key;
  if found then
    return query select v_order.id, v_order.number, v_order.total, false;
    return;
  end if;

  select string_agg(i->>'product_id', ',') into v_unavailable
  from jsonb_array_elements(p_items) i
  left join public.products p on p.id = (i->>'product_id')::uuid and p.status = 'published' and p.in_stock
  where p.id is null;
  if v_unavailable is not null then
    raise exception 'UNAVAILABLE:%', v_unavailable using errcode = 'P0001';
  end if;

  select sum(p.price * (i->>'quantity')::int) into v_total
  from jsonb_array_elements(p_items) i
  join public.products p on p.id = (i->>'product_id')::uuid;

  insert into public.orders (customer_name, customer_phone, city, comment, total, idempotency_key)
  values (p_name, p_phone, p_city, nullif(p_comment, ''), v_total, p_idempotency_key)
  returning * into v_order;

  insert into public.order_items (order_id, product_id, name_snapshot, price_snapshot, quantity)
  select v_order.id, p.id, p.name, p.price, (i->>'quantity')::int
  from jsonb_array_elements(p_items) i
  join public.products p on p.id = (i->>'product_id')::uuid;

  return query select v_order.id, v_order.number, v_order.total, true;
end $$;

revoke all on function public.create_order from public, anon, authenticated;
grant execute on function public.create_order to service_role;
