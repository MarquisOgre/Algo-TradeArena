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

def normalize_symbol(value: str) -> str:
    return "".join(ch for ch in value.upper() if ch.isalnum())


def expected_currencies(market: dict[str, Any]) -> tuple[str | None, str | None]:
    symbol = normalize_symbol(str(market.get("symbol") or ""))
    asset_class = str(market.get("asset_class") or "").lower()

    # FX pairs, crypto/USD pairs and metals such as XAUUSD encode their
    # intended base/profit currencies in the Alphentra symbol.
    if len(symbol) == 6 and asset_class in {"forex", "crypto", "commodity"}:
        return symbol[:3], symbol[3:]

    return None, None


def symbol_matches_market(market: dict[str, Any], info: Any) -> bool:
    expected_base, expected_profit = expected_currencies(market)
    if expected_base is None or expected_profit is None:
        return True

    base = str(getattr(info, "currency_base", "") or "").upper()
    profit = str(getattr(info, "currency_profit", "") or "").upper()

    if base != expected_base or profit != expected_profit:
        return False

    asset_class = str(market.get("asset_class") or "").lower()
    description = str(getattr(info, "description", "") or "").upper()
    path = str(getattr(info, "path", "") or "").upper()

    # Crypto markets must be genuine crypto instruments. This prevents
    # accidental matches to securities/ETFs whose names contain BTC or ETH.
    if asset_class == "crypto":
        crypto_markers = (
            "CRYPTO",
            "DIGITAL",
            "BITCOIN",
            "ETHEREUM",
            "\\CRYPTO",
            "\\DIGITAL",
        )
        if not any(marker in description or marker in path for marker in crypto_markers):
            return False

    return True


def symbol_metadata(info: Any) -> dict[str, Any]:
    return {
        "broker_symbol": str(getattr(info, "name", "") or ""),
        "description": str(getattr(info, "description", "") or ""),
        "path": str(getattr(info, "path", "") or ""),
        "exchange": str(getattr(info, "exchange", "") or ""),
        "currency_base": str(getattr(info, "currency_base", "") or ""),
        "currency_profit": str(getattr(info, "currency_profit", "") or ""),
        "currency_margin": str(getattr(info, "currency_margin", "") or ""),
        "digits": int(getattr(info, "digits", 0) or 0),
        "point": float(getattr(info, "point", 0.0) or 0.0),
        "trade_tick_size": float(getattr(info, "trade_tick_size", 0.0) or 0.0),
        "trade_tick_value": float(getattr(info, "trade_tick_value", 0.0) or 0.0),
        "trade_contract_size": float(getattr(info, "trade_contract_size", 0.0) or 0.0),
        "volume_min": float(getattr(info, "volume_min", 0.0) or 0.0),
        "volume_max": float(getattr(info, "volume_max", 0.0) or 0.0),
        "volume_step": float(getattr(info, "volume_step", 0.0) or 0.0),
        "trade_mode": int(getattr(info, "trade_mode", 0) or 0),
        "trade_calc_mode": int(getattr(info, "trade_calc_mode", 0) or 0),
    }


def build_market_symbol_map(
    markets: list[dict[str, Any]],
    symbol_map: dict[str, str],
) -> dict[str, dict[str, Any]]:
    aliases = {
        "BTCUSD": ["BTC", "BTCUSD"],
        "ETHUSD": ["ETH", "ETHUSD"],
        "XAUUSD": ["XAUUSD", "GOLD"],
    }
    resolved: dict[str, dict[str, Any]] = {}

    for market in markets:
        requested = str(market.get("broker_symbol") or market["symbol"]).strip()
        ui_symbol = str(market["symbol"]).strip()
        candidates = [requested, ui_symbol, *aliases.get(ui_symbol.upper(), [])]

        selected: str | None = None
        selected_info: Any | None = None

        # First prefer explicit broker symbols, but validate the instrument
        # specification before accepting them.
        for candidate in candidates:
            actual = symbol_map.get(candidate.upper())
            if not actual:
                continue
            info = mt5.symbol_info(actual)
            if info is None:
                continue
            if not info.visible:
                mt5.symbol_select(actual, True)
                info = mt5.symbol_info(actual)
            if info is not None and symbol_matches_market(market, info):
                selected = actual
                selected_info = info
                break

        # If the exact name is not present, search the terminal universe by
        # the instrument's base/profit currencies and description/name.
        if selected is None:
            expected_base, expected_profit = expected_currencies(market)
            normalized_requested = normalize_symbol(requested)
            normalized_ui = normalize_symbol(ui_symbol)

            ranked: list[tuple[int, str, Any]] = []
            for actual in symbol_map.values():
                info = mt5.symbol_info(actual)
                if info is None:
                    continue
                if not symbol_matches_market(market, info):
                    continue

                name = normalize_symbol(str(getattr(info, "name", "") or ""))
                description = str(getattr(info, "description", "") or "").upper()
                score = 0

                if name == normalized_requested or name == normalized_ui:
                    score += 100
                if expected_base and str(getattr(info, "currency_base", "") or "").upper() == expected_base:
                    score += 40
                if expected_profit and str(getattr(info, "currency_profit", "") or "").upper() == expected_profit:
                    score += 40
                if expected_base and expected_profit and f"{expected_base} VS {expected_profit}" in description:
                    score += 25
                if expected_base and expected_profit and f"{expected_base}/{expected_profit}" in description:
                    score += 25
                if ui_symbol.upper() in str(getattr(info, "path", "") or "").upper():
                    score += 10

                if score > 0:
                    ranked.append((score, actual, info))

            if ranked:
                ranked.sort(key=lambda item: (-item[0], item[1]))
                _, selected, selected_info = ranked[0]

        if selected and selected_info is not None:
            metadata = symbol_metadata(selected_info)
            metadata["mapping_status"] = "validated"
            metadata["alphentra_symbol"] = ui_symbol
            resolved[market["id"]] = {
                "symbol": selected,
                "metadata": metadata,
            }

    return resolved


