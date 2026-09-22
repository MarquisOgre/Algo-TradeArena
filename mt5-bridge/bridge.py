import os
import sys
import time
from datetime import datetime, timezone, timedelta
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
QUOTE_BATCH_SIZE = int(os.getenv("QUOTE_BATCH_SIZE", "400"))
UNIVERSE_BATCH_SIZE = int(os.getenv("UNIVERSE_BATCH_SIZE", "300"))
ACCOUNT_SYNC_SECONDS = float(os.getenv("ACCOUNT_SYNC_SECONDS", "10"))
CANDLE_REQUEST_POLL_SECONDS = float(os.getenv("CANDLE_REQUEST_POLL_SECONDS", "2"))
CANDLE_REQUEST_LIMIT = int(os.getenv("CANDLE_REQUEST_LIMIT", "25"))
CANDLE_REQUEST_MAX_BARS = int(os.getenv("CANDLE_REQUEST_MAX_BARS", "240"))
CANDLE_CHUNK_SIZE = int(os.getenv("CANDLE_CHUNK_SIZE", "500"))
UNIVERSE_REFRESH_SECONDS = float(os.getenv("UNIVERSE_REFRESH_SECONDS", "300"))
LIVE_STATUS_REFRESH_SECONDS = float(os.getenv("LIVE_STATUS_REFRESH_SECONDS", "30"))
MT5_ROLE = os.getenv("MT5_ROLE", "paper_demo").lower()
ALLOW_LIVE = os.getenv("ALLOW_LIVE", "false").lower() == "true"
MT5_TIME_OFFSET_SECONDS = 0

REST_HEADERS = {"apikey": SUPABASE_PUBLISHABLE_KEY, "Accept": "application/json"}
GATEWAY_HEADERS = {"apikey": MT5_GATEWAY_SECRET, "Content-Type": "application/json"}

def iso_from_seconds(value: Any, offset_seconds: int | None = None) -> str | None:
    if value is None:
        return None
    try:
        seconds = float(value)
        offset = MT5_TIME_OFFSET_SECONDS if offset_seconds is None else offset_seconds
        dt = datetime.fromtimestamp(seconds - offset, tz=timezone.utc)
        return dt.isoformat()
    except (TypeError, ValueError, OSError):
        return None

def detect_mt5_time_offset_seconds(tick_time: Any) -> int:
    try:
        raw_seconds = float(tick_time)
        delta = raw_seconds - time.time()
        # MT5 broker/server timestamps can be represented as wall-clock
        # seconds. Infer only a whole-hour offset from the current tick.
        if abs(delta) >= 60:
            hours = round(delta / 3600)
            if -12 <= hours <= 12 and abs(delta - hours * 3600) <= 120:
                return int(hours * 3600)
    except (TypeError, ValueError):
        pass
    return 0


def initialize_mt5() -> None:
    kwargs: dict[str, Any] = {"login": MT5_LOGIN, "password": MT5_PASSWORD, "server": MT5_SERVER}
    if MT5_PATH: kwargs["path"] = MT5_PATH
    if not mt5.initialize(**kwargs): raise RuntimeError(f"MT5 initialize failed: {mt5.last_error()}")
    account = mt5.account_info()
    if account is None: raise RuntimeError(f"MT5 account_info failed: {mt5.last_error()}")
    environment = os.getenv("MT5_ENVIRONMENT", "demo").lower()
    if MT5_ROLE not in {"paper_demo", "live"}: raise RuntimeError("MT5_ROLE must be paper_demo or live.")
    expected_environment = "demo" if MT5_ROLE == "paper_demo" else "live"
    if environment != expected_environment: raise RuntimeError(f"MT5_ROLE={MT5_ROLE} requires MT5_ENVIRONMENT={expected_environment}.")
    if MT5_ROLE == "live" and not ALLOW_LIVE: raise RuntimeError("Live MT5 role requested but ALLOW_LIVE is not true.")
    print(f"MT5 role={MT5_ROLE} environment={environment}")
    print(f"Connected to MT5 login={account.login} server={account.server} balance={account.balance:.2f} equity={account.equity:.2f}")

