-- Alphentra Database Migration 002
-- Trading engine foundation: markets, market data, portfolios, orders,
-- executions, and positions.
-- Designed for Supabase PostgreSQL.

create type public.market_asset_class as enum (
  'crypto',
  'forex',
  'stocks',
  'etf',
  'index',
  'commodity',
  'futures',
  'options'
);

create type public.market_status as enum (
  'active',
  'inactive',
  'delisted'
);

create type public.portfolio_type as enum (
  'paper',
  'live',
  'backtest',
  'competition'
);

create type public.order_side as enum (
  'buy',
  'sell'
);

create type public.order_type as enum (
  'market',
  'limit',
  'stop',
  'stop_limit'
);

create type public.order_status as enum (
  'pending',
  'submitted',
  'partially_filled',
  'filled',
  'cancelled',
  'rejected',
  'expired'
);

create type public.time_in_force as enum (
  'day',
  'gtc',
  'ioc',
  'fok'
);

create type public.position_side as enum (
  'long',
  'short'
);

create table public.markets (
  id uuid primary key default gen_random_uuid(),
  symbol text not null,
  name text not null,
  asset_class public.market_asset_class not null,
  exchange text,
  quote_currency text not null default 'USD',
  base_currency text,
  broker_symbol text,
  price_precision smallint not null default 8,
  quantity_precision smallint not null default 8,
  min_quantity numeric(30,12),
  min_notional numeric(30,12),
  contract_size numeric(30,12) not null default 1,
  status public.market_status not null default 'active',
  is_tradable boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint markets_symbol_not_blank check (char_length(trim(symbol)) > 0),
  constraint markets_name_not_blank check (char_length(trim(name)) > 0),
  constraint markets_price_precision_check check (price_precision between 0 and 18),
  constraint markets_quantity_precision_check check (quantity_precision between 0 and 18),
  constraint markets_min_quantity_check check (min_quantity is null or min_quantity >= 0),
  constraint markets_min_notional_check check (min_notional is null or min_notional >= 0),
  constraint markets_contract_size_check check (contract_size > 0),
  unique (symbol, exchange, asset_class)
);

create table public.market_data (
  id bigint generated always as identity primary key,
  market_id uuid not null references public.markets(id) on delete cascade,
  timeframe text not null,
  candle_time timestamptz not null,
  open numeric(30,12) not null,
  high numeric(30,12) not null,
  low numeric(30,12) not null,
  close numeric(30,12) not null,
  volume numeric(36,12),
  quote_volume numeric(36,12),
  trade_count integer,
  source text not null,
  created_at timestamptz not null default now(),
  constraint market_data_ohlc_check check (
    open >= 0 and high >= 0 and low >= 0 and close >= 0
    and high >= low
    and high >= open
    and high >= close
    and low <= open
    and low <= close
  ),
  constraint market_data_volume_check check (
    volume is null or volume >= 0
  ),
  constraint market_data_quote_volume_check check (
    quote_volume is null or quote_volume >= 0
  ),
  constraint market_data_trade_count_check check (
    trade_count is null or trade_count >= 0
  ),
  unique (market_id, timeframe, candle_time, source)
);

create table public.portfolios (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  portfolio_type public.portfolio_type not null default 'paper',
  base_currency text not null default 'USD',
  initial_cash numeric(30,12) not null default 0,
  cash_balance numeric(30,12) not null default 0,
  equity numeric(30,12) not null default 0,
  realized_pnl numeric(30,12) not null default 0,
  unrealized_pnl numeric(30,12) not null default 0,
  total_fees numeric(30,12) not null default 0,
  is_active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint portfolios_name_not_blank check (char_length(trim(name)) > 0),
  constraint portfolios_initial_cash_check check (initial_cash >= 0),
  unique (profile_id, name)
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  portfolio_id uuid not null references public.portfolios(id) on delete cascade,
  market_id uuid not null references public.markets(id) on delete restrict,
  strategy_id uuid references public.strategies(id) on delete set null,
  side public.order_side not null,
  order_type public.order_type not null default 'market',
  time_in_force public.time_in_force not null default 'day',
  status public.order_status not null default 'pending',
  quantity numeric(30,12) not null,
  filled_quantity numeric(30,12) not null default 0,
  limit_price numeric(30,12),
  stop_price numeric(30,12),
  average_fill_price numeric(30,12),
  submitted_at timestamptz,
  filled_at timestamptz,
  cancelled_at timestamptz,
  expires_at timestamptz,
  client_order_id text,
  external_order_id text,
  execution_source text not null default 'paper',
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint orders_quantity_check check (quantity > 0),
  constraint orders_filled_quantity_check check (filled_quantity >= 0 and filled_quantity <= quantity),
  constraint orders_limit_price_check check (limit_price is null or limit_price > 0),
  constraint orders_stop_price_check check (stop_price is null or stop_price > 0),
  constraint orders_average_fill_price_check check (average_fill_price is null or average_fill_price > 0),
  constraint orders_type_price_check check (
    (order_type in ('market', 'stop') and limit_price is null)
    or order_type in ('limit', 'stop_limit')
    or limit_price is not null
  ),
  unique (portfolio_id, client_order_id)
);

