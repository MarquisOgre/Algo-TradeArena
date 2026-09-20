-- Alphentra Database Migration 019
-- Provider status for every active market, including instruments with no current quote.

create table if not exists public.market_provider_status (
  id bigint generated always as identity primary key,
  market_id uuid not null references public.markets(id) on delete cascade,
  provider text not null,
  status text not null check (status in ('live', 'no_quote', 'unsupported')),
  provider_symbol text,
  checked_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (market_id, provider)
);

create index if not exists market_provider_status_provider_idx
  on public.market_provider_status(provider, status, checked_at desc);

create index if not exists market_provider_status_market_idx
  on public.market_provider_status(market_id, checked_at desc);

alter table public.market_provider_status enable row level security;

revoke all on table public.market_provider_status from anon;
revoke all on table public.market_provider_status from authenticated;
grant select on table public.market_provider_status to anon, authenticated;

drop policy if exists "market_provider_status_select_active" on public.market_provider_status;
create policy "market_provider_status_select_active"
on public.market_provider_status for select
to anon, authenticated
using (
  market_id in (
    select id from public.markets where status = 'active'
  )
);

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (
       select 1
       from pg_publication_tables
       where pubname = 'supabase_realtime'
         and schemaname = 'public'
         and tablename = 'market_provider_status'
     )
  then
    execute 'alter publication supabase_realtime add table public.market_provider_status';
  end if;
end
$$;

comment on table public.market_provider_status is
  'Latest provider health/status per market. This represents markets even when a provider has no current quote.';