def normalize_symbol(value: str) -> str:
    return "".join(ch for ch in value.upper() if ch.isalnum())


def classify_mt5_asset(info: Any) -> str | None:
    # Prefer broker-provided classification metadata, then fall back to the
    # MT5 symbol tree/description and calculation mode. No symbol names are
    # hardcoded; the connected terminal remains the source of truth.
    description = str(getattr(info, "description", "") or "").upper()
    path = str(getattr(info, "path", "") or "").upper()
    category = str(getattr(info, "category", "") or "").upper()
    sector = str(getattr(info, "sector", "") or "").upper()
    industry = str(getattr(info, "industry", "") or "").upper()
    metadata_text = " ".join((path, category, sector, industry, description))

    if any(token in metadata_text for token in (
        "CRYPTOCURRENCIES", "CRYPTO", "DIGITAL ASSETS", "CURRENCY_CRYPTO",
        "CRYPTOCURRENCY",
    )):
        return "crypto"

    if (
        "FOREX" in metadata_text
        or "CURRENCIES" in metadata_text
        or "FOREIGN EXCHANGE" in metadata_text
        or sector in {"CURRENCY", "CURRENCIES"}
    ):
        return "forex"

    if any(token in metadata_text for token in (
        "ETF", "EXCHANGE TRADED FUND", "EXCHANGE-TRADED FUND",
    )):
        return "etf"

    if any(token in metadata_text for token in (
        "INDICES", "INDEX", "INDEXES", "CFD INDEX",
        "DOW JONES", "NASDAQ", "S&P 500", "DAX", "FTSE", "NIKKEI",
    )):
        return "index"

    if any(token in metadata_text for token in (
        "METALS", "PRECIOUS METALS", "GOLD", "SILVER", "COPPER",
        "PLATINUM", "PALLADIUM",
    )):
        return "metals"

    if any(token in metadata_text for token in (
        "COMMODITIES", "ENERGY", "BRENT", "CRUDE", "OIL",
        "NATURAL GAS", "AGRICULTURAL",
    )):
        return "commodity"

    # MT5 exposes contract calculation modes. Use the broker's calculation
    # mode as a metadata fallback when the symbol tree is not descriptive.
    calc_mode = getattr(info, "trade_calc_mode", None)
    forex_modes = {
        getattr(mt5, "SYMBOL_CALC_MODE_FOREX", -1),
        getattr(mt5, "SYMBOL_CALC_MODE_FOREX_NO_LEVERAGE", -2),
    }
    exchange_stock_mode = getattr(mt5, "SYMBOL_CALC_MODE_EXCH_STOCKS", -999)

    if calc_mode in forex_modes:
        return "forex"

    if calc_mode == exchange_stock_mode:
        return "stocks"

    if any(token in metadata_text for token in (
        "STOCKS", "SHARES", "EQUITIES", "EQUITY", "SECURITIES",
    )):
        return "stocks"

    return None


def is_tradable_mt5(info: Any) -> bool:
    # MT5 trade_mode: 0 disabled, 1 long-only, 2 short-only, 3 full,
    # 4 close-only. For Alphentra's instrument catalog, close-only and
    # disabled instruments are not available for new paper orders.
    trade_mode = int(getattr(info, "trade_mode", 0) or 0)
    return trade_mode in {1, 2, 3}


# Testing universe size. This is a limit, not an instrument list.
# The actual instruments are discovered from the connected MT5 terminal.
MT5_TEST_UNIVERSE_SIZE = max(1, int(os.getenv("MT5_TEST_UNIVERSE_SIZE", "25")))


def mt5_activity_score(info: Any, tick: Any) -> tuple[float, float, float, float]:
    # Fresh, usable MT5 ticks are the primary eligibility requirement.
    # Among eligible markets, prefer the freshest quote and then broker-reported activity.
    tick_time = float(getattr(tick, "time", 0) or 0) if tick is not None else 0.0
    session_volume = float(getattr(info, "session_volume", 0) or 0)
    session_deals = float(getattr(info, "session_deals", 0) or 0)
    tick_volume = float(getattr(tick, "volume", 0) or 0) if tick is not None else 0.0
    return (tick_time, session_deals, session_volume, tick_volume)


