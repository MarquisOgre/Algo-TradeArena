-- Alphentra migration 020: broker-scoped MT5 market mappings
create table if not exists public.broker_market_mappings (
  id uuid primary key default gen_random_uuid(),
  broker_account_id uuid not null references public.broker_accounts(id) on delete cascade,
  market_id uuid not null references public.markets(id) on delete cascade,
  provider text not null default 'mt5',
  provider_symbol text,
  status text not null check (status in ('live', 'no_quote', 'unsupported')),
  metadata jsonb not null default '{}'::jsonb,
  last_verified_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (broker_account_id, market_id, provider)
);

create index if not exists broker_market_mappings_broker_idx
  on public.broker_market_mappings (broker_account_id, provider);

create index if not exists broker_market_mappings_market_idx
  on public.broker_market_mappings (market_id, provider);

alter table public.broker_market_mappings enable row level security;

revoke all on table public.broker_market_mappings from anon, authenticated;

grant select on table public.broker_market_mappings to authenticated;

drop policy if exists "Users can read their broker market mappings" on public.broker_market_mappings;

create policy "Users can read their broker market mappings"
on public.broker_market_mappings
for select
to authenticated
using (
  exists (
    select 1
    from public.broker_accounts ba
    where ba.id = broker_market_mappings.broker_account_id
      and ba.profile_id = auth.uid()
  )
);

comment on table public.broker_market_mappings is
  'Broker-account-specific MT5 instrument resolution and validation for Alphentra markets.';

comment on column public.broker_market_mappings.provider_symbol is
  'Actual broker/MT5 terminal symbol resolved for the Alphentra market, including broker suffixes or prefixes.';

comment on column public.broker_market_mappings.status is
  'Validated provider state for this broker account and market.';