def print_unresolved_candidates(markets: list[dict[str, Any]], symbol_map: dict[str, str]) -> None:
    """Print likely MT5 candidates for markets that could not be validated."""
    for market in markets:
        ui_symbol = str(market["symbol"]).strip()
        if ui_symbol in {str(v.get("alphentra_symbol", "")) for v in []}:
            continue

        expected_base, expected_profit = expected_currencies(market)
        if not expected_base and not expected_profit:
            continue

        tokens = {expected_base or "", expected_profit or "", ui_symbol.upper()}
        tokens.discard("")
        candidates: list[tuple[int, str, Any]] = []

        for actual in symbol_map.values():
            info = mt5.symbol_info(actual)
            if info is None:
                continue

            name = str(getattr(info, "name", "") or "")
            description = str(getattr(info, "description", "") or "")
            path = str(getattr(info, "path", "") or "")
            haystack = f"{name} {description} {path}".upper()
            score = 0

            if ui_symbol.upper() in name.upper():
                score += 100
            if expected_base and expected_base in haystack:
                score += 25
            if expected_profit and expected_profit in haystack:
                score += 25
            if "CRYPTO" in haystack or "DIGITAL" in haystack:
                score += 10

            if score > 0:
                candidates.append((score, name, info))

        candidates.sort(key=lambda item: (-item[0], item[1]))

        print(f"  {ui_symbol} candidates:")
        for _, name, info in candidates[:8]:
            metadata = symbol_metadata(info)
            print(
                f"    {name} | {metadata['currency_base']}/{metadata['currency_profit']} | "
                f"{metadata['description']} | path={metadata['path']} | "
                f"contract={metadata['trade_contract_size']} | "
                f"bid={getattr(info, 'bid', 0)} ask={getattr(info, 'ask', 0)}"
            )


def resolve_mt5_symbol(
    market: dict[str, Any],
    market_symbol_map: dict[str, dict[str, Any]],
) -> str | None:
    mapping = market_symbol_map.get(market["id"])
    return mapping["symbol"] if mapping else None

def collect_market_statuses(
    markets: list[dict[str, Any]],
    market_symbol_map: dict[str, dict[str, Any]],
) -> list[dict[str, Any]]:
    statuses: list[dict[str, Any]] = []

    for market in markets:
        mapping = market_symbol_map.get(market["id"])

        if not mapping:
            statuses.append({
                "market_id": market["id"],
                "symbol": market["symbol"],
                "status": "unsupported",
                "provider_symbol": None,
                "checked_at": datetime.now(timezone.utc).isoformat(),
                "metadata": {
                    "asset_class": market.get("asset_class"),
                    "reason": "No MT5 instrument matched the Alphentra market specification.",
                },
            })
            continue

        symbol = mapping["symbol"]
        info = mt5.symbol_info(symbol)
        if info is None:
            statuses.append({
                "market_id": market["id"],
                "symbol": market["symbol"],
                "status": "no_quote",
                "provider_symbol": symbol,
                "checked_at": datetime.now(timezone.utc).isoformat(),
                "metadata": {
                    **mapping["metadata"],
                    "asset_class": market.get("asset_class"),
                    "reason": "MT5 instrument exists but symbol_info is unavailable.",
                },
            })
            continue

        if not info.visible:
            mt5.symbol_select(symbol, True)
            info = mt5.symbol_info(symbol) or info

        tick = mt5.symbol_info_tick(symbol)
        has_quote = tick is not None and tick.bid > 0 and tick.ask > 0

        statuses.append({
            "market_id": market["id"],
            "symbol": market["symbol"],
            "status": "live" if has_quote else "no_quote",
            "provider_symbol": symbol,
            "checked_at": datetime.now(timezone.utc).isoformat(),
            "metadata": {
                **mapping["metadata"],
                "asset_class": market.get("asset_class"),
                "bid": float(tick.bid) if tick and tick.bid > 0 else None,
                "ask": float(tick.ask) if tick and tick.ask > 0 else None,
                "reason": "Usable bid/ask received." if has_quote else "Instrument is valid but MT5 returned no usable bid/ask.",
            },
        })

    return statuses


