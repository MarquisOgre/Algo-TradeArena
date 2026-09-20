# ALPHENTRA Market Data Engine

The market-data layer is provider-backed and browser-safe.

## Flow

`Twelve Data -> Supabase Edge Function -> market_quotes -> Supabase Realtime -> Markets / Trade UI`

The browser never receives the Twelve Data API key. Supabase recommends keeping third-party credentials in Edge Function secrets rather than shipping them to clients. citeturn0search0turn7search3

## Current provider adapter

The first adapter is Twelve Data.

- `/quote` supplies the latest quote, change, percent change, volume and market-open state.
- Batch quote requests can contain multiple symbols in one request.
- The ALPHENTRA adapter normalizes the symbols used by the paper-trading universe, including `EUR/USD`, `BTC/USD`, `ETH/USD`, and `XAU/USD`.

Twelve Data documents the quote and time-series endpoints and batch requests here:

- https://twelvedata.com/docs
- https://support.twelvedata.com/en/articles/5203360-batch-api-requests

## Supabase setup

1. Apply `supabase/migrations/015_alphentra_market_data.sql` in the Supabase SQL Editor.
2. In Supabase **Settings -> API Keys**, create a dedicated **secret API key** named:
   `market-data-sync`
3. In **Edge Functions -> Secrets**, add:
   `TWELVE_DATA_API_KEY=<your Twelve Data key>`
4. Deploy the function:
   `supabase functions deploy market-data-sync`
5. Test it with the dedicated secret API key using the `apikey` header.
6. Configure Supabase Cron to invoke the function on the cadence allowed by the market-data provider and the plan. Supabase Cron can make HTTP requests to Edge Functions.

Do not put either the Twelve Data key or the Supabase secret API key in the repository, frontend environment variables, or browser code.

## Why the function is protected

`market-data-sync` is a server-to-server function. It uses the named secret-key auth mode and the privileged Supabase client only inside the Edge Function. The function writes to `market_quotes`, while browser clients have read-only access through RLS.

Supabase documents the `@supabase/server` secret-key pattern for server-to-server functions and recommends disabling the platform JWT check when using the new API-key model, allowing the function middleware to authorize the request. 

## Next market-data steps

- Historical candle ingestion into `market_data`
- Provider health / latency monitoring
- Market session state
- WebSocket price streaming where the selected provider/plan supports it
- Multi-provider fallback
- Data-quality checks
- Stale-price protection before paper execution
