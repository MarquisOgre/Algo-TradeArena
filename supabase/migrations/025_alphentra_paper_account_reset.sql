-- Alphentra Database Migration 025
-- Paper Trading Account reset.
--
-- Reset is intentionally scoped to the authenticated user's active
-- Main Paper Account. It removes paper trading activity and restores the
-- account to exactly $100,000 virtual USD without creating a new account.

create or replace function public.reset_paper_account()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_portfolio public.portfolios%rowtype;
begin
  v_user_id := auth.uid();

  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

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
    raise exception 'Active Main Paper Account was not found';
  end if;

  -- Remove all paper trading activity for this account. The portfolio itself
  -- is retained so activation state, ownership and account identity remain
  -- stable. Child rows are removed explicitly rather than relying on cascade.
  delete from public.executions
  where portfolio_id = v_portfolio.id;

  delete from public.orders
  where portfolio_id = v_portfolio.id;

  delete from public.positions
  where portfolio_id = v_portfolio.id;

  delete from public.portfolio_snapshots
  where portfolio_id = v_portfolio.id;

  update public.portfolios
  set
    initial_cash = 100000,
    cash_balance = 100000,
    equity = 100000,
    realized_pnl = 0,
    unrealized_pnl = 0,
    total_fees = 0,
    account_status = 'active',
    is_active = true,
    activated_at = coalesce(activated_at, now()),
    updated_at = now()
  where id = v_portfolio.id
  returning * into v_portfolio;

  return jsonb_build_object(
    'status', 'reset',
    'portfolio_id', v_portfolio.id,
    'initial_cash', v_portfolio.initial_cash,
    'cash_balance', v_portfolio.cash_balance,
    'equity', v_portfolio.equity,
    'realized_pnl', v_portfolio.realized_pnl,
    'unrealized_pnl', v_portfolio.unrealized_pnl,
    'total_fees', v_portfolio.total_fees,
    'reset_at', v_portfolio.updated_at
  );
end;
$$;

revoke all on function public.reset_paper_account() from public;
revoke all on function public.reset_paper_account() from anon;
grant execute on function public.reset_paper_account() to authenticated;

comment on function public.reset_paper_account()
is 'Resets the authenticated users active Main Paper Account to $100,000 virtual USD and deletes its paper orders, executions, positions and portfolio snapshots.';
