-- Alphentra Database Migration 024
-- Enforce active Paper Trading account status at the execution boundary.

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
begin
  v_user_id := auth.uid();

  if v_user_id is null then raise exception 'Authentication required'; end if;
  if p_market_symbol is null or char_length(trim(p_market_symbol)) = 0 then raise exception 'Market symbol is required'; end if;
  if p_quantity is null or p_quantity <= 0 then raise exception 'Quantity must be greater than zero'; end if;
  if p_execution_price is null or p_execution_price <= 0 then raise exception 'Execution price must be greater than zero'; end if;
  if p_side not in ('buy', 'sell') then raise exception 'Only buy and sell market orders are supported'; end if;

  select * into v_portfolio
  from public.portfolios
  where profile_id = v_user_id
    and name = 'Main Paper Account'
    and portfolio_type = 'paper'
    and account_status = 'active'
    and is_active = true
  limit 1 for update;

  if v_portfolio.id is null then
    raise exception 'Paper Trading Account is not active. Activate Paper Trading before placing an order.';
  end if;

  select * into v_market
  from public.markets
  where upper(symbol) = upper(trim(p_market_symbol))
    and status = 'active'
    and is_tradable = true
  order by created_at limit 1;

  if v_market.id is null then raise exception 'Market % is not available for paper trading', p_market_symbol; end if;

  if p_client_order_id is not null then
    select * into v_existing_order
    from public.orders
    where portfolio_id = v_portfolio.id and client_order_id = p_client_order_id
    limit 1 for update;

    if v_existing_order.id is not null then
      select id into v_execution_id from public.executions
      where order_id = v_existing_order.id order by execution_time limit 1;
      return jsonb_build_object(
        'status','already_processed',
        'order_id',v_existing_order.id,
        'execution_id',v_execution_id,
        'portfolio_id',v_portfolio.id,
        'market_id',v_existing_order.market_id,
        'side',v_existing_order.side,
        'quantity',v_existing_order.filled_quantity,
        'price',v_existing_order.average_fill_price,
        'cash_balance',v_portfolio.cash_balance,
        'equity',v_portfolio.equity
      );
    end if;
  end if;

  v_notional := p_quantity * p_execution_price;

  if p_side = 'buy' then
    if v_portfolio.cash_balance < v_notional then
      raise exception 'Insufficient paper buying power. Available: %, required: %',
        round(v_portfolio.cash_balance, 2), round(v_notional, 2);
    end if;
  else
    select * into v_position
    from public.positions
    where portfolio_id = v_portfolio.id and market_id = v_market.id
      and side = 'long' and is_open = true
    limit 1 for update;

    if v_position.id is null then raise exception 'No open position available to sell'; end if;
    if p_quantity > v_position.quantity then
      raise exception 'Sell quantity exceeds open position. Available: %, requested: %',
        v_position.quantity, p_quantity;
    end if;
  end if;

  insert into public.orders (
    portfolio_id, market_id, side, order_type, time_in_force, status,
    quantity, filled_quantity, average_fill_price, submitted_at, filled_at,
    client_order_id, execution_source
  ) values (
    v_portfolio.id, v_market.id, p_side, 'market', 'ioc', 'filled',
    p_quantity, p_quantity, p_execution_price, now(), now(),
    p_client_order_id, 'paper'
  ) returning id into v_order_id;

  insert into public.executions (
    order_id, portfolio_id, market_id, execution_time, side, quantity,
    price, gross_value, fee, fee_currency, execution_source
  ) values (
    v_order_id, v_portfolio.id, v_market.id, now(), p_side, p_quantity,
    p_execution_price, v_notional, 0, v_portfolio.base_currency, 'paper'
  ) returning id into v_execution_id;

  if p_side = 'buy' then
    v_cash_after := v_portfolio.cash_balance - v_notional;

    select * into v_position from public.positions
    where portfolio_id = v_portfolio.id and market_id = v_market.id
      and side = 'long' and is_open = true
    limit 1 for update;

    if v_position.id is null then
      insert into public.positions (
        portfolio_id, market_id, side, quantity, average_entry_price,
        current_price, market_value, realized_pnl, unrealized_pnl,
        total_fees, opened_at, last_marked_at, is_open
      ) values (
        v_portfolio.id, v_market.id, 'long', p_quantity, p_execution_price,
        p_execution_price, v_notional, 0, 0, 0, now(), now(), true
      );
    else
      v_new_quantity := v_position.quantity + p_quantity;
      v_new_average := ((v_position.quantity * v_position.average_entry_price)
        + (p_quantity * p_execution_price)) / v_new_quantity;
      update public.positions set
        quantity=v_new_quantity, average_entry_price=v_new_average,
        current_price=p_execution_price, market_value=v_new_quantity*p_execution_price,
        unrealized_pnl=(p_execution_price-v_new_average)*v_new_quantity,
        last_marked_at=now(), updated_at=now()
      where id=v_position.id;
    end if;
  else
    v_cash_after := v_portfolio.cash_balance + v_notional;
    v_realized := (p_execution_price - v_position.average_entry_price) * p_quantity;
    v_new_quantity := v_position.quantity - p_quantity;

    update public.positions set
      quantity=v_new_quantity, current_price=p_execution_price,
      market_value=v_new_quantity*p_execution_price,
      realized_pnl=v_position.realized_pnl+v_realized,
      unrealized_pnl=case when v_new_quantity=0 then 0 else
        (p_execution_price-v_position.average_entry_price)*v_new_quantity end,
      closed_at=case when v_new_quantity=0 then now() else closed_at end,
      is_open=(v_new_quantity > 0), last_marked_at=now(), updated_at=now()
    where id=v_position.id;
  end if;

  select coalesce(sum(case when is_open then market_value else 0 end),0),
         coalesce(sum(case when is_open then unrealized_pnl else 0 end),0)
  into v_equity, v_unrealized
  from public.positions where portfolio_id=v_portfolio.id;

  v_equity := v_cash_after + v_equity;

  update public.portfolios set
    cash_balance=v_cash_after, equity=v_equity,
    realized_pnl=realized_pnl+v_realized, unrealized_pnl=v_unrealized,
    updated_at=now()
  where id=v_portfolio.id;

  insert into public.portfolio_snapshots (
    portfolio_id, snapshot_time, equity, cash_balance,
    realized_pnl, unrealized_pnl, reason, order_id
  ) values (
    v_portfolio.id, now(), v_equity, v_cash_after,
    v_portfolio.realized_pnl+v_realized, v_unrealized, 'trade', v_order_id
  );

  return jsonb_build_object(
    'status','filled','order_id',v_order_id,'execution_id',v_execution_id,
    'portfolio_id',v_portfolio.id,'market_id',v_market.id,'symbol',v_market.symbol,
    'side',p_side,'quantity',p_quantity,'price',p_execution_price,
    'notional',v_notional,'fee',0,'realized_pnl',v_realized,
    'unrealized_pnl',v_unrealized,'cash_balance',v_cash_after,'equity',v_equity
  );
end;
$$;

create or replace function public.execute_paper_market_order(
  p_market_symbol text,
  p_side public.order_side,
  p_quantity numeric,
  p_execution_price numeric,
  p_client_order_id text default null
)
returns jsonb language plpgsql security invoker set search_path = ''
as $$
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  return private.execute_paper_market_order(
    p_market_symbol,p_side,p_quantity,p_execution_price,p_client_order_id
  );
end;
$$;

revoke execute on function public.execute_paper_market_order(text, public.order_side, numeric, numeric, text) from public;
revoke execute on function public.execute_paper_market_order(text, public.order_side, numeric, numeric, text) from anon;
grant execute on function public.execute_paper_market_order(text, public.order_side, numeric, numeric, text) to authenticated;
