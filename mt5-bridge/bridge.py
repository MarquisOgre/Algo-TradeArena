import os
import sys
import time
from datetime import datetime, timezone
from typing import Any

import MetaTrader5 as mt5
import requests
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.environ["SUPABASE_URL"].rstrip("/")
SUPABASE_PUBLISHABLE_KEY = os.environ["SUPABASE_PUBLISHABLE_KEY"]
MT5_GATEWAY_URL = os.environ["MT5_GATEWAY_URL"]
MT5_GATEWAY_SECRET = os.environ["MT5_GATEWAY_SECRET"]
BROKER_ACCOUNT_ID = os.environ["BROKER_ACCOUNT_ID"]
MT5_ACCOUNT_ID = os.environ["MT5_ACCOUNT_ID"]
MT5_LOGIN = int(os.environ["MT5_LOGIN"])
MT5_PASSWORD = os.environ["MT5_PASSWORD"]
MT5_SERVER = os.environ["MT5_SERVER"]
MT5_PATH = os.getenv("MT5_PATH", "")
POLL_SECONDS = float(os.getenv("POLL_SECONDS", "2"))
CANDLE_SYNC_SECONDS = float(os.getenv("CANDLE_SYNC_SECONDS", "60"))
CANDLE_BARS_PER_SYNC = int(os.getenv("CANDLE_BARS_PER_SYNC", "20"))
CANDLE_BOOTSTRAP = os.getenv("CANDLE_BOOTSTRAP", "false").lower() == "true"
CANDLE_BOOTSTRAP_BARS = int(os.getenv("CANDLE_BOOTSTRAP_BARS", "120"))
CANDLE_CHUNK_SIZE = int(os.getenv("CANDLE_CHUNK_SIZE", "500"))
UNIVERSE_REFRESH_SECONDS = float(os.getenv("UNIVERSE_REFRESH_SECONDS", "300"))
LIVE_STATUS_REFRESH_SECONDS = float(os.getenv("LIVE_STATUS_REFRESH_SECONDS", "30"))
ALLOW_LIVE = os.getenv("ALLOW_LIVE", "false").lower() == "true"

REST_HEADERS = {"apikey": SUPABASE_PUBLISHABLE_KEY, "Accept": "application/json"}
GATEWAY_HEADERS = {"apikey": MT5_GATEWAY_SECRET, "Content-Type": "application/json"}

def iso_from_seconds(value: Any) -> str | None:
    if value is None: return None
    try: return datetime.fromtimestamp(float(value), tz=timezone.utc).isoformat()
    except (TypeError, ValueError, OSError): return None

def initialize_mt5() -> None:
    kwargs: dict[str, Any] = {"login": MT5_LOGIN, "password": MT5_PASSWORD, "server": MT5_SERVER}
    if MT5_PATH: kwargs["path"] = MT5_PATH
    if not mt5.initialize(**kwargs): raise RuntimeError(f"MT5 initialize failed: {mt5.last_error()}")
    account = mt5.account_info()
    if account is None: raise RuntimeError(f"MT5 account_info failed: {mt5.last_error()}")
    environment = os.getenv("MT5_ENVIRONMENT", "demo").lower()
    if environment == "live" and not ALLOW_LIVE: raise RuntimeError("MT5_ENVIRONMENT=live but ALLOW_LIVE is not true. Validate with demo first.")
    print(f"Connected to MT5 login={account.login} server={account.server} balance={account.balance:.2f} equity={account.equity:.2f}")

def normalize_symbol(value: str) -> str:
    return "".join(ch for ch in value.upper() if ch.isalnum())


def classify_mt5_asset(info: Any) -> str | None:
    name = str(getattr(info, "name", "") or "").upper()
    description = str(getattr(info, "description", "") or "").upper()
    path = str(getattr(info, "path", "") or "").upper()
    haystack = f"{name} {description} {path}"

    if "CRYPTOCURRENCIES" in path or "CRYPTO" in path or "DIGITAL ASSETS" in path:
        return "crypto"

    if "FOREX" in path or "\\CURRENCIES\\" in path:
        return "forex"

    if any(token in path for token in ("\\STOCKS\\", "\\SHARES\\", "\\EQUITIES\\")):
        if "ETF" in path or "ETF" in description:
            return "etf"
        return "stocks"

    if any(token in path for token in ("\\ETF\\", "\\ETFS\\")) or " ETF" in description:
        return "etf"

    if any(token in path for token in (
        "\\COMMODITIES\\",
        "\\METALS\\",
        "\\ENERGY\\",
        "\\GOLD\\",
        "\\SILVER\\",
        "\\OIL\\",
        "\\NATURAL GAS\\",
    )):
        return "commodity"

    return None


