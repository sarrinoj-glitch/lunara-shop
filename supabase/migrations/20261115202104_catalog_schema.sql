-- Каталог: бренды, категории, товары, фото.
-- Откат: drop table product_images, products, categories, brands; drop function set_updated_at.

create extension if not exists pg_trgm with schema extensions;

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

create table public.brands (
  id uuid primary key default gen_random_uuid(),
  name varchar(120) not null unique,
  slug varchar(120) not null unique,
  created_at timestamptz not null default now()
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  slug varchar(40) not null unique,
  name varchar(60) not null,
  sort int not null default 0,
  created_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  slug varchar(160) not null unique,
  brand_id uuid not null references public.brands(id),
  category_id uuid not null references public.categories(id),
  name varchar(200) not null,
  description text check (description is null or char_length(description) <= 5000),
  aroma varchar(80),
  volume varchar(40),
  price numeric(12,2) not null check (price > 0),
  old_price numeric(12,2) check (old_price is null or old_price > price),
  discount_percent int generated always as (
    case when old_price is null then null
         else round((1 - price / old_price) * 100)::int end
  ) stored,
  status varchar(12) not null default 'draft' check (status in ('draft','published','hidden')),
  in_stock boolean not null default true,
  is_new boolean not null default false,
  is_hit boolean not null default false,
  sort int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

create trigger trg_products_updated_at before update on public.products
for each row execute function public.set_updated_at();

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  path varchar(300) not null,
  width int,
  height int,
  sort int not null default 0,
  created_at timestamptz not null default now()
);

-- Индексы под запросы витрины и бота (SPEC, модуль 1)
create index idx_products_published_sort on public.products (sort, created_at desc) where status = 'published';
create index idx_products_category_id on public.products (category_id);
create index idx_products_brand_id on public.products (brand_id);
create index idx_products_name_trgm on public.products using gin (name extensions.gin_trgm_ops);
create index idx_product_images_product_id_sort on public.product_images (product_id, sort);

-- RLS: anon/authenticated читают только опубликованное, запись — только service_role
alter table public.brands enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;

create policy "public reads brands" on public.brands for select to anon, authenticated using (true);
create policy "public reads categories" on public.categories for select to anon, authenticated using (true);
create policy "public reads published products" on public.products for select to anon, authenticated
  using (status = 'published');
create policy "public reads images of published products" on public.product_images for select to anon, authenticated
  using (exists (select 1 from public.products p where p.id = product_images.product_id and p.status = 'published'));

-- Справочники
insert into public.brands (name, slug) values ('La Sultane de Saba', 'la-sultane-de-saba');
insert into public.categories (slug, name, sort) values
  ('telo', 'Тело', 1),
  ('litso', 'Лицо', 2),
  ('ruki', 'Руки', 3),
  ('aromaty', 'Ароматы', 4),
  ('dom', 'Для дома', 5),
  ('nabory', 'Наборы', 6);
