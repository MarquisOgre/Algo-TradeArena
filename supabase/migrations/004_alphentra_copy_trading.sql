-- Alphentra Database Migration 004
-- Copy trading foundation: trader follows, copy configurations,
-- allocation records, signals, copied orders and copy-trading events.

create type public.copy_status as enum (
  'pending',
  'active',
  'paused',
  'stopped',
  'rejected'
);

create type public.copy_allocation_mode as enum (
  'fixed_amount',
  'percentage',
  'proportional'
);

create type public.copy_event_type as enum (
  'signal_received',
  'order_created',
  'order_submitted',
  'order_filled',
  'order_rejected',
  'order_cancelled',
  'risk_blocked',
  'allocation_updated',
  'copy_paused',
  'copy_resumed',
  'copy_stopped'
);

create table public.followers (
  id uuid primary key default gen_random_uuid(),
  follower_profile_id uuid not null references public.profiles(id) on delete cascade,
  trader_id uuid not null references public.traders(id) on delete cascade,
  status public.copy_status not null default 'pending',
  started_at timestamptz,
  stopped_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (follower_profile_id, trader_id)
);

create table public.copy_trading (
  id uuid primary key default gen_random_uuid(),
  follower_profile_id uuid not null references public.profiles(id) on delete cascade,
  trader_id uuid not null references public.traders(id) on delete cascade,
  strategy_id uuid not null references public.strategies(id) on delete cascade,
  source_portfolio_id uuid references public.portfolios(id) on delete set null,
  target_portfolio_id uuid not null references public.portfolios(id) on delete cascade,
  status public.copy_status not null default 'pending',
  allocation_mode public.copy_allocation_mode not null default 'proportional',
  allocation_value numeric(30,12) not null default 0,
  max_allocation numeric(30,12),
  max_position_size numeric(30,12),
  max_daily_loss numeric(30,12),
  max_open_positions integer,
  max_slippage_bps integer not null default 100,
  copy_entries boolean not null default true,
  copy_exits boolean not null default true,
  copy_stop_loss boolean not null default true,
  copy_take_profit boolean not null default true,
  auto_pause_on_risk boolean not null default true,
  risk_overrides jsonb not null default '{}'::jsonb,
  started_at timestamptz,
  paused_at timestamptz,
  stopped_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint copy_allocation_value_check check (allocation_value >= 0),
  constraint copy_max_allocation_check check (max_allocation is null or max_allocation >= 0),
  constraint copy_max_position_check check (max_position_size is null or max_position_size >= 0),
  constraint copy_max_daily_loss_check check (max_daily_loss is null or max_daily_loss >= 0),
  constraint copy_max_open_positions_check check (max_open_positions is null or max_open_positions > 0),
  constraint copy_slippage_check check (max_slippage_bps >= 0),
  unique (follower_profile_id, strategy_id, target_portfolio_id)
);

create table public.copy_trading_allocations (
  id uuid primary key default gen_random_uuid(),
  copy_trading_id uuid not null references public.copy_trading(id) on delete cascade,
  source_order_id uuid references public.orders(id) on delete set null,
  source_position_id uuid references public.positions(id) on delete set null,
  target_order_id uuid references public.orders(id) on delete set null,
  target_execution_id uuid references public.executions(id) on delete set null,
  source_quantity numeric(30,12),
  target_quantity numeric(30,12),
  source_price numeric(30,12),
  target_price numeric(30,12),
  allocation_ratio numeric(24,12),
  slippage_bps numeric(18,8),
  realized_pnl numeric(30,12),
  created_at timestamptz not null default now(),
  constraint copy_alloc_source_qty_check check (source_quantity is null or source_quantity > 0),
  constraint copy_alloc_target_qty_check check (target_quantity is null or target_quantity > 0),
  constraint copy_alloc_source_price_check check (source_price is null or source_price > 0),
  constraint copy_alloc_target_price_check check (target_price is null or target_price > 0)
);

create table public.strategy_signals (
  id uuid primary key default gen_random_uuid(),
  strategy_id uuid not null references public.strategies(id) on delete cascade,
  strategy_version_id uuid references public.strategy_versions(id) on delete set null,
  market_id uuid not null references public.markets(id) on delete restrict,
  signal_type text not null,
  side public.order_side,
  signal_time timestamptz not null default now(),
  quantity numeric(30,12),
  reference_price numeric(30,12),
  stop_price numeric(30,12),
  take_profit_price numeric(30,12),
  confidence numeric(8,6),
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint strategy_signal_quantity_check check (quantity is null or quantity > 0),
  constraint strategy_signal_price_check check (reference_price is null or reference_price > 0),
  constraint strategy_signal_stop_check check (stop_price is null or stop_price > 0),
  constraint strategy_signal_tp_check check (take_profit_price is null or take_profit_price > 0),
  constraint strategy_signal_confidence_check check (confidence is null or confidence between 0 and 1)
);

