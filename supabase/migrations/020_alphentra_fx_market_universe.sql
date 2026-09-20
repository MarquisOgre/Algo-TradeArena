-- Alphentra Database Migration 020
-- Expand the market universe with common FX pairs.
-- MT5 bridge will publish quotes for pairs available from the connected terminal.

insert into public.markets (
  symbol, name, asset_class, exchange, quote_currency, base_currency,
  broker_symbol, price_precision, quantity_precision, status, is_tradable
)
values
  ('GBPUSD', 'British Pound / US Dollar', 'forex', 'FOREX', 'USD', 'GBP', 'GBPUSD', 5, 4, 'active', true),
  ('USDJPY', 'US Dollar / Japanese Yen', 'forex', 'FOREX', 'JPY', 'USD', 'USDJPY', 3, 4, 'active', true),
  ('AUDUSD', 'Australian Dollar / US Dollar', 'forex', 'FOREX', 'USD', 'AUD', 'AUDUSD', 5, 4, 'active', true),
  ('USDCAD', 'US Dollar / Canadian Dollar', 'forex', 'FOREX', 'CAD', 'USD', 'USDCAD', 5, 4, 'active', true),
  ('USDCHF', 'US Dollar / Swiss Franc', 'forex', 'FOREX', 'CHF', 'USD', 'USDCHF', 5, 4, 'active', true),
  ('NZDUSD', 'New Zealand Dollar / US Dollar', 'forex', 'FOREX', 'USD', 'NZD', 'NZDUSD', 5, 4, 'active', true),
  ('EURGBP', 'Euro / British Pound', 'forex', 'FOREX', 'GBP', 'EUR', 'EURGBP', 5, 4, 'active', true),
  ('EURJPY', 'Euro / Japanese Yen', 'forex', 'FOREX', 'JPY', 'EUR', 'EURJPY', 3, 4, 'active', true),
  ('GBPJPY', 'British Pound / Japanese Yen', 'forex', 'FOREX', 'JPY', 'GBP', 'GBPJPY', 3, 4, 'active', true),
  ('AUDJPY', 'Australian Dollar / Japanese Yen', 'forex', 'FOREX', 'JPY', 'AUD', 'AUDJPY', 3, 4, 'active', true)
on conflict (symbol, exchange, asset_class) do update
set
  name = excluded.name,
  broker_symbol = excluded.broker_symbol,
  status = excluded.status,
  is_tradable = excluded.is_tradable,
  updated_at = now();

comment on table public.markets is
  'Alphentra canonical market universe. Provider-specific symbols are stored in broker_symbol.';