create table public.executions (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  portfolio_id uuid not null references public.portfolios(id) on delete cascade,
  market_id uuid not null references public.markets(id) on delete restrict,
  execution_time timestamptz not null default now(),
  side public.order_side not null,
  quantity numeric(30,12) not null,
  price numeric(30,12) not null,
  gross_value numeric(36,12) not null,
  fee numeric(30,12) not null default 0,
  fee_currency text not null default 'USD',
  external_execution_id text,
  execution_source text not null default 'paper',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint executions_quantity_check check (quantity > 0),
  constraint executions_price_check check (price > 0),
  constraint executions_gross_value_check check (gross_value >= 0),
  constraint executions_fee_check check (fee >= 0),
  unique (order_id, external_execution_id)
);

create table public.positions (
  id uuid primary key default gen_random_uuid(),
  portfolio_id uuid not null references public.portfolios(id) on delete cascade,
  market_id uuid not null references public.markets(id) on delete restrict,
  strategy_id uuid references public.strategies(id) on delete set null,
  side public.position_side not null,
  quantity numeric(30,12) not null default 0,
  average_entry_price numeric(30,12) not null default 0,
  current_price numeric(30,12),
  market_value numeric(36,12) not null default 0,
  realized_pnl numeric(30,12) not null default 0,
  unrealized_pnl numeric(30,12) not null default 0,
  total_fees numeric(30,12) not null default 0,
  opened_at timestamptz,
  last_marked_at timestamptz,
  closed_at timestamptz,
  is_open boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint positions_quantity_check check (quantity >= 0),
  constraint positions_average_entry_check check (average_entry_price >= 0),
  constraint positions_current_price_check check (current_price is null or current_price >= 0),
  constraint positions_market_value_check check (market_value >= 0)
);

create index markets_asset_class_idx
  on public.markets(asset_class, status);

create index markets_tradable_idx
  on public.markets(is_tradable, status);

create index market_data_market_time_idx
  on public.market_data(market_id, timeframe, candle_time desc);

create index market_data_source_time_idx
  on public.market_data(source, candle_time desc);

create index portfolios_profile_idx
  on public.portfolios(profile_id, is_active);

create index portfolios_type_idx
  on public.portfolios(portfolio_type, is_active);

create index orders_portfolio_created_idx
  on public.orders(portfolio_id, created_at desc);

create index orders_market_status_idx
  on public.orders(market_id, status);

create index orders_strategy_idx
  on public.orders(strategy_id, created_at desc);

create index executions_order_idx
  on public.executions(order_id, execution_time);

create index executions_portfolio_time_idx
  on public.executions(portfolio_id, execution_time desc);

create index positions_portfolio_open_idx
  on public.positions(portfolio_id, is_open);

create index positions_market_open_idx
  on public.positions(market_id, is_open);

create index positions_strategy_idx
  on public.positions(strategy_id);

create trigger portfolios_set_updated_at
before update on public.portfolios
for each row execute function public.set_updated_at();

create trigger orders_set_updated_at
before update on public.orders
for each row execute function public.set_updated_at();

create trigger positions_set_updated_at
before update on public.positions
for each row execute function public.set_updated_at();

alter table public.markets enable row level security;
alter table public.market_data enable row level security;
alter table public.portfolios enable row level security;
alter table public.orders enable row level security;
alter table public.executions enable row level security;
alter table public.positions enable row level security;

create policy "markets_select_active"
on public.markets for select
to anon, authenticated
using (status = 'active');

create policy "market_data_select"
on public.market_data for select
to anon, authenticated
using (
  market_id in (
    select id from public.markets where status = 'active'
  )
);

create policy "portfolios_select_own"
on public.portfolios for select
to authenticated
using (profile_id = auth.uid());

create policy "portfolios_insert_own"
on public.portfolios for insert
to authenticated
with check (profile_id = auth.uid());

create policy "portfolios_update_own"
on public.portfolios for update
to authenticated
using (profile_id = auth.uid())
with check (profile_id = auth.uid());

create policy "portfolios_delete_own"
on public.portfolios for delete
to authenticated
using (profile_id = auth.uid());

create policy "orders_select_own"
on public.orders for select
to authenticated
using (
  portfolio_id in (
    select id from public.portfolios where profile_id = auth.uid()
  )
);

create policy "orders_insert_own"
on public.orders for insert
to authenticated
with check (
  portfolio_id in (
    select id from public.portfolios where profile_id = auth.uid()
  )
);

create policy "orders_update_own"
on public.orders for update
to authenticated
using (
  portfolio_id in (
    select id from public.portfolios where profile_id = auth.uid()
  )
)
with check (
  portfolio_id in (
    select id from public.portfolios where profile_id = auth.uid()
  )
);

create policy "executions_select_own"
on public.executions for select
to authenticated
using (
  portfolio_id in (
    select id from public.portfolios where profile_id = auth.uid()
  )
);

create policy "positions_select_own"
on public.positions for select
to authenticated
using (
  portfolio_id in (
    select id from public.portfolios where profile_id = auth.uid()
  )
);

comment on table public.markets is 'Tradable instruments supported by Alphentra.';
comment on table public.market_data is 'Time-series OHLCV market data from approved providers.';
comment on table public.portfolios is 'User trading portfolios for paper, live, backtest, and competition contexts.';
comment on table public.orders is 'Trading intents submitted by portfolios to an execution source.';
comment on table public.executions is 'Fills produced by an order execution.';
comment on table public.positions is 'Current and historical portfolio positions used for P&L tracking.';
