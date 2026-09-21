# Alphentra MT5 Bridge

The MT5 bridge is the first real connector layer between a MetaTrader 5 terminal and Alphentra.

Architecture:
MetaTrader 5 terminal -> Python MetaTrader5 package -> mt5-bridge -> Supabase Edge Function mt5-gateway -> Supabase.

The bridge reads quotes, account state and open positions from the local MT5 terminal and sends normalized snapshots to the gateway. MT5 credentials never enter the browser.

Windows setup:
1. Install MetaTrader 5 from your broker.
2. Create or use a demo MT5 account first.
3. Install Python 3.11+.
4. In PowerShell: python -m venv .venv, then .\\.venv\\Scripts\\Activate.ps1, then pip install -r requirements.txt.
5. Create a local .env using the variable names listed below.
6. Run: python bridge.py

Required environment variables:
SUPABASE_URL
SUPABASE_PUBLISHABLE_KEY
MT5_GATEWAY_URL
MT5_GATEWAY_SECRET
BROKER_ACCOUNT_ID
MT5_ACCOUNT_ID
MT5_LOGIN
MT5_PASSWORD
MT5_SERVER
MT5_PATH
MT5_ENVIRONMENT=demo
ALLOW_LIVE=false
POLL_SECONDS=2

Security:
- Never commit .env.
- Never send MT5 passwords or gateway secrets in chat.
- Keep ALLOW_LIVE=false while validating.
- The gateway accepts only the named mt5-gateway Supabase secret.
- The browser never receives MT5 credentials.

Live order routing is intentionally not enabled in this first connector milestone. After quote/account/position synchronization is validated, we will add order_check/order_send, reconciliation, SL/TP, close/modify and copy-trading execution.


Candle history:
- Live quotes are synchronized across the dynamically discovered MT5 universe.
- Historical candles are fetched only when Alphentra requests a market/timeframe.
- Supported chart timeframes are 1m, 5m, 15m, 1h, 4h and 1d.
- The bridge polls the short-lived `market_data_requests` queue and marks requests fulfilled through the gateway after MT5 history is accepted.
- There is no bulk candle bootstrap across the full MT5 universe.
