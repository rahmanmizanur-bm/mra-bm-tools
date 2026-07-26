-- ============================================================================
-- BM Tools — Pastebin schema for Supabase (run once in the SQL Editor).
-- Sets up the pastes table, Row-Level Security, the @webalive.com.au signup
-- lock, and the 30-day auto-cleanup.
-- ============================================================================

-- ── Table ───────────────────────────────────────────────────────────────────
create table if not exists public.pastes (
  id          text primary key,
  title       text,
  language    text not null default 'plaintext',
  content     text not null,
  visibility  text not null default 'webalive'
              check (visibility in ('public', 'webalive', 'private')),
  owner_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  owner_email text not null,
  created_at  timestamptz not null default now(),
  expires_at  timestamptz not null,
  constraint max_30_days check (expires_at <= created_at + interval '30 days')
);

create index if not exists ix_pastes_expires on public.pastes (expires_at);
create index if not exists ix_pastes_owner   on public.pastes (owner_id);

-- ── Row-Level Security ──────────────────────────────────────────────────────
alter table public.pastes enable row level security;

-- Create: signed-in users only; row must be owned by the caller and their email.
drop policy if exists pastes_insert on public.pastes;
create policy pastes_insert on public.pastes
  for insert to authenticated
  with check (
    owner_id = auth.uid()
    and lower(owner_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    and expires_at <= now() + interval '30 days'
  );

-- Read (policies are OR'd): public → anyone; webalive → any signed-in user;
-- private/own → owner. Expired rows are never returned.
drop policy if exists pastes_select_public on public.pastes;
create policy pastes_select_public on public.pastes
  for select to anon, authenticated
  using (visibility = 'public' and expires_at > now());

drop policy if exists pastes_select_webalive on public.pastes;
create policy pastes_select_webalive on public.pastes
  for select to authenticated
  using (visibility = 'webalive' and expires_at > now());

drop policy if exists pastes_select_own on public.pastes;
create policy pastes_select_own on public.pastes
  for select to authenticated
  using (owner_id = auth.uid() and expires_at > now());

-- Delete: owner only.
drop policy if exists pastes_delete_own on public.pastes;
create policy pastes_delete_own on public.pastes
  for delete to authenticated
  using (owner_id = auth.uid());

-- ── Domain lock: only @webalive.com.au may create an account ────────────────
create or replace function public.enforce_email_domain()
returns trigger
language plpgsql
security definer
as $$
begin
  if new.email is null or lower(new.email) not like '%@webalive.com.au' then
    raise exception 'Only @webalive.com.au accounts are allowed';
  end if;
  return new;
end;
$$;

drop trigger if exists enforce_email_domain on auth.users;
create trigger enforce_email_domain
  before insert on auth.users
  for each row execute function public.enforce_email_domain();

-- ── 30-day auto-cleanup (pg_cron) ───────────────────────────────────────────
-- Enable pg_cron first: Dashboard → Database → Extensions → pg_cron.
create extension if not exists pg_cron;

select cron.schedule(
  'delete-expired-pastes',
  '0 3 * * *',                                   -- nightly 03:00 UTC
  $$delete from public.pastes where expires_at <= now()$$
);

-- Inspect / remove later:
--   select * from cron.job;
--   select cron.unschedule('delete-expired-pastes');
