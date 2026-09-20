-- Alphentra Database Migration 014
-- Persistent paper execution engine.
--
-- This migration turns the paper order ticket into a database-backed,
-- atomic trading flow:
-- order -> execution -> position -> portfolio cash/equity/P&L.
--
-- The public RPC is a thin authenticated wrapper around a private
-- SECURITY DEFINER function. The private function validates auth.uid(),
-- pins search_path, and performs all financial mutations in one transaction.

create schema if not exists private;

revoke all on schema private from public;
revoke all on schema private from anon;
revoke all on schema private from authenticated;

-- One open long position per paper portfolio/instrument.
create unique index if not exists positions_one_open_per_market_idx
  on public.positions(portfolio_id, market_id)
  where is_open = true;

create table if not exists public.portfolio_snapshots (
  id bigint generated always as identity primary key,
  portfolio_id uuid not null references public.portfolios(id) on delete cascade,
  snapshot_time timestamptz not null default now(),
  equity numeric(30,12) not null,
  cash_balance numeric(30,12) not null,
  realized_pnl numeric(30,12) not null,
  unrealized_pnl numeric(30,12) not null,
  reason text not null default 'trade',
  order_id uuid references public.orders(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists portfolio_snapshots_portfolio_time_idx
  on public.portfolio_snapshots(portfolio_id, snapshot_time desc);

alter table public.portfolio_snapshots enable row level security;

drop policy if exists "portfolio_snapshots_select_own" on public.portfolio_snapshots;
create policy "portfolio_snapshots_select_own"
on public.portfolio_snapshots for select
to authenticated
using (
  portfolio_id in (
    select id from public.portfolios where profile_id = auth.uid()
  )
);

-- Seed the instruments currently shown by the prototype trading UI.
-- These are still simulated prices; live market-data ingestion comes later.
insert into public.markets (
  symbol,
  name,
  asset_class,
  exchange,
  quote_currency,
  broker_symbol,
  price_precision,
  quantity_precision,
  status,
  is_tradable
)
values
  ('NVDA', 'Nvidia Corp.', 'stocks', 'ALPHENTRA-SIM', 'USD', 'NVDA', 2, 6, 'active', true),
  ('AAPL', 'Apple Inc.', 'stocks', 'ALPHENTRA-SIM', 'USD', 'AAPL', 2, 6, 'active', true),
  ('MSFT', 'Microsoft Corp.', 'stocks', 'ALPHENTRA-SIM', 'USD', 'MSFT', 2, 6, 'active', true),
  ('TSLA', 'Tesla Inc.', 'stocks', 'ALPHENTRA-SIM', 'USD', 'TSLA', 2, 6, 'active', true),
  ('SPY', 'SPDR S&P 500 ETF', 'etf', 'ALPHENTRA-SIM', 'USD', 'SPY', 2, 6, 'active', true),
  ('QQQ', 'Invesco QQQ Trust', 'etf', 'ALPHENTRA-SIM', 'USD', 'QQQ', 2, 6, 'active', true),
  ('AMD', 'Advanced Micro Devices', 'stocks', 'ALPHENTRA-SIM', 'USD', 'AMD', 2, 6, 'active', true),
  ('EURUSD', 'Euro / US Dollar', 'forex', 'ALPHENTRA-SIM', 'USD', 'EURUSD', 4, 6, 'active', true),
  ('BTCUSD', 'Bitcoin / US Dollar', 'crypto', 'ALPHENTRA-SIM', 'USD', 'BTCUSD', 2, 8, 'active', true),
  ('ETHUSD', 'Ethereum / US Dollar', 'crypto', 'ALPHENTRA-SIM', 'USD', 'ETHUSD', 2, 8, 'active', true),
  ('XAUUSD', 'Gold / US Dollar', 'commodity', 'ALPHENTRA-SIM', 'USD', 'XAUUSD', 2, 6, 'active', true),
  ('GLD', 'SPDR Gold Shares', 'etf', 'ALPHENTRA-SIM', 'USD', 'GLD', 2, 6, 'active', true),
  ('TLT', '20+ Year Treasury Bond ETF', 'etf', 'ALPHENTRA-SIM', 'USD', 'TLT', 2, 6, 'active', true)
on conflict (symbol, exchange, asset_class) do update set
  name = excluded.name,
  quote_currency = excluded.quote_currency,
  broker_symbol = excluded.broker_symbol,
  price_precision = excluded.price_precision,
  quantity_precision = excluded.quantity_precision,
  status = excluded.status,
  is_tradable = excluded.is_tradable,
  updated_at = now();

create or replace function private.execute_paper_market_order(
  p_market_symbol text,
  p_side public.order_side,
  p_quantity numeric,
  p_execution_price numeric,
  p_client_order_id text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_portfolio public.portfolios%rowtype;
  v_market public.markets%rowtype;
  v_position public.positions%rowtype;
  v_existing_order public.orders%rowtype;
  v_order_id uuid;
  v_execution_id uuid;
  v_notional numeric;
  v_fee numeric := 0;
  v_cash_after numeric;
  v_new_quantity numeric;
  v_new_average numeric;
  v_realized numeric := 0;
  v_unrealized numeric := 0;
  v_equity numeric := 0;
  v_result jsonb;
begin
  v_user_id := auth.uid();

  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  if p_market_symbol is null or char_length(trim(p_market_symbol)) = 0 then
    raise exception 'Market symbol is required';
  end if;

  if p_quantity is null or p_quantity <= 0 then
    raise exception 'Quantity must be greater than zero';
  end if;

  if p_execution_price is null or p_execution_price <= 0 then
    raise exception 'Execution price must be greater than zero';
  end if;

  if p_side not in ('buy', 'sell') then
    raise exception 'Only buy and sell market orders are supported';
  end if;

  -- Lock the user's paper account first. This serializes balance-changing
  -- operations for the same portfolio.
  select *
  into v_portfolio
  from public.portfolios
  where profile_id = v_user_id
    and name = 'Main Paper Account'
    and portfolio_type = 'paper'
    and is_active = true
  limit 1
  for update;

  if v_portfolio.id is null then
    raise exception 'Main Paper Account was not found';
  end if;

  select *
  into v_market
  from public.markets
  where upper(symbol) = upper(trim(p_market_symbol))
    and status = 'active'
    and is_tradable = true
  order by created_at
  limit 1;

  if v_market.id is null then
    raise exception 'Market % is not available for paper trading', p_market_symbol;
  end if;

  -- Idempotency: a retried client request must not create a second fill.
  if p_client_order_id is not null then
    select *
    into v_existing_order
    from public.orders
    where portfolio_id = v_portfolio.id
      and client_order_id = p_client_order_id
    limit 1
    for update;

    if v_existing_order.id is not null then
      select id
      into v_execution_id
      from public.executions
      where order_id = v_existing_order.id
      order by execution_time
      limit 1;

      return jsonb_build_object(
        'status', 'already_processed',
        'order_id', v_existing_order.id,
        'execution_id', v_execution_id,
        'portfolio_id', v_portfolio.id,
        'market_id', v_existing_order.market_id,
        'side', v_existing_order.side,
        'quantity', v_existing_order.filled_quantity,
        'price', v_existing_order.average_fill_price,
        'cash_balance', v_portfolio.cash_balance,
        'equity', v_portfolio.equity
      );
    end if;
  end if;

  v_notional := p_quantity * p_execution_price;

  -- ALPHENTRA paper trading is commission-free in this phase.
  v_fee := 0;

  if p_side = 'buy' then
    if v_portfolio.cash_balance < (v_notional + v_fee) then
      raise exception 'Insufficient paper buying power. Available: %, required: %',
        round(v_portfolio.cash_balance, 2),
        round(v_notional + v_fee, 2);
    end if;
  else
    select *
    into v_position
    from public.positions
    where portfolio_id = v_portfolio.id
      and market_id = v_market.id
      and side = 'long'
      and is_open = true
    limit 1
    for update;

    if v_position.id is null then
      raise exception 'No open position available to sell';
    end if;

    if p_quantity > v_position.quantity then
      raise exception 'Sell quantity exceeds open position. Available: %, requested: %',
        v_position.quantity,
        p_quantity;
    end if;
  end if;

  insert into public.orders (
    portfolio_id,
    market_id,
    side,
    order_type,
    time_in_force,
    status,
    quantity,
    filled_quantity,
    average_fill_price,
    submitted_at,
    filled_at,
    client_order_id,
    execution_source
  )
  values (
    v_portfolio.id,
    v_market.id,
    p_side,
    'market',
    'ioc',
    'filled',
    p_quantity,
    p_quantity,
    p_execution_price,
    now(),
    now(),
    p_client_order_id,
    'paper'
  )
  returning id into v_order_id;

  insert into public.executions (
    order_id,
    portfolio_id,
    market_id,
    execution_time,
    side,
    quantity,
    price,
    gross_value,
    fee,
    fee_currency,
    execution_source
  )
  values (
    v_order_id,
    v_portfolio.id,
    v_market.id,
    now(),
    p_side,
    p_quantity,
    p_execution_price,
    v_notional,
    v_fee,
    v_portfolio.base_currency,
    'paper'
  )
  returning id into v_execution_id;

  if p_side = 'buy' then
    v_cash_after := v_portfolio.cash_balance - v_notional - v_fee;

    -- Re-read the position under lock in case one was created previously.
    select *
    into v_position
    from public.positions
    where portfolio_id = v_portfolio.id
      and market_id = v_market.id
      and side = 'long'
      and is_open = true
    limit 1
    for update;

    if v_position.id is null then
      insert into public.positions (
        portfolio_id,
        market_id,
        side,
        quantity,
        average_entry_price,
        current_price,
        market_value,
        realized_pnl,
        unrealized_pnl,
        total_fees,
        opened_at,
        last_marked_at,
        is_open
      )
      values (
        v_portfolio.id,
        v_market.id,
        'long',
        p_quantity,
        p_execution_price,
        p_execution_price,
        v_notional,
        0,
        0,
        v_fee,
        now(),
        now(),
        true
      );
    else
      v_new_quantity := v_position.quantity + p_quantity;
      v_new_average := (
        (v_position.quantity * v_position.average_entry_price)
        + (p_quantity * p_execution_price)
      ) / v_new_quantity;

      update public.positions
      set
        quantity = v_new_quantity,
        average_entry_price = v_new_average,
        current_price = p_execution_price,
        market_value = v_new_quantity * p_execution_price,
        unrealized_pnl = (p_execution_price - v_new_average) * v_new_quantity,
        total_fees = v_position.total_fees + v_fee,
        last_marked_at = now(),
        updated_at = now()
      where id = v_position.id;
    end if;

  else
    v_cash_after := v_portfolio.cash_balance + v_notional - v_fee;

    v_realized := (p_execution_price - v_position.average_entry_price) * p_quantity - v_fee;
    v_new_quantity := v_position.quantity - p_quantity;

    if v_new_quantity = 0 then
      update public.positions
      set
        quantity = 0,
        current_price = p_execution_price,
        market_value = 0,
        realized_pnl = v_position.realized_pnl + v_realized,
        unrealized_pnl = 0,
        total_fees = v_position.total_fees + v_fee,
        last_marked_at = now(),
        closed_at = now(),
        is_open = false,
        updated_at = now()
      where id = v_position.id;
    else
      update public.positions
      set
        quantity = v_new_quantity,
        current_price = p_execution_price,
        market_value = v_new_quantity * p_execution_price,
        realized_pnl = v_position.realized_pnl + v_realized,
        unrealized_pnl = (p_execution_price - v_position.average_entry_price) * v_new_quantity,
        total_fees = v_position.total_fees + v_fee,
        last_marked_at = now(),
        updated_at = now()
      where id = v_position.id;
    end if;
  end if;

  select
    coalesce(sum(case when is_open then market_value else 0 end), 0),
    coalesce(sum(case when is_open then unrealized_pnl else 0 end), 0)
  into v_equity, v_unrealized
  from public.positions
  where portfolio_id = v_portfolio.id;

  v_equity := v_cash_after + v_equity;

  update public.portfolios
  set
    cash_balance = v_cash_after,
    equity = v_equity,
    realized_pnl = realized_pnl + v_realized,
    unrealized_pnl = v_unrealized,
    total_fees = total_fees + v_fee,
    updated_at = now()
  where id = v_portfolio.id;

  insert into public.portfolio_snapshots (
    portfolio_id,
    snapshot_time,
    equity,
    cash_balance,
    realized_pnl,
    unrealized_pnl,
    reason,
    order_id
  )
  values (
    v_portfolio.id,
    now(),
    v_equity,
    v_cash_after,
    v_portfolio.realized_pnl + v_realized,
    v_unrealized,
    'trade',
    v_order_id
  );

  v_result := jsonb_build_object(
    'status', 'filled',
    'order_id', v_order_id,
    'execution_id', v_execution_id,
    'portfolio_id', v_portfolio.id,
    'market_id', v_market.id,
    'symbol', v_market.symbol,
    'side', p_side,
    'quantity', p_quantity,
    'price', p_execution_price,
    'notional', v_notional,
    'fee', v_fee,
    'realized_pnl', v_realized,
    'unrealized_pnl', v_unrealized,
    'cash_balance', v_cash_after,
    'equity', v_equity
  );

  return v_result;
end;
$$;

grant usage on schema private to authenticated;
grant execute on function private.execute_paper_market_order(text, public.order_side, numeric, numeric, text) to authenticated;

create or replace function public.execute_paper_market_order(
  p_market_symbol text,
  p_side public.order_side,
  p_quantity numeric,
  p_execution_price numeric,
  p_client_order_id text default null
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  return private.execute_paper_market_order(
    p_market_symbol,
    p_side,
    p_quantity,
    p_execution_price,
    p_client_order_id
  );
end;
$$;

revoke execute on function public.execute_paper_market_order(text, public.order_side, numeric, numeric, text) from public;
revoke execute on function public.execute_paper_market_order(text, public.order_side, numeric, numeric, text) from anon;
grant execute on function public.execute_paper_market_order(text, public.order_side, numeric, numeric, text) to authenticated;

comment on function public.execute_paper_market_order(text, public.order_side, numeric, numeric, text)
is 'Atomically executes an authenticated user paper market order and updates order, execution, position, cash, equity and P&L.';