def build_limited_market_universe(symbols: list[Any]) -> list[dict[str, Any]]:
    candidates: list[tuple[tuple[float, float, float], str, Any, str]] = []

    for info in symbols:
        broker_symbol = str(getattr(info, "name", "") or "").strip()
        if not broker_symbol or not is_tradable_mt5(info):
            continue

        asset_class = classify_mt5_asset(info)
        if asset_class is None:
            continue

        tick = mt5.symbol_info_tick(broker_symbol)
        if tick is None or float(getattr(tick, "bid", 0) or 0) <= 0 or float(getattr(tick, "ask", 0) or 0) <= 0:
            continue

        tick_time = float(getattr(tick, "time", 0) or 0)
        if tick_time <= 0 or time.time() - tick_time > max(120.0, POLL_SECONDS * 10.0):
            continue

        candidates.append((
            mt5_activity_score(info, tick),
            broker_symbol.upper(),
            info,
            asset_class,
        ))

    # Highest current-session activity first. The broker's live MT5 metadata
    # determines the ranking; no Alphentra symbol names are hardcoded.
    candidates.sort(key=lambda row: (row[0][0], row[0][1], row[0][2], row[0][3], row[1]), reverse=True)

    selected = candidates[:MT5_TEST_UNIVERSE_SIZE]
    universe: list[dict[str, Any]] = []

    for _, broker_symbol_upper, info, asset_class in selected:
        broker_symbol = str(getattr(info, "name", "") or "").strip()
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
            "quantity_precision": 8,
            "min_quantity": float(getattr(info, "volume_min", 0) or 0) or None,
            "contract_size": float(getattr(info, "trade_contract_size", 1) or 1),
            "is_tradable": True,
            "metadata": {
                "provider": "mt5",
                "canonical_symbol": broker_symbol,
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
                "category": str(getattr(info, "category", "") or "").strip(),
                "sector": str(getattr(info, "sector", "") or "").strip(),
                "industry": str(getattr(info, "industry", "") or "").strip(),
                "activity_session_volume": float(getattr(info, "session_volume", 0) or 0),
                "activity_session_deals": float(getattr(info, "session_deals", 0) or 0),
            },
        })

    by_class: dict[str, int] = {}
    for market in universe:
        by_class[market["asset_class"]] = by_class.get(market["asset_class"], 0) + 1

    print(
        f"Alphentra dynamic MT5 universe: {len(universe)}/{MT5_TEST_UNIVERSE_SIZE} selected "
        f"from {len(symbols)} terminal symbols"
    )
    if by_class:
        print("  " + " | ".join(f"{key}={value}" for key, value in sorted(by_class.items())))

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

        global MT5_TIME_OFFSET_SECONDS
        tick_time = float(getattr(tick, "time", 0) or 0)
        detected_offset = detect_mt5_time_offset_seconds(tick_time)
        if detected_offset:
            MT5_TIME_OFFSET_SECONDS = detected_offset

        # Use the bridge receipt time as the canonical live quote timestamp.
        # MT5 broker/server tick timestamps can use a different wall-clock offset
        # from UTC. The quote has just been received by ALPHENTRA, so receipt time
        # is unambiguous for freshness checks and live market display.
        normalized_tick_time = tick_time - MT5_TIME_OFFSET_SECONDS if tick_time > 0 else 0
        quote_age_seconds = max(0.0, time.time() - normalized_tick_time) if normalized_tick_time > 0 else float("inf")
        is_market_open = quote_age_seconds <= max(120.0, POLL_SECONDS * 10.0)
        received_at = datetime.now(timezone.utc).isoformat()

        quotes.append({
            "symbol": market["symbol"],
            "provider_symbol": symbol,
            "bid": float(tick.bid),
            "ask": float(tick.ask),
            "price": price,
            "change": change,
            "percent_change": change_pct,
            "previous_close": previous_close,
            "quote_time": received_at,
            "volume": session_volume,
            "is_market_open": is_market_open,
            "metadata": {
                **market["metadata"],
                "mt5_time_msc": getattr(tick, "time_msc", None),
                "mt5_tick_time": tick_time,
                "mt5_time_offset_seconds": MT5_TIME_OFFSET_SECONDS,
                "quote_received_at": received_at,
                "volume_type": "tick_volume",
                "reference": "previous_completed_d1_close",
                "synced_at": datetime.now(timezone.utc).isoformat(),
            },
        })

    return quotes


