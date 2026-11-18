-- DocSumm — Supabase schema (dieksekusi sekali di SQL Editor proyek
-- Supabase, atau via `supabase db push`). Cerminan docs/SCHEMA.md.
-- RLS: setiap user hanya bisa CRUD baris miliknya sendiri.
-- Bucket `documents` privat; file diakses lewat URL bertanda tangan
-- atau policy Storage (lihat catatan di bawah).

-- ---------------------------------------------------------------------------
-- profiles (1:1 dengan auth.users)
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  email text,
  avatar_url text,
  plan text not null default 'free' check (plan in ('free', 'pro')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles: read own" on public.profiles;
create policy "profiles: read own" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles: update own" on public.profiles;
create policy "profiles: update own" on public.profiles
  for update using (auth.uid() = id);

-- Profil dibuat otomatis saat user mendaftar.
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, email)
  values (new.id, new.raw_user_meta_data ->> 'full_name', new.email)
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- templates
-- ---------------------------------------------------------------------------
create table if not exists public.templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  description text,
  fields jsonb not null default '[]'::jsonb,
  output_mode text not null default 'card' check (output_mode in ('card', 'table')),
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.templates enable row level security;

drop policy if exists "templates: own rows" on public.templates;
create policy "templates: own rows" on public.templates
  for all using (auth.uid() = user_id);

create index if not exists templates_user_id_idx on public.templates (user_id);

-- ---------------------------------------------------------------------------
-- documents
-- ---------------------------------------------------------------------------
create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  file_url text not null,
  file_type text not null check (file_type in ('pdf', 'image')),
  page_count int,
  status text not null default 'processing' check (status in ('processing', 'done', 'error')),
  raw_text text,
  summary_json jsonb,
  template_id uuid references public.templates (id) on delete set null,
  output_mode text not null default 'card' check (output_mode in ('card', 'table')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.documents enable row level security;

drop policy if exists "documents: own rows" on public.documents;
create policy "documents: own rows" on public.documents
  for all using (auth.uid() = user_id);

create index if not exists documents_user_id_idx on public.documents (user_id);
create index if not exists documents_status_idx on public.documents (status);
create index if not exists documents_created_at_idx on public.documents (created_at desc);

-- ---------------------------------------------------------------------------
-- contact_requests (insert publik, tanpa read dari klien)
-- ---------------------------------------------------------------------------
create table if not exists public.contact_requests (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  company text,
  message text not null,
  source text not null default 'general',
  created_at timestamptz not null default now()
);

alter table public.contact_requests enable row level security;

drop policy if exists "contact_requests: insert only" on public.contact_requests;
create policy "contact_requests: insert only" on public.contact_requests
  for insert with check (true);

-- ---------------------------------------------------------------------------
-- Storage bucket `documents` (buat via Dashboard → Storage bila belum ada;
-- SQL di bawah hanya policy-nya).
--   insert into storage.buckets (id, name, public) values ('documents', 'documents', false);
-- ---------------------------------------------------------------------------
drop policy if exists "storage documents: own files" on storage.objects;
create policy "storage documents: own files" on storage.objects
  for all using (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
