-- Публичный bucket для фото товаров (чтение всем, запись только service_role).
-- Откат: delete from storage.buckets where id = 'products';

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('products', 'products', true, 5242880, array['image/webp','image/jpeg','image/png'])
on conflict (id) do nothing;
