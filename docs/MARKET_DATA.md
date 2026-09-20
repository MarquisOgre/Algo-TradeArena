# ALPHENTRA Market Data Engine

The market-data layer is now **MT5-first** for the trading universe.

## Flow

`MetaTrader 5 terminal -> Python MT5 bridge -> Supabase Edge Function -> market_quotes -> Supabase Realtime -> Markets / Trade UI`

The browser never receives MT5 account credentials. The MT5 bridge runs outside the browser and uses a dedicated Supabase secret to publish normalized snapshots.

## Primary provider: MetaTrader 5

MT5 supplies the quote/account/position state for instruments available through the connected broker.

The bridge normalizes:

- Bid
- Ask
- Mid/mark price
- Spread
- Quote timestamp
- Account balance/equity/margin/free margin
- Open MT5 positions

The available symbol universe should ultimately come from the connected MT5 broker rather than a hard-coded third-party data catalog.

## Supabase setup

1. Apply `supabase/migrations/016_alphentra_mt5_market_data.sql` after migrations 001-015.
2. In Supabase **Settings -> API Keys**, create a dedicated secret API key named `mt5-gateway`.
3. Deploy the `mt5-gateway` Edge Function.
4. In the local MT5 bridge, set the gateway URL and the `mt5-gateway` secret in the ignored local environment file.
5. Register an MT5 account in Alphentra so the bridge has the `broker_account_id` and `mt5_account_id`.
6. Run the Windows bridge with a **demo MT5 account first**.

Do not put MT5 passwords, gateway secrets, or other broker credentials in the repository or browser environment.

## Current connector milestone

This milestone is deliberately **read/synchronization only**:

- MT5 -> Alphentra quotes
- MT5 -> Alphentra account state
- MT5 -> Alphentra open positions
- MT5 -> Alphentra connection health

Live order routing is not enabled yet.

## Next MT5 steps

- MT5 symbol discovery and contract specifications
- Historical candle ingestion
- Market-session state
- Stale-price protection
- Pending order queue
- `order_check` validation
- `order_send` execution
- Execution reconciliation
- SL/TP and close/modify operations
- Multi-account MT5 support
- Copy-trading replication and risk controls

MetaTrader's official Python integration provides terminal initialization, tick retrieval, account information, positions and order submission capabilities. The bridge starts with synchronization before enabling order submission.