def fetch_candle_requests() -> list[dict[str, Any]]:
    params = {
        "select": "id,market_id,timeframe,requested_bars",
        "status": "eq.pending",
        "expires_at": f"gt.{datetime.now(timezone.utc).isoformat()}",
        "order": "requested_at.asc",
        "limit": str(max(1, CANDLE_REQUEST_LIMIT)),
    }
    response = requests.get(
        f"{SUPABASE_URL}/rest/v1/market_data_requests",
        headers=REST_HEADERS,
        params=params,
        timeout=10,
    )
    if not response.ok:
        raise RuntimeError(
            f"Supabase candle request query returned {response.status_code}: {response.text[:500]}"
        )
    data = response.json()
    return data if isinstance(data, list) else []


def fetch_requested_market_symbols(requests_to_process: list[dict[str, Any]]) -> dict[str, str]:
    market_ids = [
        str(row.get("market_id"))
        for row in requests_to_process
        if row.get("market_id")
    ]
    if not market_ids:
        return {}

    response = requests.get(
        f"{SUPABASE_URL}/rest/v1/markets",
        headers=REST_HEADERS,
        params={
            "select": "id,broker_symbol",
            "status": "eq.active",
            "id": f"in.({','.join(market_ids)})",
        },
        timeout=10,
    )
    if not response.ok:
        raise RuntimeError(
            f"Supabase market lookup returned {response.status_code}: {response.text[:500]}"
        )

    rows = response.json()
    return {
        str(row["id"]): str(row["broker_symbol"])
        for row in rows
        if row.get("id") and row.get("broker_symbol")
    }


def collect_requested_candles(
    requests_to_process: list[dict[str, Any]],
    market_symbols: dict[str, str],
) -> tuple[list[dict[str, Any]], list[str]]:
    timeframe_map = {
        "1m": mt5.TIMEFRAME_M1,
        "5m": mt5.TIMEFRAME_M5,
        "15m": mt5.TIMEFRAME_M15,
        "1h": mt5.TIMEFRAME_H1,
        "4h": mt5.TIMEFRAME_H4,
        "1d": mt5.TIMEFRAME_D1,
    }

    candles: list[dict[str, Any]] = []
    fulfilled_request_ids: list[str] = []

    for request in requests_to_process:
        request_id = str(request.get("id") or "")
        market_id = str(request.get("market_id") or "")
        timeframe_name = str(request.get("timeframe") or "")
        symbol = market_symbols.get(market_id)

        if not request_id or not symbol or timeframe_name not in timeframe_map:
            continue

        try:
            requested_bars = int(request.get("requested_bars") or 120)
        except (TypeError, ValueError):
            requested_bars = 120
        count = max(30, min(CANDLE_REQUEST_MAX_BARS, requested_bars))

        info = mt5.symbol_info(symbol)
        if info is None:
            print(f"Candle request skipped: {symbol} is not available in the connected MT5 terminal.")
            continue

        if not info.visible and not mt5.symbol_select(symbol, True):
            print(f"Candle request skipped: could not select MT5 symbol {symbol}.")
            continue

        rates = mt5.copy_rates_from_pos(symbol, timeframe_map[timeframe_name], 0, count)
        if rates is None:
            print(
                f"Candle request waiting: {symbol} {timeframe_name} returned no MT5 history "
                f"({mt5.last_error()})."
            )
            continue

        for rate in rates:
            candle_time = iso_from_seconds(rate["time"])
            if not candle_time:
                continue

            candles.append({
                "symbol": symbol,
                "timeframe": timeframe_name,
                "candle_time": candle_time,
                "open": float(rate["open"]),
                "high": float(rate["high"]),
                "low": float(rate["low"]),
                "close": float(rate["close"]),
                "volume": float(rate["tick_volume"]),
                "trade_count": None,
                "metadata": {
                    "source": "mt5",
                    "request_id": request_id,
                    "market_id": market_id,
                },
            })

        # A valid MT5 history response, including an empty array, means the
        # request was actually serviced by the terminal. The gateway will mark
        # it fulfilled only after the candle payload has been accepted.
        fulfilled_request_ids.append(request_id)

    return candles, fulfilled_request_ids


