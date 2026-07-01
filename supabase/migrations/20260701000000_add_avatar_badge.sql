-- Add avatar badge preference to users table
alter table public.users
  add column avatar_badge text not null default 'none';

-- Lock avatar_badge against anon updates (same pattern as other avatar fields)
alter policy "users_update_last_seen_only"
  on public.users
  with check (
    avatar_color  = (select avatar_color  from public.users where id = users.id) and
    avatar_emoji  = (select avatar_emoji  from public.users where id = users.id) and
    avatar_badge  = (select avatar_badge  from public.users where id = users.id) and
    nickname      = (select nickname      from public.users where id = users.id)
  );
