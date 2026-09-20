-- Alphentra Database Migration 016
-- MT5-first market data foundation: bid/ask quotes and bridge synchronization metadata.

alter table public.market_quotes
  add column if not exists bid numeric(30,12),
  add column if not exists ask numeric(30,12),
  add column if not exists spread numeric(30,12);

alter table public.market_quotes
  drop constraint if exists market_quotes_bid_check,
  drop constraint if exists market_quotes_ask_check,
  drop constraint if exists market_quotes_spread_check;

alter table public.market_quotes
  add constraint market_quotes_bid_check check (bid is null or bid > 0),
  add constraint market_quotes_ask_check check (ask is null or ask > 0),
  add constraint market_quotes_spread_check check (spread is null or spread >= 0);

create index if not exists market_quotes_mt5_time_idx
  on public.market_quotes(provider, quote_time desc)
  where provider = 'mt5';

comment on column public.market_quotes.bid is
  'Latest bid price from the normalized market-data provider.';

comment on column public.market_quotes.ask is
  'Latest ask price from the normalized market-data provider.';

comment on column public.market_quotes.spread is
  'Latest ask minus bid in price units.';

comment on table public.market_quotes is
  'Latest normalized quote snapshot per market/provider. MT5 is the primary trading provider; credentials never reach the browser.';
