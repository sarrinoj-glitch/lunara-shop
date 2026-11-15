-- Атомарное добавление фото в сессию бота (альбом приходит параллельными апдейтами).
-- Откат: drop function bot_append_photo.

create or replace function public.bot_append_photo(p_chat_id bigint, p_file_id text, p_group_id text)
returns table (photo_count int, first_in_group boolean)
language plpgsql security definer set search_path = public as $$
declare
  v_prev_group text;
  v_count int;
begin
  select data->>'lastGroup' into v_prev_group from public.bot_sessions where chat_id = p_chat_id for update;

  update public.bot_sessions
  set data = jsonb_set(
               jsonb_set(data, '{photos}', coalesce(data->'photos', '[]'::jsonb) || to_jsonb(p_file_id)),
               '{lastGroup}', coalesce(to_jsonb(p_group_id), 'null'::jsonb))
  where chat_id = p_chat_id
  returning jsonb_array_length(data->'photos') into v_count;

  return query select v_count, (p_group_id is null or v_prev_group is distinct from p_group_id);
end $$;

revoke all on function public.bot_append_photo from public, anon, authenticated;
grant execute on function public.bot_append_photo to service_role;
