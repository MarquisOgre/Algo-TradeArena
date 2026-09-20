-- Alphentra Database Migration 015
-- Market data foundation: latest quotes plus authenticated portfolio mark-to-market.

create table if not exists public.market_quotes (
  id bigint generated always as identity primary key,
  market_id uuid not null references public.markets(id) on delete cascade,
  provider text not null,
  quote_time timestamptz not null,
  price numeric(30,12) not null,
  open numeric(30,12),
  high numeric(30,12),
  low numeric(30,12),
  previous_close numeric(30,12),
  change numeric(30,12),
  percent_change numeric(30,12),
  volume numeric(36,12),
  is_market_open boolean,
  provider_symbol text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint market_quotes_price_check check (price > 0),
  constraint market_quotes_open_check check (open is null or open > 0),
  constraint market_quotes_high_check check (high is null or high > 0),
  constraint market_quotes_low_check check (low is null or low > 0),
  constraint market_quotes_previous_close_check check (previous_close is null or previous_close > 0),
  constraint market_quotes_volume_check check (volume is null or volume >= 0),
  unique (market_id, provider)
);

create index if not exists market_quotes_market_time_idx
  on public.market_quotes(market_id, quote_time desc);

create index if not exists market_quotes_provider_time_idx
  on public.market_quotes(provider, quote_time desc);

alter table public.market_quotes enable row level security;

revoke all on table public.market_quotes from anon;
revoke all on table public.market_quotes from authenticated;
grant select on table public.market_quotes to anon, authenticated;

drop policy if exists "market_quotes_select_active" on public.market_quotes;
create policy "market_quotes_select_active"
on public.market_quotes for select
to anon, authenticated
using (
  market_id in (
    select id from public.markets where status = 'active'
  )
);

create or replace function public.refresh_paper_portfolio_marks()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_portfolio public.portfolios%rowtype;
  v_position public.positions%rowtype;
  v_price numeric;
  v_market_value numeric;
  v_unrealized numeric;
  v_total_market_value numeric := 0;
  v_total_unrealized numeric := 0;
  v_equity numeric := 0;
begin
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
    raise exception 'Main Paper Account was not found';
  end if;

  for v_position in
    select *
    from public.positions
    where portfolio_id = v_portfolio.id
      and is_open = true
    for update
  loop
    select q.price
    into v_price
    from public.market_quotes q
    where q.market_id = v_position.market_id
    order by q.quote_time desc
    limit 1;

    if v_price is not null then
      v_market_value := v_position.quantity * v_price;
      v_unrealized := (v_price - v_position.average_entry_price) * v_position.quantity;

      update public.positions
      set
        current_price = v_price,
        market_value = v_market_value,
        unrealized_pnl = v_unrealized,
        last_marked_at = now(),
        updated_at = now()
      where id = v_position.id;

      v_total_market_value := v_total_market_value + v_market_value;
      v_total_unrealized := v_total_unrealized + v_unrealized;
    else
      v_total_market_value := v_total_market_value + v_position.market_value;
      v_total_unrealized := v_total_unrealized + v_position.unrealized_pnl;
    end if;
  end loop;

  v_equity := v_portfolio.cash_balance + v_total_market_value;

  update public.portfolios
  set
    equity = v_equity,
    unrealized_pnl = v_total_unrealized,
    updated_at = now()
  where id = v_portfolio.id;

  return jsonb_build_object(
    'portfolio_id', v_portfolio.id,
    'equity', v_equity,
    'cash_balance', v_portfolio.cash_balance,
    'unrealized_pnl', v_total_unrealized,
    'marked_at', now()
  );
end;
$$;

revoke execute on function public.refresh_paper_portfolio_marks() from public;
revoke execute on function public.refresh_paper_portfolio_marks() from anon;
grant execute on function public.refresh_paper_portfolio_marks() to authenticated;

comment on table public.market_quotes is
  'Latest normalized quote snapshot per market/provider. Provider credentials never reach the browser.';

comment on function public.refresh_paper_portfolio_marks() is
  'Marks the authenticated paper portfolio against the latest market quotes and recalculates equity/unrealized P&L.';


-- Stream quote updates to connected clients. Realtime must still be enabled for the
-- project; this block only adds the table to the publication when it is available.
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (
       select 1
       from pg_publication_tables
       where pubname = 'supabase_realtime'
         and schemaname = 'public'
         and tablename = 'market_quotes'
     )
  then
    execute 'alter publication supabase_realtime add table public.market_quotes';
  end if;
end
$$;