def collect_quotes(
    markets: list[dict[str, Any]],
    market_symbol_map: dict[str, dict[str, Any]],
) -> list[dict[str, Any]]:
    quotes = []
    for market in markets:
        mapping = market_symbol_map.get(market["id"])
        if not mapping:
            continue

        symbol = mapping["symbol"]
        info = mt5.symbol_info(symbol)
        if info is None:
            continue
        if not info.visible and not mt5.symbol_select(symbol, True):
            continue

        tick = mt5.symbol_info_tick(symbol)
        if tick is None or tick.bid <= 0 or tick.ask <= 0:
            continue

        quotes.append({
            "market_id": market["id"],
            "symbol": symbol,
            "bid": float(tick.bid),
            "ask": float(tick.ask),
            "price": float((tick.bid + tick.ask) / 2),
            "quote_time": iso_from_seconds(getattr(tick, "time", None)),
            "volume": None,
            "is_market_open": True,
            "metadata": {
                "asset_class": market["asset_class"],
                "mt5_time_msc": getattr(tick, "time_msc", None),
                **mapping["metadata"],
                "synced_at": datetime.now(timezone.utc).isoformat(),
            },
        })
    return quotes

def collect_candles(
    markets: list[dict[str, Any]],
    market_symbol_map: dict[str, dict[str, Any]],
    bars: int,
) -> list[dict[str, Any]]:
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
            mapping = market_symbol_map.get(market["id"])
            if not mapping:
                continue
            symbol = mapping["symbol"]
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

def sync_once(
    markets: list[dict[str, Any]],
    market_symbol_map: dict[str, dict[str, Any]],
) -> None:
    push_sync({
        "broker_account_id": BROKER_ACCOUNT_ID,
        "mt5_account_id": MT5_ACCOUNT_ID,
        "market_statuses": collect_market_statuses(markets, market_symbol_map),
        "broker_market_mappings": collect_market_statuses(markets, market_symbol_map),
        "account": collect_account(),
        "quotes": collect_quotes(markets, market_symbol_map),
        "positions": collect_positions(),
    })

def main() -> None:
    initialize_mt5()
    try:
        markets = fetch_markets()
        symbol_map = build_mt5_symbol_map()
        print(f"MT5 symbol resolver: {len(symbol_map)} terminal symbols available")

        market_symbol_map = build_market_symbol_map(markets, symbol_map)
        print(f"Validated market mappings: {len(market_symbol_map)}/{len(markets)}")

        for market in markets:
            mapping = market_symbol_map.get(market["id"])
            if mapping:
                metadata = mapping["metadata"]
                print(
                    f"  {market['symbol']} -> {mapping['symbol']} | "
                    f"{metadata['currency_base']}/{metadata['currency_profit']} | "
                    f"{metadata['description']} | "
                    f"contract={metadata['trade_contract_size']} | "
                    f"digits={metadata['digits']}"
                )
            else:
                print(f"  {market['symbol']} -> NO VALID MT5 INSTRUMENT")
        print_unresolved_candidates(markets, symbol_map)
        last_candle_sync = 0.0
        bootstrap_pending = CANDLE_BOOTSTRAP

        if bootstrap_pending:
            print(f"Candle bootstrap enabled: {CANDLE_BOOTSTRAP_BARS} bars/timeframe in chunks of {CANDLE_CHUNK_SIZE}")

        while True:
            started = time.monotonic()
            try:
                sync_once(markets, market_symbol_map)
                now = time.monotonic()
                if bootstrap_pending:
                    candles = collect_candles(markets, market_symbol_map, CANDLE_BOOTSTRAP_BARS)
                    push_candle_chunks(candles)
                    bootstrap_pending = False
                    last_candle_sync = now
                elif now - last_candle_sync >= CANDLE_SYNC_SECONDS:
                    candles = collect_candles(markets, market_symbol_map, CANDLE_BARS_PER_SYNC)
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
