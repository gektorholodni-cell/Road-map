-- Совместная игра Islands Roadmap. Выполнить один раз: Supabase → SQL Editor → New query → Run.
-- Комнаты хранят общий прогресс. Прямого доступа к таблице нет: читать и сохранять
-- можно только через две функции и только зная код комнаты, поэтому чужие комнаты не перечислить.

create table if not exists public.rooms (
  id text primary key check (char_length(id) between 8 and 32),
  project text not null check (octet_length(project) < 2000000),
  updated_at timestamptz not null default now()
);

alter table public.rooms enable row level security;

create or replace function public.get_room(room_id text)
returns text
language sql
security definer
set search_path = public
as $$
  select project from public.rooms where id = room_id
$$;

create or replace function public.save_room(room_id text, data text)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.rooms (id, project, updated_at)
  values (room_id, data, now())
  on conflict (id) do update set project = excluded.project, updated_at = now()
$$;

revoke all on function public.get_room(text) from public;
revoke all on function public.save_room(text, text) from public;
grant execute on function public.get_room(text) to anon, authenticated;
grant execute on function public.save_room(text, text) to anon, authenticated;
