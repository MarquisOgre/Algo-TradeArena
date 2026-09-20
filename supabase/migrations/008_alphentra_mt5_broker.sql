-- Alphentra Database Migration 008
-- Broker and MetaTrader 5 integration foundation.
-- Stores connection metadata and synchronized MT5 state.
-- Credentials/secrets must be stored in a secure secret manager, never in these tables.

create type public.broker_account_status as enum (
  'pending',
  'connected',
  'disconnected',
  'error',
  'disabled'
);

create type public.mt5_order_side as enum (
  'buy',
  'sell'
);

create type public.mt5_order_type as enum (
  'market',
  'limit',
  'stop',
  'stop_limit'
);

create type public.mt5_order_status as enum (
  'pending',
  'submitted',
  'partially_filled',
  'filled',
  'cancelled',
  'rejected',
  'expired'
);

create table public.broker_accounts (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  broker_name text not null,
  account_name text not null,
  account_identifier text not null,
  environment text not null default 'demo',
  status public.broker_account_status not null default 'pending',
  base_currency text not null default 'USD',
  metadata jsonb not null default '{}'::jsonb,
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint broker_environment_check check (environment in ('demo', 'live')),
  unique (profile_id, broker_name, account_identifier)
);

create table public.mt5_accounts (
  id uuid primary key default gen_random_uuid(),
  broker_account_id uuid not null unique references public.broker_accounts(id) on delete cascade,
  login_identifier text not null,
  server_name text not null,
  terminal_build integer,
  balance numeric(36,12) not null default 0,
  equity numeric(36,12) not null default 0,
  margin numeric(36,12) not null default 0,
  free_margin numeric(36,12) not null default 0,
  leverage integer,
  currency text not null default 'USD',
  is_hedging_account boolean not null default true,
  last_account_sync_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint mt5_balance_check check (balance >= 0),
  constraint mt5_equity_check check (equity >= 0),
  constraint mt5_margin_check check (margin >= 0),
  constraint mt5_free_margin_check check (free_margin >= 0),
  constraint mt5_leverage_check check (leverage is null or leverage > 0)
);

create table public.mt5_orders (
  id uuid primary key default gen_random_uuid(),
  mt5_account_id uuid not null references public.mt5_accounts(id) on delete cascade,
  strategy_id uuid references public.strategies(id) on delete set null,
  source_order_id uuid references public.orders(id) on delete set null,
  symbol text not null,
  side public.mt5_order_side not null,
  order_type public.mt5_order_type not null default 'market',
  status public.mt5_order_status not null default 'pending',
  volume numeric(30,12) not null,
  price numeric(30,12),
  stop_loss numeric(30,12),
  take_profit numeric(30,12),
  filled_volume numeric(30,12) not null default 0,
  average_fill_price numeric(30,12),
  mt5_ticket bigint,
  client_order_id text,
  comment text,
  opened_at timestamptz,
  filled_at timestamptz,
  closed_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint mt5_orders_volume_check check (volume > 0),
  constraint mt5_orders_filled_volume_check check (filled_volume >= 0 and filled_volume <= volume),
  constraint mt5_orders_price_check check (price is null or price > 0),
  constraint mt5_orders_sl_check check (stop_loss is null or stop_loss > 0),
  constraint mt5_orders_tp_check check (take_profit is null or take_profit > 0),
  unique (mt5_account_id, client_order_id)
);

create table public.mt5_positions (
  id uuid primary key default gen_random_uuid(),
  mt5_account_id uuid not null references public.mt5_accounts(id) on delete cascade,
  strategy_id uuid references public.strategies(id) on delete set null,
  symbol text not null,
  side public.position_side not null,
  volume numeric(30,12) not null,
  open_price numeric(30,12) not null,
  current_price numeric(30,12),
  stop_loss numeric(30,12),
  take_profit numeric(30,12),
  swap numeric(30,12) not null default 0,
  commission numeric(30,12) not null default 0,
  profit numeric(30,12) not null default 0,
  mt5_ticket bigint not null,
  opened_at timestamptz,
  last_synced_at timestamptz,
  closed_at timestamptz,
  is_open boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint mt5_positions_volume_check check (volume > 0),
  constraint mt5_positions_open_price_check check (open_price > 0),
  constraint mt5_positions_current_price_check check (current_price is null or current_price > 0),
  unique (mt5_account_id, mt5_ticket)
);