def is_tradable_mt5(info: Any) -> bool:
    # MT5 trade_mode: 0 disabled, 1 long-only, 2 short-only, 3 full,
    # 4 close-only. For Alphentra's instrument catalog, close-only and
    # disabled instruments are not available for new paper orders.
    trade_mode = int(getattr(info, "trade_mode", 0) or 0)
    return trade_mode in {1, 2, 3}


def build_dynamic_market_universe(symbols: list[Any]) -> list[dict[str, Any]]:
    universe: list[dict[str, Any]] = []

    for info in symbols:
        broker_symbol = str(getattr(info, "name", "") or "").strip()
        if not broker_symbol:
            continue

        asset_class = classify_mt5_asset(info)
        if asset_class is None:
            continue

        description = str(getattr(info, "description", "") or broker_symbol).strip()
        path = str(getattr(info, "path", "") or "").strip()
        exchange = str(getattr(info, "exchange", "") or "").strip() or "MT5"
        base_currency = str(getattr(info, "currency_base", "") or "").strip().upper() or None
        quote_currency = str(getattr(info, "currency_profit", "") or "").strip().upper() or "USD"

        universe.append({
            "symbol": broker_symbol,
            "name": description or broker_symbol,
            "asset_class": asset_class,
            "exchange": exchange,
            "quote_currency": quote_currency,
            "base_currency": base_currency,
            "broker_symbol": broker_symbol,
            "price_precision": int(getattr(info, "digits", 8) or 8),
            "quantity_precision": max(0, min(18, int(getattr(info, "volume_step", 1) and 8))),
            "min_quantity": float(getattr(info, "volume_min", 0) or 0) or None,
            "contract_size": float(getattr(info, "trade_contract_size", 1) or 1),
            "is_tradable": is_tradable_mt5(info),
            "metadata": {
                "provider": "mt5",
                "path": path,
                "description": description,
                "currency_base": base_currency,
                "currency_profit": quote_currency,
                "currency_margin": str(getattr(info, "currency_margin", "") or "").strip().upper() or None,
                "digits": int(getattr(info, "digits", 0) or 0),
                "point": float(getattr(info, "point", 0) or 0),
                "trade_tick_size": float(getattr(info, "trade_tick_size", 0) or 0),
                "trade_tick_value": float(getattr(info, "trade_tick_value", 0) or 0),
                "trade_contract_size": float(getattr(info, "trade_contract_size", 0) or 0),
                "volume_min": float(getattr(info, "volume_min", 0) or 0),
                "volume_max": float(getattr(info, "volume_max", 0) or 0),
                "volume_step": float(getattr(info, "volume_step", 0) or 0),
                "trade_mode": int(getattr(info, "trade_mode", 0) or 0),
                "trade_calc_mode": int(getattr(info, "trade_calc_mode", 0) or 0),
            },
        })

    return universe


def universe_by_symbol(universe: list[dict[str, Any]]) -> dict[str, dict[str, Any]]:
    return {str(row["broker_symbol"]).upper(): row for row in universe}


def collect_market_statuses(universe: list[dict[str, Any]]) -> list[dict[str, Any]]:
    statuses: list[dict[str, Any]] = []

    for market in universe:
        symbol = market["broker_symbol"]
        info = mt5.symbol_info(symbol)
        if info is None:
            statuses.append({
                "symbol": market["symbol"],
                "status": "unsupported",
                "provider_symbol": symbol,
                "checked_at": datetime.now(timezone.utc).isoformat(),
                "metadata": {**market["metadata"], "reason": "MT5 symbol_info unavailable."},
            })
            continue

        if not info.visible:
            mt5.symbol_select(symbol, True)
            info = mt5.symbol_info(symbol) or info

        tick = mt5.symbol_info_tick(symbol)
        has_quote = tick is not None and tick.bid > 0 and tick.ask > 0

        statuses.append({
            "symbol": market["symbol"],
            "status": "live" if has_quote else "no_quote",
            "provider_symbol": symbol,
            "checked_at": datetime.now(timezone.utc).isoformat(),
            "metadata": {
                **market["metadata"],
                "bid": float(tick.bid) if tick and tick.bid > 0 else None,
                "ask": float(tick.ask) if tick and tick.ask > 0 else None,
                "reason": "Usable bid/ask received." if has_quote else "Valid MT5 instrument without a usable bid/ask right now.",
            },
        })

    return statuses


