create extension if not exists citext;

create table public.users (
  id            uuid primary key default gen_random_uuid(),
  nickname      citext unique not null,
  avatar_color  text not null,
  avatar_emoji  text not null,
  created_at    timestamptz not null default now(),
  last_seen_at  timestamptz not null default now(),
  constraint nickname_length check (char_length(nickname) between 2 and 30),
  constraint nickname_chars  check (nickname ~ '^[a-zA-Z0-9 \-]+$')
);

create index users_nickname_lower_idx on public.users (nickname);

alter table public.users enable row level security;

-- SELECT: anyone can read
create policy "users_select_open"
  on public.users for select
  to anon
  using (true);

-- INSERT: anyone can create
create policy "users_insert_open"
  on public.users for insert
  to anon
  with check (true);

-- UPDATE: only last_seen_at can change; nickname and avatar fields are locked
create policy "users_update_last_seen_only"
  on public.users for update
  to anon
  using (true)
  with check (
    avatar_color = (select avatar_color from public.users where id = users.id) and
    avatar_emoji = (select avatar_emoji from public.users where id = users.id) and
    nickname     = (select nickname     from public.users where id = users.id)
  );