create table public.execution_events (
  id bigint generated always as identity primary key,
  profile_id uuid references public.profiles(id) on delete set null,
  broker_account_id uuid references public.broker_accounts(id) on delete set null,
  mt5_account_id uuid references public.mt5_accounts(id) on delete set null,
  source_order_id uuid references public.orders(id) on delete set null,
  mt5_order_id uuid references public.mt5_orders(id) on delete set null,
  event_type text not null,
  status text,
  external_event_id text,
  message text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index broker_accounts_profile_idx
  on public.broker_accounts(profile_id, status);

create index broker_accounts_status_idx
  on public.broker_accounts(status, last_synced_at);

create index mt5_orders_account_time_idx
  on public.mt5_orders(mt5_account_id, created_at desc);

create index mt5_orders_strategy_idx
  on public.mt5_orders(strategy_id, created_at desc);

create index mt5_orders_ticket_idx
  on public.mt5_orders(mt5_ticket);

create index mt5_positions_account_open_idx
  on public.mt5_positions(mt5_account_id, is_open);

create index mt5_positions_symbol_idx
  on public.mt5_positions(symbol, is_open);

create index execution_events_account_time_idx
  on public.execution_events(mt5_account_id, created_at desc);

create index execution_events_order_time_idx
  on public.execution_events(mt5_order_id, created_at desc);

create index execution_events_external_idx
  on public.execution_events(external_event_id);

create trigger broker_accounts_set_updated_at
before update on public.broker_accounts
for each row execute function public.set_updated_at();

create trigger mt5_accounts_set_updated_at
before update on public.mt5_accounts
for each row execute function public.set_updated_at();

create trigger mt5_orders_set_updated_at
before update on public.mt5_orders
for each row execute function public.set_updated_at();

create trigger mt5_positions_set_updated_at
before update on public.mt5_positions
for each row execute function public.set_updated_at();

alter table public.broker_accounts enable row level security;
alter table public.mt5_accounts enable row level security;
alter table public.mt5_orders enable row level security;
alter table public.mt5_positions enable row level security;
alter table public.execution_events enable row level security;

create policy "broker_accounts_select_own"
on public.broker_accounts for select
to authenticated
using (profile_id = auth.uid());

create policy "broker_accounts_insert_own"
on public.broker_accounts for insert
to authenticated
with check (profile_id = auth.uid());

create policy "broker_accounts_update_own"
on public.broker_accounts for update
to authenticated
using (profile_id = auth.uid())
with check (profile_id = auth.uid());

create policy "broker_accounts_delete_own"
on public.broker_accounts for delete
to authenticated
using (profile_id = auth.uid());

create policy "mt5_accounts_select_own"
on public.mt5_accounts for select
to authenticated
using (
  broker_account_id in (
    select id from public.broker_accounts where profile_id = auth.uid()
  )
);

create policy "mt5_orders_select_own"
on public.mt5_orders for select
to authenticated
using (
  mt5_account_id in (
    select m.id
    from public.mt5_accounts m
    join public.broker_accounts b on b.id = m.broker_account_id
    where b.profile_id = auth.uid()
  )
);

create policy "mt5_positions_select_own"
on public.mt5_positions for select
to authenticated
using (
  mt5_account_id in (
    select m.id
    from public.mt5_accounts m
    join public.broker_accounts b on b.id = m.broker_account_id
    where b.profile_id = auth.uid()
  )
);

create policy "execution_events_select_own"
on public.execution_events for select
to authenticated
using (
  profile_id = auth.uid()
  or broker_account_id in (
    select id from public.broker_accounts where profile_id = auth.uid()
  )
);

comment on table public.broker_accounts is 'User broker connection metadata; credentials must remain in a secure secret store.';
comment on table public.mt5_accounts is 'Synchronized MetaTrader 5 account state.';
comment on table public.mt5_orders is 'Orders submitted to or synchronized from MetaTrader 5.';
comment on table public.mt5_positions is 'Open and historical MetaTrader 5 positions.';
comment on table public.execution_events is 'Auditable broker/MT5 execution and synchronization events.';