def collect_quotes(universe: list[dict[str, Any]]) -> list[dict[str, Any]]:
    quotes: list[dict[str, Any]] = []

    for market in universe:
        symbol = market["broker_symbol"]
        info = mt5.symbol_info(symbol)
        if info is None:
            continue

        if not info.visible and not mt5.symbol_select(symbol, True):
            continue

        tick = mt5.symbol_info_tick(symbol)
        if tick is None or tick.bid <= 0 or tick.ask <= 0:
            continue

        price = float((tick.bid + tick.ask) / 2)
        previous_close = None
        change = None
        change_pct = None
        session_volume = None

        daily_rates = mt5.copy_rates_from_pos(symbol, mt5.TIMEFRAME_D1, 1, 1)
        if daily_rates is not None and len(daily_rates) > 0:
            previous_close = float(daily_rates[0]["close"])
            if previous_close > 0:
                change = price - previous_close
                change_pct = (change / previous_close) * 100.0

        current_daily = mt5.copy_rates_from_pos(symbol, mt5.TIMEFRAME_D1, 0, 1)
        if current_daily is not None and len(current_daily) > 0:
            session_volume = float(current_daily[0]["tick_volume"])

        tick_time = float(getattr(tick, "time", 0) or 0)
        quote_age_seconds = max(0.0, time.time() - tick_time) if tick_time > 0 else float("inf")
        is_market_open = quote_age_seconds <= max(120.0, POLL_SECONDS * 10.0)

        quotes.append({
            "symbol": market["symbol"],
            "provider_symbol": symbol,
            "bid": float(tick.bid),
            "ask": float(tick.ask),
            "price": price,
            "change": change,
            "percent_change": change_pct,
            "previous_close": previous_close,
            "quote_time": iso_from_seconds(getattr(tick, "time", None)),
            "volume": session_volume,
            "is_market_open": is_market_open,
            "metadata": {
                **market["metadata"],
                "mt5_time_msc": getattr(tick, "time_msc", None),
                "volume_type": "tick_volume",
                "reference": "previous_completed_d1_close",
                "synced_at": datetime.now(timezone.utc).isoformat(),
            },
        })

    return quotes


def collect_candles(universe: list[dict[str, Any]], bars: int) -> list[dict[str, Any]]:
    candles: list[dict[str, Any]] = []
    timeframes = (
        ("1m", mt5.TIMEFRAME_M1),
        ("5m", mt5.TIMEFRAME_M5),
        ("15m", mt5.TIMEFRAME_M15),
        ("1h", mt5.TIMEFRAME_H1),
        ("4h", mt5.TIMEFRAME_H4),
        ("1d", mt5.TIMEFRAME_D1),
    )

    # History is intentionally collected only for instruments that currently
    # have a usable quote. This keeps the development feed focused on the
    # live MT5 universe instead of creating huge historical backfill costs.
    live_universe = []
    for market in universe:
        tick = mt5.symbol_info_tick(market["broker_symbol"])
        if tick is not None and tick.bid > 0 and tick.ask > 0:
            live_universe.append(market)

    for timeframe_name, timeframe in timeframes:
        count = bars if timeframe_name in {"1m", "5m", "15m"} else min(bars, 100)
        for market in live_universe:
            symbol = market["broker_symbol"]
            info = mt5.symbol_info(symbol)
            if info is None:
                continue
            if not info.visible and not mt5.symbol_select(symbol, True):
                continue

            rates = mt5.copy_rates_from_pos(symbol, timeframe, 0, count)
            if rates is None:
                continue

            for rate in rates:
                candle_time = iso_from_seconds(rate["time"])
                if not candle_time:
                    continue

                candles.append({
                    "symbol": market["symbol"],
                    "timeframe": timeframe_name,
                    "candle_time": candle_time,
                    "open": float(rate["open"]),
                    "high": float(rate["high"]),
                    "low": float(rate["low"]),
                    "close": float(rate["close"]),
                    "volume": float(rate["tick_volume"]),
                    "trade_count": None,
                    "metadata": {"asset_class": market["asset_class"], "source": "mt5"},
                })

    return candles


def collect_positions() -> list[dict[str, Any]]:
    positions=mt5.positions_get() or []
    snapshots=[]
    for position in positions:
        snapshots.append({"ticket":int(position.ticket),"symbol":position.symbol,"side":"long" if position.type == mt5.POSITION_TYPE_BUY else "short","volume":float(position.volume),"open_price":float(position.price_open),"current_price":float(position.price_current),"stop_loss":float(position.sl) if position.sl else None,"take_profit":float(position.tp) if position.tp else None,"swap":float(position.swap),"commission":float(getattr(position,"commission",0.0)),"profit":float(position.profit),"opened_at":iso_from_seconds(position.time),"metadata":{"magic":int(position.magic),"comment":position.comment}})
    return snapshots