def push_candle_chunks(
    candles: list[dict[str, Any]],
    request_ids: list[str] | None = None,
) -> None:
    unique_request_ids = list(dict.fromkeys(request_ids or []))

    if not candles:
        if unique_request_ids:
            push_sync(
                {
                    "broker_account_id": BROKER_ACCOUNT_ID,
                    "mt5_account_id": MT5_ACCOUNT_ID,
                    "candle_request_ids": unique_request_ids,
                },
                label=f"candle requests fulfilled={len(unique_request_ids)}",
            )
        return

    total = len(candles)
    for start in range(0, total, CANDLE_CHUNK_SIZE):
        chunk = candles[start:start + CANDLE_CHUNK_SIZE]
        is_final_chunk = start + len(chunk) >= total
        push_sync(
            {
                "broker_account_id": BROKER_ACCOUNT_ID,
                "mt5_account_id": MT5_ACCOUNT_ID,
                "candles": chunk,
                "candle_request_ids": unique_request_ids if is_final_chunk else [],
            },
            label=f"candles {start + 1}-{min(start + len(chunk), total)}/{total}",
        )


def sync_candle_requests() -> None:
    requests_to_process = fetch_candle_requests()
    if not requests_to_process:
        return

    market_symbols = fetch_requested_market_symbols(requests_to_process)
    candles, fulfilled_request_ids = collect_requested_candles(
        requests_to_process,
        market_symbols,
    )

    if fulfilled_request_ids:
        print(
            f"Processing MT5 candle requests={len(fulfilled_request_ids)} "
            f"candles={len(candles)}"
        )
        push_candle_chunks(candles, fulfilled_request_ids)

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
    response = requests.post(
        MT5_GATEWAY_URL,
        headers=GATEWAY_HEADERS,
        json=payload,
        timeout=60,
    )
    if not response.ok:
        raise RuntimeError(
            f"MT5 gateway returned {response.status_code}: {response.text[:500]}"
        )
    result = response.json()
    if label == "sync":
        print(
            f"Synced quotes={result.get('quotes_updated', 0)} "
            f"positions={result.get('positions_updated', 0)}"
        )
    else:
        print(f"Synced {label}")


def push_quote_batches(
    quotes: list[dict[str, Any]],
    account: dict[str, Any] | None = None,
    positions: list[dict[str, Any]] | None = None,
) -> None:
    if not quotes and account is None and positions is None:
        return

    total = len(quotes)
    batch_size = max(1, QUOTE_BATCH_SIZE)

    if total == 0:
        push_sync({
            "broker_account_id": BROKER_ACCOUNT_ID,
            "mt5_account_id": MT5_ACCOUNT_ID,
            "account": account,
            "positions": positions or [],
        })
        return

    for start in range(0, total, batch_size):
        chunk = quotes[start:start + batch_size]
        payload: dict[str, Any] = {
            "broker_account_id": BROKER_ACCOUNT_ID,
            "mt5_account_id": MT5_ACCOUNT_ID,
            "quotes": chunk,
        }
        if start == 0:
            payload["account"] = account
            payload["positions"] = positions or []

        push_sync(
            payload,
            label=f"quotes {start + 1}-{min(start + len(chunk), total)}/{total}",
        )