create table public.copy_trading_events (
  id bigint generated always as identity primary key,
  copy_trading_id uuid not null references public.copy_trading(id) on delete cascade,
  event_type public.copy_event_type not null,
  strategy_signal_id uuid references public.strategy_signals(id) on delete set null,
  source_order_id uuid references public.orders(id) on delete set null,
  target_order_id uuid references public.orders(id) on delete set null,
  message text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.copy_risk_checks (
  id uuid primary key default gen_random_uuid(),
  copy_trading_id uuid not null references public.copy_trading(id) on delete cascade,
  strategy_signal_id uuid references public.strategy_signals(id) on delete set null,
  passed boolean not null,
  check_type text not null,
  reason text,
  measured_value numeric(30,12),
  limit_value numeric(30,12),
  created_at timestamptz not null default now()
);

create index followers_profile_idx
  on public.followers(follower_profile_id, status);

create index followers_trader_idx
  on public.followers(trader_id, status);

create index copy_trading_follower_idx
  on public.copy_trading(follower_profile_id, status);

create index copy_trading_trader_idx
  on public.copy_trading(trader_id, status);

create index copy_trading_strategy_idx
  on public.copy_trading(strategy_id, status);

create index copy_allocations_copy_idx
  on public.copy_trading_allocations(copy_trading_id, created_at desc);

create index copy_allocations_source_order_idx
  on public.copy_trading_allocations(source_order_id);

create index copy_allocations_target_order_idx
  on public.copy_trading_allocations(target_order_id);

create index strategy_signals_strategy_time_idx
  on public.strategy_signals(strategy_id, signal_time desc);

create index strategy_signals_market_time_idx
  on public.strategy_signals(market_id, signal_time desc);

create index copy_events_copy_time_idx
  on public.copy_trading_events(copy_trading_id, created_at desc);

create index copy_events_type_idx
  on public.copy_trading_events(event_type, created_at desc);

create index copy_risk_checks_copy_time_idx
  on public.copy_risk_checks(copy_trading_id, created_at desc);

create trigger followers_set_updated_at
before update on public.followers
for each row execute function public.set_updated_at();

create trigger copy_trading_set_updated_at
before update on public.copy_trading
for each row execute function public.set_updated_at();

alter table public.followers enable row level security;
alter table public.copy_trading enable row level security;
alter table public.copy_trading_allocations enable row level security;
alter table public.strategy_signals enable row level security;
alter table public.copy_trading_events enable row level security;
alter table public.copy_risk_checks enable row level security;

create policy "followers_select_own"
on public.followers for select
to authenticated
using (
  follower_profile_id = auth.uid()
  or trader_id in (
    select id from public.traders where profile_id = auth.uid()
  )
);

create policy "followers_insert_own"
on public.followers for insert
to authenticated
with check (follower_profile_id = auth.uid());

create policy "followers_update_own"
on public.followers for update
to authenticated
using (follower_profile_id = auth.uid())
with check (follower_profile_id = auth.uid());

create policy "followers_delete_own"
on public.followers for delete
to authenticated
using (follower_profile_id = auth.uid());

create policy "copy_trading_select_own"
on public.copy_trading for select
to authenticated
using (
  follower_profile_id = auth.uid()
  or trader_id in (
    select id from public.traders where profile_id = auth.uid()
  )
);

create policy "copy_trading_insert_own"
on public.copy_trading for insert
to authenticated
with check (
  follower_profile_id = auth.uid()
  and target_portfolio_id in (
    select id from public.portfolios where profile_id = auth.uid()
  )
);

create policy "copy_trading_update_own"
on public.copy_trading for update
to authenticated
using (
  follower_profile_id = auth.uid()
)
with check (
  follower_profile_id = auth.uid()
);

create policy "copy_trading_delete_own"
on public.copy_trading for delete
to authenticated
using (follower_profile_id = auth.uid());

create policy "copy_allocations_select_own"
on public.copy_trading_allocations for select
to authenticated
using (
  copy_trading_id in (
    select id from public.copy_trading
    where follower_profile_id = auth.uid()
    or trader_id in (
      select id from public.traders where profile_id = auth.uid()
    )
  )
);

create policy "strategy_signals_select_public"
on public.strategy_signals for select
to authenticated
using (
  strategy_id in (
    select s.id
    from public.strategies s
    where s.visibility = 'public'
    or s.trader_id in (
      select t.id from public.traders t where t.profile_id = auth.uid()
    )
  )
);

create policy "copy_events_select_own"
on public.copy_trading_events for select
to authenticated
using (
  copy_trading_id in (
    select id from public.copy_trading
    where follower_profile_id = auth.uid()
    or trader_id in (
      select id from public.traders where profile_id = auth.uid()
    )
  )
);

create policy "copy_risk_checks_select_own"
on public.copy_risk_checks for select
to authenticated
using (
  copy_trading_id in (
    select id from public.copy_trading
    where follower_profile_id = auth.uid()
    or trader_id in (
      select id from public.traders where profile_id = auth.uid()
    )
  )
);

comment on table public.followers is 'Trader follow relationships used by discovery and copy trading.';
comment on table public.copy_trading is 'Follower configuration for copying a trader strategy into a target portfolio.';
comment on table public.copy_trading_allocations is 'Mapping between source trader executions and follower executions.';
comment on table public.strategy_signals is 'Strategy-generated trading signals consumed by paper, copy, and future live execution services.';
comment on table public.copy_trading_events is 'Auditable lifecycle events for copy-trading execution.';
comment on table public.copy_risk_checks is 'Risk-control decisions made before a copy order is created or submitted.';
