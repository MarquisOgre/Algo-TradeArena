-- Alphentra Database Migration 021
-- On-demand MT5 candle requests.
--
-- Quotes remain broad/live across the dynamically discovered MT5 universe.
-- Historical candles are fetched only for market/timeframe combinations
-- explicitly requested by the application.

create table if not exists public.market_data_requests (
  id uuid primary key default gen_random_uuid(),
  market_id uuid not null references public.markets(id) on delete cascade,
  timeframe text not null,
  requested_bars integer not null default 120,
  status text not null default 'pending',
  requested_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '2 minutes'),
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint market_data_requests_timeframe_check
    check (timeframe in ('1m', '5m', '15m', '1h', '4h', '1d')),
  constraint market_data_requests_bars_check
    check (requested_bars between 30 and 240),
  constraint market_data_requests_status_check
    check (status in ('pending', 'fulfilled', 'expired')),
  unique (market_id, timeframe)
);

create index if not exists market_data_requests_pending_idx
  on public.market_data_requests(status, expires_at, requested_at);

create index if not exists market_data_requests_market_idx
  on public.market_data_requests(market_id, timeframe);

drop trigger if exists market_data_requests_set_updated_at on public.market_data_requests;
create trigger market_data_requests_set_updated_at
before update on public.market_data_requests
for each row execute function public.set_updated_at();

alter table public.market_data_requests enable row level security;

revoke all on table public.market_data_requests from anon;
revoke all on table public.market_data_requests from authenticated;

-- The request queue contains only public market/timeframe work items.
-- The bridge uses the publishable/anon key to read pending requests.
grant select on table public.market_data_requests to anon, authenticated;
grant insert, update on table public.market_data_requests to anon, authenticated;

drop policy if exists "market_data_requests_select_active" on public.market_data_requests;
create policy "market_data_requests_select_active"
on public.market_data_requests for select
to anon, authenticated
using (
  status = 'pending'
  and expires_at > now()
  and market_id in (
    select id from public.markets where status = 'active'
  )
);

drop policy if exists "market_data_requests_insert_active" on public.market_data_requests;
create policy "market_data_requests_insert_active"
on public.market_data_requests for insert
to anon, authenticated
with check (
  status = 'pending'
  and requested_bars between 30 and 240
  and timeframe in ('1m', '5m', '15m', '1h', '4h', '1d')
  and expires_at > now()
  and expires_at <= now() + interval '5 minutes'
  and market_id in (
    select id from public.markets where status = 'active'
  )
);

drop policy if exists "market_data_requests_update_active" on public.market_data_requests;
create policy "market_data_requests_update_active"
on public.market_data_requests for update
to anon, authenticated
using (true)
with check (
  status = 'pending'
  and requested_bars between 30 and 240
  and timeframe in ('1m', '5m', '15m', '1h', '4h', '1d')
  and expires_at > now()
  and expires_at <= now() + interval '5 minutes'
  and market_id in (
    select id from public.markets where status = 'active'
  )
);

comment on table public.market_data_requests is
  'Shared short-lived queue of MT5 candle history requests. No instrument symbols are hardcoded; market IDs come from the live MT5 universe.';

-- Request work is transient and does not need realtime fan-out.
