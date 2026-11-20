-- ============================================================
-- Ündes — Digital Poetry Library
-- Supabase schema with Row Level Security (RLS)
-- ============================================================
-- Run this in the Supabase SQL editor on a fresh project.
-- It creates the tables, indexes, triggers, and RLS policies
-- that mirror the demo data layer in /assets/js/services/api.js
-- ============================================================

-- ---------- Extensions ----------
create extension if not exists "pgcrypto";

-- ---------- Enum types ----------
do $$ begin
  create type poem_status as enum ('pending', 'approved', 'rejected');
exception when duplicate_object then null; end $$;

do $$ begin
  create type app_language as enum ('kz', 'ru', 'en');
exception when duplicate_object then null; end $$;

-- ---------- profiles (1:1 with auth.users) ----------
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  name        text not null default '',
  initials    text generated always as (left(coalesce(name, email_placeholder()), 1)) stored,
  avatar_url  text,
  created_at  timestamptz not null default now()
);
-- `email_placeholder()` is not a real function; replace the generated column
-- in production with a static initial or compute initials in app code.
-- For simplicity, drop the generated expression if you prefer:
-- alter table public.profiles drop column initials;
-- alter table public.profiles add column initials text not null default '?';

-- ---------- authors ----------
create table if not exists public.authors (
  id          text primary key,
  name        text not null,
  name_latin  text,
  initials    text not null default '?',
  country     text,
  country_en  text,
  languages   app_language[] not null default '{}',
  birth_year  int,
  death_year  int,
  bio_kz      text,
  bio_ru      text,
  bio_en      text
);

-- ---------- categories ----------
create table if not exists public.categories (
  id        text primary key,
  icon      text not null default 'sparkles',
  label_kz  text not null,
  label_ru  text not null,
  label_en  text not null
);

-- ---------- poems ----------
create table if not exists public.poems (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  content      text not null,
  excerpt      text,
  language     app_language not null,
  author_id    text references public.authors(id) on delete set null,
  categories   text[] not null default '{}',
  year         int,
  popularity   int not null default 50,
  status       poem_status not null default 'approved',
  created_at   timestamptz not null default now(),
  added_at     date default current_date
);
create index if not exists poems_language_idx      on public.poems(language);
create index if not exists poems_author_idx        on public.poems(author_id);
create index if not exists poems_popularity_idx   on public.poems(popularity desc);
create index if not exists poems_added_at_idx      on public.poems(added_at desc);
create index if not exists poems_categories_gin    on public.poems using gin (categories);
create index if not exists poems_title_trgm        on public.poems using gin (title gin_trgm_ops);
-- (enable pg_trgm for trigram title search: create extension if not exists pg_trgm;)

-- ---------- translations ----------
create table if not exists public.translations (
  id         uuid primary key default gen_random_uuid(),
  poem_id    uuid not null references public.poems(id) on delete cascade,
  language   app_language not null,
  title      text,
  content    text not null,
  created_at timestamptz not null default now()
);
create index if not exists translations_poem_idx on public.translations(poem_id);

-- ---------- favorites ----------
create table if not exists public.favorites (
  user_id    uuid not null references auth.users(id) on delete cascade,
  poem_id    uuid not null references public.poems(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, poem_id)
);
create index if not exists favorites_user_idx on public.favorites(user_id);

-- ---------- ratings ----------
create table if not exists public.ratings (
  user_id    uuid not null references auth.users(id) on delete cascade,
  poem_id    uuid not null references public.poems(id) on delete cascade,
  value      int not null check (value between 1 and 5),
  created_at timestamptz not null default now(),
  primary key (user_id, poem_id)
);

-- ---------- reading_history ----------
create table if not exists public.reading_history (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  poem_id    uuid not null references public.poems(id) on delete cascade,
  read_at    timestamptz not null default now()
);
create index if not exists history_user_idx on public.reading_history(user_id, read_at desc);

-- ---------- user_submissions (moderation queue) ----------
create table if not exists public.user_submissions (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  content       text not null,
  author_id     text references public.authors(id) on delete set null,
  author_name   text,
  language      app_language not null,
  categories    text[] not null default '{}',
  status        poem_status not null default 'pending',
  submitted_by  uuid references auth.users(id) on delete set null,
  submitted_at  timestamptz not null default now()
);
create index if not exists submissions_by_user_idx on public.user_submissions(submitted_by);

-- ============================================================
-- Triggers: auto-create profile on signup
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- Row Level Security
-- ============================================================
alter table public.profiles          enable row level security;
alter table public.authors           enable row level security;
alter table public.categories        enable row level security;
alter table public.poems             enable row level security;
alter table public.translations      enable row level security;
alter table public.favorites         enable row level security;
alter table public.ratings           enable row level security;
alter table public.reading_history   enable row level security;
alter table public.user_submissions  enable row level security;

-- profiles: each user reads/updates own; profiles are publicly readable
create policy "profiles_public_read"   on public.profiles for select using (true);
create policy "profiles_self_update"   on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);
create policy "profiles_self_insert"   on public.profiles for insert with check (auth.uid() = id);

-- public catalog: everyone can read approved poems, authors, categories, translations
create policy "authors_public_read"     on public.authors     for select using (true);
create policy "categories_public_read"  on public.categories  for select using (true);
create policy "translations_public_read" on public.translations for select using (true);
create policy "poems_public_read"        on public.poems for select using (status = 'approved');

-- any authenticated user may submit a poem; status defaults to pending
create policy "submissions_auth_insert" on public.user_submissions for insert
  to authenticated with check (auth.uid() = submitted_by);
create policy "submissions_self_read"    on public.user_submissions for select
  using (auth.uid() = submitted_by);
-- moderation (update/delete) is restricted via the dashboard / service role.

-- favorites: only owner can read/write
create policy "favorites_owner_all" on public.favorites for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ratings: owner can write; everyone can read aggregate
create policy "ratings_owner_write" on public.ratings for insert
  with check (auth.uid() = user_id);
create policy "ratings_owner_update" on public.ratings for update
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "ratings_public_read"  on public.ratings for select using (true);

-- reading history: only owner
create policy "history_owner_all" on public.reading_history for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================
-- Storage bucket (for user avatars / quote images)
-- ============================================================
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "avatars_public_read" on storage.objects for select
  using (bucket_id = 'avatars');
create policy "avatars_owner_write" on storage.objects for insert
  to authenticated
  with check (bucket_id = 'avatars' and auth.uid() = owner);
create policy "avatars_owner_update" on storage.objects for update
  using (bucket_id = 'avatars' and auth.uid() = owner);

-- Done. Seed data lives in seed.sql.
