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

def fetch_markets() -> list[dict[str, Any]]:
    response = requests.get(f"{SUPABASE_URL}/rest/v1/markets", headers=REST_HEADERS, params={"select":"id,symbol,broker_symbol,asset_class","status":"eq.active","is_tradable":"eq.true","order":"symbol.asc"}, timeout=15)
    response.raise_for_status()
    return response.json()

def build_mt5_symbol_map() -> dict[str, str]:
    symbols = mt5.symbols_get() or []
    return {str(symbol.name).upper(): str(symbol.name) for symbol in symbols if getattr(symbol, "name", None)}

def resolve_mt5_symbol(market: dict[str, Any], symbol_map: dict[str, str]) -> str | None:
    requested = str(market.get("broker_symbol") or market["symbol"]).strip()
    candidates = [requested, str(market["symbol"]).strip()]

    # Common crypto aliases on MetaQuotes-Demo. The terminal exposes BTC/ETH
    # rather than the UI's BTCUSD/ETHUSD symbols.
    aliases = {
        "BTCUSD": ["BTC", "BTCUSD"],
        "ETHUSD": ["ETH", "ETHUSD"],
        "XAUUSD": ["XAUUSD", "GOLD"],
    }
    candidates.extend(aliases.get(requested.upper(), []))

    for candidate in candidates:
        if candidate.upper() in symbol_map:
            return symbol_map[candidate.upper()]

    normalized = "".join(ch for ch in requested.upper() if ch.isalnum())
    for name_upper, actual_name in symbol_map.items():
        normalized_name = "".join(ch for ch in name_upper if ch.isalnum())
        if normalized_name == normalized:
            return actual_name

    return None

def collect_quotes(markets: list[dict[str, Any]], symbol_map: dict[str, str]) -> list[dict[str, Any]]:
    quotes=[]
    for market in markets:
        symbol = resolve_mt5_symbol(market, symbol_map)
        if not symbol:
            continue
        info=mt5.symbol_info(symbol)
        if info is None: continue
        if not info.visible and not mt5.symbol_select(symbol, True): continue
        tick=mt5.symbol_info_tick(symbol)
        if tick is None or tick.bid <= 0 or tick.ask <= 0: continue
        quotes.append({"market_id":market["id"],"symbol":symbol,"bid":float(tick.bid),"ask":float(tick.ask),"price":float((tick.bid+tick.ask)/2),"quote_time":iso_from_seconds(getattr(tick,"time",None)),"volume":None,"metadata":{"asset_class":market["asset_class"],"mt5_time_msc":getattr(tick,"time_msc",None)}})
    return quotes

def collect_candles(markets: list[dict[str, Any]], symbol_map: dict[str, str], bars: int) -> list[dict[str, Any]]:
    candles: list[dict[str, Any]] = []
    timeframes = (
        ("1m", mt5.TIMEFRAME_M1),
        ("5m", mt5.TIMEFRAME_M5),
        ("15m", mt5.TIMEFRAME_M15),
        ("1h", mt5.TIMEFRAME_H1),
        ("4h", mt5.TIMEFRAME_H4),
        ("1d", mt5.TIMEFRAME_D1),
    )
    for timeframe_name, timeframe in timeframes:
        count = bars if timeframe_name in {"1m", "5m", "15m"} else min(bars, 100)
        for market in markets:
            symbol = resolve_mt5_symbol(market, symbol_map)
            if not symbol:
                continue
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
                    "market_id": market["id"],
                    "symbol": symbol,
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

def push_candle_chunks(candles: list[dict[str, Any]]) -> None:
    if not candles:
        return
    total = len(candles)
    for start in range(0, total, CANDLE_CHUNK_SIZE):
        chunk = candles[start:start + CANDLE_CHUNK_SIZE]
        push_sync({
            "broker_account_id": BROKER_ACCOUNT_ID,
            "mt5_account_id": MT5_ACCOUNT_ID,
            "candles": chunk,
        }, label=f"candles {start + 1}-{min(start + len(chunk), total)}/{total}")

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

def sync_once(markets: list[dict[str, Any]], symbol_map: dict[str, str]) -> None:
    push_sync({
        "broker_account_id": BROKER_ACCOUNT_ID,
        "mt5_account_id": MT5_ACCOUNT_ID,
        "account": collect_account(),
        "quotes": collect_quotes(markets, symbol_map),
        "positions": collect_positions(),
    })

def main() -> None:
    initialize_mt5()
    try:
        markets = fetch_markets()
        symbol_map = build_mt5_symbol_map()
        print(f"MT5 symbol resolver: {len(symbol_map)} terminal symbols available")
        last_candle_sync = 0.0
        bootstrap_pending = CANDLE_BOOTSTRAP

        if bootstrap_pending:
            print(f"Candle bootstrap enabled: {CANDLE_BOOTSTRAP_BARS} bars/timeframe in chunks of {CANDLE_CHUNK_SIZE}")

        while True:
            started = time.monotonic()
            try:
                sync_once(markets, symbol_map)
                now = time.monotonic()
                if bootstrap_pending:
                    candles = collect_candles(markets, symbol_map, CANDLE_BOOTSTRAP_BARS)
                    push_candle_chunks(candles)
                    bootstrap_pending = False
                    last_candle_sync = now
                elif now - last_candle_sync >= CANDLE_SYNC_SECONDS:
                    candles = collect_candles(markets, symbol_map, CANDLE_BARS_PER_SYNC)
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
