-- Announcements
create table if not exists public.announcements (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  body        text,
  emoji       text,
  created_by  text not null,
  pinned      boolean not null default false,
  created_at  timestamptz not null default now()
);

alter table public.announcements enable row level security;

create policy "announcements_select_open"
  on public.announcements for select to anon using (true);

create policy "announcements_insert_open"
  on public.announcements for insert to anon with check (true);

create policy "announcements_delete_open"
  on public.announcements for delete to anon using (true);

-- Reminders
create table if not exists public.reminders (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  content     text,
  created_by  text not null,
  resolved    boolean not null default false,
  due_date    date,
  due_time    text,
  type        text not null default 'team' check (type in ('personal', 'team')),
  created_at  timestamptz not null default now()
);

alter table public.reminders enable row level security;

create policy "reminders_select_open"
  on public.reminders for select to anon using (true);

create policy "reminders_insert_open"
  on public.reminders for insert to anon with check (true);

create policy "reminders_update_open"
  on public.reminders for update to anon using (true);

create policy "reminders_delete_open"
  on public.reminders for delete to anon using (true);

-- Reminder completions
create table if not exists public.reminder_completions (
  id            uuid primary key default gen_random_uuid(),
  reminder_id   uuid not null references public.reminders(id) on delete cascade,
  nickname      text not null,
  completed_at  timestamptz not null default now(),
  unique (reminder_id, nickname)
);

alter table public.reminder_completions enable row level security;

create policy "completions_select_open"
  on public.reminder_completions for select to anon using (true);

create policy "completions_insert_open"
  on public.reminder_completions for insert to anon with check (true);

create policy "completions_delete_open"
  on public.reminder_completions for delete to anon using (true);

-- Mood submissions
create table if not exists public.mood_submissions (
  id            uuid primary key default gen_random_uuid(),
  nickname      text not null,
  week_number   int not null,
  year          int not null,
  score         int not null check (score between 1 and 5),
  mood_key      text not null check (mood_key in ('great','good','okay','meh','rough')),
  note          text,
  public_name   boolean not null default false,
  submitted_at  timestamptz not null default now(),
  unique (nickname, week_number, year)
);

alter table public.mood_submissions enable row level security;

create policy "mood_select_open"
  on public.mood_submissions for select to anon using (true);

create policy "mood_insert_open"
  on public.mood_submissions for insert to anon with check (true);

create policy "mood_update_open"
  on public.mood_submissions for update to anon using (true);