def push_market_universe_batches(
    universe: list[dict[str, Any]],
) -> None:
    batch_size = max(1, UNIVERSE_BATCH_SIZE)
    total = len(universe)

    for start in range(0, total, batch_size):
        chunk = universe[start:start + batch_size]
        push_sync(
            {
                "broker_account_id": BROKER_ACCOUNT_ID,
                "mt5_account_id": MT5_ACCOUNT_ID,
                "market_universe": chunk,
            },
            label=f"universe {start + 1}-{min(start + len(chunk), total)}/{total}",
        )


def push_market_status_batches(
    market_statuses: list[dict[str, Any]],
) -> None:
    batch_size = max(1, UNIVERSE_BATCH_SIZE)
    total = len(market_statuses)

    for start in range(0, total, batch_size):
        chunk = market_statuses[start:start + batch_size]
        push_sync(
            {
                "broker_account_id": BROKER_ACCOUNT_ID,
                "mt5_account_id": MT5_ACCOUNT_ID,
                "market_statuses": chunk,
                "broker_market_mappings": chunk,
            },
            label=f"market status {start + 1}-{min(start + len(chunk), total)}/{total}",
        )


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
        print(f"MT5 terminal: {len(symbols)} terminal symbols available")

        universe = build_limited_market_universe(symbols)
        print(f"Dynamic MT5 universe: {len(universe)} qualified instruments")

        by_class: dict[str, int] = {}
        for market in universe:
            by_class[market["asset_class"]] = by_class.get(market["asset_class"], 0) + 1
        print("  " + " | ".join(f"{key}={value}" for key, value in sorted(by_class.items())))

        last_universe_refresh = 0.0
        last_status_refresh = 0.0
        last_account_sync = 0.0
        last_candle_request_poll = 0.0
        last_quote_times: dict[str, int] = {}

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
                    universe = build_limited_market_universe(list(mt5.symbols_get() or []))
                    push_market_universe_batches(universe)

                    market_statuses = collect_market_statuses(universe)
                    push_market_status_batches(market_statuses)

                    push_sync(
                        {
                            "broker_account_id": BROKER_ACCOUNT_ID,
                            "mt5_account_id": MT5_ACCOUNT_ID,
                            "account": collect_account(),
                        },
                        label="MT5 account state",
                    )

                    last_universe_refresh = now
                    last_status_refresh = now
                    print(f"MT5 universe synced: {len(universe)} instruments")

                elif refresh_status:
                    market_statuses = collect_market_statuses(universe)
                    push_market_status_batches(market_statuses)
                    last_status_refresh = now

                quotes = collect_quotes(universe)

                # Only write MT5 quotes whose terminal tick timestamp changed.
                # Closed instruments therefore stop generating redundant
                # database writes while actively moving instruments remain live.
                changed_quotes: list[dict[str, Any]] = []
                for quote in quotes:
                    provider_symbol = str(quote.get("provider_symbol") or quote["symbol"])
                    tick_msc = quote.get("metadata", {}).get("mt5_time_msc")
                    try:
                        tick_key = int(tick_msc or 0)
                    except (TypeError, ValueError):
                        tick_key = 0

                    if tick_key <= 0 or last_quote_times.get(provider_symbol) != tick_key:
                        changed_quotes.append(quote)
                        if tick_key > 0:
                            last_quote_times[provider_symbol] = tick_key

                should_sync_account = now - last_account_sync >= ACCOUNT_SYNC_SECONDS
                account = collect_account() if should_sync_account else None
                positions = collect_positions() if should_sync_account else None

                if changed_quotes or should_sync_account:
                    push_quote_batches(changed_quotes, account, positions)
                    if should_sync_account:
                        last_account_sync = now

                if now - last_candle_request_poll >= CANDLE_REQUEST_POLL_SECONDS:
                    sync_candle_requests()
                    last_candle_request_poll = now

            except Exception as exc:
                print(f"Sync error: {exc}", file=sys.stderr)

            time.sleep(max(0.25, POLL_SECONDS - (time.monotonic() - started)))

    except KeyboardInterrupt:
        print("Stopping MT5 bridge.")
    finally:
        mt5.shutdown()

if __name__ == "__main__":
    main()
