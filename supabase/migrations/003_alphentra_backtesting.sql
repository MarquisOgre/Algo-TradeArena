-- Alphentra Database Migration 003
-- Backtesting engine: backtest runs, trades, equity snapshots and performance metrics.

create type public.backtest_status as enum (
  'queued',
  'running',
  'completed',
  'failed',
  'cancelled'
);

create type public.backtest_trade_side as enum (
  'buy',
  'sell'
);

create table public.backtests (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  strategy_id uuid not null references public.strategies(id) on delete cascade,
  strategy_version_id uuid references public.strategy_versions(id) on delete set null,
  name text not null,
  status public.backtest_status not null default 'queued',
  market_ids uuid[] not null default '{}',
  timeframe text not null,
  start_time timestamptz not null,
  end_time timestamptz not null,
  initial_capital numeric(30,12) not null,
  final_equity numeric(30,12),
  total_return_pct numeric(18,8),
  annualized_return_pct numeric(18,8),
  max_drawdown_pct numeric(18,8),
  sharpe_ratio numeric(18,8),
  sortino_ratio numeric(18,8),
  win_rate_pct numeric(18,8),
  profit_factor numeric(18,8),
  total_trades integer not null default 0,
  winning_trades integer not null default 0,
  losing_trades integer not null default 0,
  gross_profit numeric(30,12) not null default 0,
  gross_loss numeric(30,12) not null default 0,
  total_fees numeric(30,12) not null default 0,
  parameters jsonb not null default '{}'::jsonb,
  error_message text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint backtests_name_not_blank check (char_length(trim(name)) > 0),
  constraint backtests_dates_check check (end_time > start_time),
  constraint backtests_initial_capital_check check (initial_capital > 0),
  constraint backtests_counts_check check (
    total_trades >= 0 and winning_trades >= 0 and losing_trades >= 0
  ),
  constraint backtests_trade_count_consistency check (
    winning_trades + losing_trades <= total_trades
  )
);

create table public.backtest_trades (
  id uuid primary key default gen_random_uuid(),
  backtest_id uuid not null references public.backtests(id) on delete cascade,
  market_id uuid not null references public.markets(id) on delete restrict,
  strategy_id uuid not null references public.strategies(id) on delete cascade,
  entry_time timestamptz not null,
  exit_time timestamptz,
  side public.backtest_trade_side not null,
  quantity numeric(30,12) not null,
  entry_price numeric(30,12) not null,
  exit_price numeric(30,12),
  gross_pnl numeric(30,12),
  fees numeric(30,12) not null default 0,
  net_pnl numeric(30,12),
  return_pct numeric(18,8),
  holding_seconds bigint,
  entry_reason text,
  exit_reason text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint backtest_trades_quantity_check check (quantity > 0),
  constraint backtest_trades_entry_price_check check (entry_price > 0),
  constraint backtest_trades_exit_price_check check (exit_price is null or exit_price > 0),
  constraint backtest_trades_fees_check check (fees >= 0),
  constraint backtest_trades_dates_check check (exit_time is null or exit_time >= entry_time)
);

create table public.backtest_equity_snapshots (
  id bigint generated always as identity primary key,
  backtest_id uuid not null references public.backtests(id) on delete cascade,
  snapshot_time timestamptz not null,
  equity numeric(30,12) not null,
  cash numeric(30,12) not null default 0,
  unrealized_pnl numeric(30,12) not null default 0,
  realized_pnl numeric(30,12) not null default 0,
  drawdown_pct numeric(18,8) not null default 0,
  created_at timestamptz not null default now(),
  unique (backtest_id, snapshot_time),
  constraint backtest_equity_equity_check check (equity >= 0),
  constraint backtest_equity_cash_check check (cash >= 0),
  constraint backtest_equity_drawdown_check check (drawdown_pct between 0 and 100)
);

create table public.backtest_metrics (
  id uuid primary key default gen_random_uuid(),
  backtest_id uuid not null unique references public.backtests(id) on delete cascade,
  cagr_pct numeric(18,8),
  volatility_pct numeric(18,8),
  downside_deviation_pct numeric(18,8),
  max_drawdown_pct numeric(18,8),
  recovery_factor numeric(18,8),
  expectancy numeric(30,12),
  avg_win numeric(30,12),
  avg_loss numeric(30,12),
  largest_win numeric(30,12),
  largest_loss numeric(30,12),
  avg_trade_duration_seconds bigint,
  consecutive_wins integer not null default 0,
  consecutive_losses integer not null default 0,
  risk_reward_ratio numeric(18,8),
  calmar_ratio numeric(18,8),
  computed_at timestamptz not null default now()
);

create index backtests_profile_idx
  on public.backtests(profile_id, created_at desc);

create index backtests_strategy_idx
  on public.backtests(strategy_id, created_at desc);

create index backtests_status_idx
  on public.backtests(status, created_at desc);

create index backtest_trades_backtest_idx
  on public.backtest_trades(backtest_id, entry_time);

create index backtest_trades_market_idx
  on public.backtest_trades(market_id, entry_time);

create index backtest_equity_backtest_time_idx
  on public.backtest_equity_snapshots(backtest_id, snapshot_time);

create trigger backtests_set_updated_at
before update on public.backtests
for each row execute function public.set_updated_at();

alter table public.backtests enable row level security;
alter table public.backtest_trades enable row level security;
alter table public.backtest_equity_snapshots enable row level security;
alter table public.backtest_metrics enable row level security;

create policy "backtests_select_own"
on public.backtests for select
to authenticated
using (profile_id = auth.uid());

create policy "backtests_insert_own"
on public.backtests for insert
to authenticated
with check (profile_id = auth.uid());

create policy "backtests_update_own"
on public.backtests for update
to authenticated
using (profile_id = auth.uid())
with check (profile_id = auth.uid());

create policy "backtests_delete_own"
on public.backtests for delete
to authenticated
using (profile_id = auth.uid());

create policy "backtest_trades_select_own"
on public.backtest_trades for select
to authenticated
using (
  backtest_id in (
    select id from public.backtests where profile_id = auth.uid()
  )
);

create policy "backtest_equity_select_own"
on public.backtest_equity_snapshots for select
to authenticated
using (
  backtest_id in (
    select id from public.backtests where profile_id = auth.uid()
  )
);

create policy "backtest_metrics_select_own"
on public.backtest_metrics for select
to authenticated
using (
  backtest_id in (
    select id from public.backtests where profile_id = auth.uid()
  )
);

comment on table public.backtests is 'Backtest execution runs and aggregate performance results.';
comment on table public.backtest_trades is 'Individual simulated trades produced by a backtest.';
comment on table public.backtest_equity_snapshots is 'Time-series equity curve and drawdown snapshots for a backtest.';
comment on table public.backtest_metrics is 'Derived risk and performance metrics for a completed backtest.';