def collect_account() -> dict[str, Any]:
    account=mt5.account_info()
    if account is None: raise RuntimeError(f"MT5 account_info failed: {mt5.last_error()}")
    version=mt5.version()
    terminal_build=int(version[1]) if version and len(version)>1 else None
    return {"login":str(account.login),"server":account.server,"balance":float(account.balance),"equity":float(account.equity),"margin":float(account.margin),"free_margin":float(account.margin_free),"leverage":int(account.leverage) if account.leverage else None,"currency":account.currency,"terminal_build":terminal_build,"is_hedging_account":int(account.margin_mode)==2}

def push_sync(payload: dict[str, Any], label: str = "sync") -> None:
    response=requests.post(MT5_GATEWAY_URL,headers=GATEWAY_HEADERS,json=payload,timeout=20)
    if not response.ok: raise RuntimeError(f"MT5 gateway returned {response.status_code}: {response.text[:500]}")
    result=response.json()
    if label == "sync":
        print(f"Synced quotes={result.get('quotes_updated',0)} positions={result.get('positions_updated',0)}")
    else:
        print(f"Synced {label}")

def sync_once(
    markets: list[dict[str, Any]],
    market_symbol_map: dict[str, dict[str, Any]],
) -> None:
    market_statuses = collect_market_statuses(markets, market_symbol_map)
    push_sync({
        "broker_account_id": BROKER_ACCOUNT_ID,
        "mt5_account_id": MT5_ACCOUNT_ID,
        "market_statuses": market_statuses,
        "broker_market_mappings": market_statuses,
        "account": collect_account(),
        "quotes": collect_quotes(markets, market_symbol_map),
        "positions": collect_positions(),
    })

def main() -> None:
    initialize_mt5()
    try:
        symbols = list(mt5.symbols_get() or [])
        print(f"MT5 symbol resolver: {len(symbols)} terminal symbols available")

        universe = build_dynamic_market_universe(symbols)
        print(f"Dynamic MT5 universe: {len(universe)} qualified instruments")

        by_class: dict[str, int] = {}
        for market in universe:
            by_class[market["asset_class"]] = by_class.get(market["asset_class"], 0) + 1
        print("  " + " | ".join(f"{key}={value}" for key, value in sorted(by_class.items())))

        last_universe_refresh = 0.0
        last_status_refresh = 0.0
        last_candle_sync = 0.0
        bootstrap_pending = CANDLE_BOOTSTRAP

        while True:
            started = time.monotonic()
            try:
                now = time.monotonic()

                # The instrument universe is discovered from the connected
                # Pepperstone MT5 terminal. No Alphentra instrument symbols
                # are hardcoded or used as a source of truth.
                refresh_universe = now - last_universe_refresh >= UNIVERSE_REFRESH_SECONDS
                refresh_status = now - last_status_refresh >= LIVE_STATUS_REFRESH_SECONDS

                if refresh_universe:
                    universe = build_dynamic_market_universe(list(mt5.symbols_get() or []))
                    market_statuses = collect_market_statuses(universe)
                    push_sync({
                        "broker_account_id": BROKER_ACCOUNT_ID,
                        "mt5_account_id": MT5_ACCOUNT_ID,
                        "market_universe": universe,
                        "market_statuses": market_statuses,
                        "broker_market_mappings": market_statuses,
                        "account": collect_account(),
                    })
                    last_universe_refresh = now
                    last_status_refresh = now
                    print(f"MT5 universe synced: {len(universe)} instruments")

                elif refresh_status:
                    market_statuses = collect_market_statuses(universe)
                    push_sync({
                        "broker_account_id": BROKER_ACCOUNT_ID,
                        "mt5_account_id": MT5_ACCOUNT_ID,
                        "market_statuses": market_statuses,
                        "broker_market_mappings": market_statuses,
                    })
                    last_status_refresh = now

                push_sync({
                    "broker_account_id": BROKER_ACCOUNT_ID,
                    "mt5_account_id": MT5_ACCOUNT_ID,
                    "account": collect_account(),
                    "quotes": collect_quotes(universe),
                    "positions": collect_positions(),
                })

                if bootstrap_pending:
                    candles = collect_candles(universe, CANDLE_BOOTSTRAP_BARS)
                    push_candle_chunks(candles)
                    bootstrap_pending = False
                    last_candle_sync = now
                elif now - last_candle_sync >= CANDLE_SYNC_SECONDS:
                    candles = collect_candles(universe, CANDLE_BARS_PER_SYNC)
                    push_candle_chunks(candles)
                    last_candle_sync = now

            except Exception as exc:
                print(f"Sync error: {exc}", file=sys.stderr)

            time.sleep(max(0.25, POLL_SECONDS - (time.monotonic() - started)))

    except KeyboardInterrupt:
        print("Stopping MT5 bridge.")
    finally:
        mt5.shutdown()

if __name__ == "__main__":
    main()
