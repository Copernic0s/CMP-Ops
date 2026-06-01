-- Run in Supabase SQL editor before Hermes sync.

create table if not exists public.cmp_owner_access (
  id uuid primary key default gen_random_uuid(),
  company_key text not null unique,
  company_name text not null,
  owner_name text,
  owner_email text,
  username text,
  password_ciphertext text,
  password_hint text,
  password_reference text,
  last_synced_at timestamptz not null default now(),
  source text not null default 'cmp',
  source_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cmp_card_status (
  id uuid primary key default gen_random_uuid(),
  company_key text not null,
  company_name text not null,
  account_identifier text not null,
  current_status text not null default 'unknown',
  last_seen_status text,
  status_changed_at timestamptz,
  last_synced_at timestamptz not null default now(),
  source text not null default 'cmp',
  source_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_key, account_identifier)
);

create table if not exists public.cmp_sync_audit (
  id uuid primary key default gen_random_uuid(),
  sync_run_id uuid not null default gen_random_uuid(),
  source text not null default 'cmp',
  run_type text not null,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  records_found integer not null default 0,
  records_updated integer not null default 0,
  error text,
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists cmp_owner_access_synced_idx on public.cmp_owner_access (last_synced_at desc);
create index if not exists cmp_owner_access_company_name_idx on public.cmp_owner_access (company_name);
create index if not exists cmp_card_status_company_idx on public.cmp_card_status (company_key);
create index if not exists cmp_card_status_synced_idx on public.cmp_card_status (last_synced_at desc);
create index if not exists cmp_sync_audit_started_idx on public.cmp_sync_audit (started_at desc);

alter table public.cmp_owner_access enable row level security;
alter table public.cmp_card_status enable row level security;
alter table public.cmp_sync_audit enable row level security;

drop policy if exists "cmp_owner_access_read_authenticated" on public.cmp_owner_access;
create policy "cmp_owner_access_read_authenticated"
  on public.cmp_owner_access
  for select
  to authenticated
  using (true);

drop policy if exists "cmp_card_status_read_authenticated" on public.cmp_card_status;
create policy "cmp_card_status_read_authenticated"
  on public.cmp_card_status
  for select
  to authenticated
  using (true);

drop policy if exists "cmp_sync_audit_read_authenticated" on public.cmp_sync_audit;
create policy "cmp_sync_audit_read_authenticated"
  on public.cmp_sync_audit
  for select
  to authenticated
  using (true);

-- Writes are service-role only.
