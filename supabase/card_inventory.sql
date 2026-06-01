-- Run in Supabase SQL editor before inventory sync.

create table if not exists public.cmp_card_inventory (
  id uuid primary key default gen_random_uuid(),
  card_number text not null unique,
  company_key text not null,
  company_name text not null,
  organization text,
  efs_account text,
  company_status text not null default 'unknown',
  card_status text not null default 'unknown',
  driver_name text,
  driver_id text,
  unit_number text,
  last_used_date text,
  source text not null default 'cmp',
  source_metadata jsonb not null default '{}'::jsonb,
  last_synced_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists cmp_card_inventory_company_idx on public.cmp_card_inventory (company_key);
create index if not exists cmp_card_inventory_synced_idx on public.cmp_card_inventory (last_synced_at desc);
create index if not exists cmp_card_inventory_status_idx on public.cmp_card_inventory (card_status);

alter table public.cmp_card_inventory enable row level security;

drop policy if exists "cmp_card_inventory_read_authenticated" on public.cmp_card_inventory;
create policy "cmp_card_inventory_read_authenticated"
  on public.cmp_card_inventory
  for select
  to authenticated
  using (true);

-- Writes are service-role only.
