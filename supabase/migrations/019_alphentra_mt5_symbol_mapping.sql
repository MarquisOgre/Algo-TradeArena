-- Alphentra Database Migration 019
-- Map Alphentra crypto instruments to the MetaQuotes-Demo symbol names
-- discovered during MT5 bridge symbol discovery.

update public.markets
set broker_symbol = 'BTC',
    updated_at = now()
where symbol = 'BTCUSD';

update public.markets
set broker_symbol = 'ETH',
    updated_at = now()
where symbol = 'ETHUSD';

comment on column public.markets.broker_symbol is
  'Provider-specific trading symbol used by the MT5 bridge and future broker adapters.';
