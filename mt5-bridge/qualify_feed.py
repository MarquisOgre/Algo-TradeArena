import os
import sys
from typing import Any

import MetaTrader5 as mt5
from dotenv import load_dotenv

load_dotenv()

MT5_LOGIN = int(os.environ["MT5_LOGIN"])
MT5_PASSWORD = os.environ["MT5_PASSWORD"]
MT5_SERVER = os.environ["MT5_SERVER"]
MT5_PATH = os.getenv("MT5_PATH", "")

TARGETS = {
    "Forex": 30,
    "Metals/Commodities": 15,
    "Stocks/ETFs": 40,
    "Crypto": 15,
}


def initialize_mt5() -> None:
    kwargs: dict[str, Any] = {
        "login": MT5_LOGIN,
        "password": MT5_PASSWORD,
        "server": MT5_SERVER,
    }
    if MT5_PATH:
        kwargs["path"] = MT5_PATH

    if not mt5.initialize(**kwargs):
        raise RuntimeError(f"MT5 initialize failed: {mt5.last_error()}")

    account = mt5.account_info()
    if account is None:
        raise RuntimeError(f"MT5 account_info failed: {mt5.last_error()}")

    print(
        f"Connected to MT5 login={account.login} "
        f"server={account.server} "
        f"balance={account.balance:.2f} equity={account.equity:.2f}"
    )


def text(info: Any, field: str) -> str:
    return str(getattr(info, field, "") or "").strip()


def normalize(value: str) -> str:
    return "".join(ch for ch in value.upper() if ch.isalnum())


def classify(info: Any) -> str | None:
    name = text(info, "name").upper()
    description = text(info, "description").upper()
    path = text(info, "path").upper()
    haystack = f"{name} {description} {path}"

    # Crypto must be identified by the broker's instrument classification,
    # not merely by a symbol containing BTC/ETH. This prevents crypto ETFs
    # and unrelated securities from being counted as crypto.
    crypto_markers = (
        "CRYPTOCURRENCIES",
        "CRYPTO",
        "DIGITAL ASSETS",
        "\\CRYPTO",
        "\\DIGITAL",
    )
    if any(marker in path or marker in description for marker in crypto_markers):
        if any(
            marker in haystack
            for marker in (
                "BITCOIN",
                "ETHEREUM",
                "LITECOIN",
                "RIPPLE",
                "CARDANO",
                "SOLANA",
                "DOGECOIN",
                "POLKADOT",
                "AVALANCHE",
                "CHAINLINK",
                "POLYGON",
                "CRYPTO",
            )
        ):
            return "Crypto"

    # Forex/currency instruments.
    if "FOREX" in path or "CURRENCIES" in path or "FX" in path.split("\\")[0:1]:
        return "Forex"

    # Metals and commodity CFDs. We intentionally keep indices separate
    # because Alphentra's current qualification target is commodities/metals.
    commodity_markers = (
        "COMMODITIES",
        "METALS",
        "ENERGY",
        "PRECIOUS METALS",
        "\\GOLD",
        "\\SILVER",
        "\\OIL",
        "\\NATURAL GAS",
    )
    if any(marker in haystack for marker in commodity_markers):
        return "Metals/Commodities"

    # Shares/equities/ETFs.
    stock_markers = (
        "STOCKS",
        "STOCK",
        "SHARES",
        "EQUITIES",
        "EQUITY",
        "ETFS",
        "ETF",
    )
    if any(marker in haystack for marker in stock_markers):
        return "Stocks/ETFs"

    return None


def is_live(info: Any) -> bool:
    tick = mt5.symbol_info_tick(text(info, "name"))
    return tick is not None and float(getattr(tick, "bid", 0) or 0) > 0 and float(
        getattr(tick, "ask", 0) or 0
    ) > 0


def print_examples(rows: list[tuple[Any, bool]], limit: int = 25) -> None:
    for info, live in rows[:limit]:
        name = text(info, "name")
        description = text(info, "description")
        path = text(info, "path")
        tick = mt5.symbol_info_tick(name)
        bid = float(getattr(tick, "bid", 0) or 0) if tick else 0
        ask = float(getattr(tick, "ask", 0) or 0) if tick else 0
        print(
            f"  {name:<18} "
            f"{'LIVE' if live else 'NO QUOTE':<8} "
            f"bid={bid:<14g} ask={ask:<14g} "
            f"| {description} | {path}"
        )


def main() -> None:
    initialize_mt5()
    try:
        symbols = list(mt5.symbols_get() or [])
        print(f"MT5 terminal symbols available: {len(symbols)}")

        buckets: dict[str, list[tuple[Any, bool]]] = {
            key: [] for key in TARGETS
        }

        for info in symbols:
            if not text(info, "name"):
                continue

            category = classify(info)
            if category is None:
                continue

            live = is_live(info)
            buckets[category].append((info, live))

        print()
        print("=" * 78)
        print("ALPHENTRA MT5 FEED QUALIFICATION")
        print("=" * 78)

        total_valid = 0
        total_live = 0

        for category, target in TARGETS.items():
            rows = buckets[category]
            live_count = sum(1 for _, live in rows if live)
            total_valid += len(rows)
            total_live += live_count

            print(
                f"{category:<20} "
                f"VALID={len(rows):>4}  "
                f"LIVE={live_count:>4}  "
                f"TARGET={target:>3}"
            )

        print("-" * 78)
        print(
            f"{'TOTAL':<20} VALID={total_valid:>4}  "
            f"LIVE={total_live:>4}  TARGET=100"
        )
        print("=" * 78)

        print()
        print("CRITICAL CRYPTO CHECK")
        print("-" * 78)

        for requested in ("BTCUSD", "ETHUSD"):
            matches = []
            requested_norm = normalize(requested)

            for info in symbols:
                name = normalize(text(info, "name"))
                description = text(info, "description").upper()
                path = text(info, "path").upper()

                if requested_norm in name or requested_norm in description:
                    if "CRYPTO" in path or "CRYPTO" in description or (
                        "BITCOIN" in description and requested == "BTCUSD"
                    ) or (
                        "ETHEREUM" in description and requested == "ETHUSD"
                    ):
                        matches.append(info)

            if not matches:
                print(f"{requested}: NOT FOUND")
                continue

            for info in matches[:5]:
                live = is_live(info)
                print(
                    f"{requested} -> {text(info, 'name')} | "
                    f"{text(info, 'currency_base')}/{text(info, 'currency_profit')} | "
                    f"{text(info, 'description')} | "
                    f"path={text(info, 'path')} | "
                    f"{'LIVE' if live else 'NO QUOTE'}"
                )

        print()
        print("SAMPLE INSTRUMENTS BY SEGMENT")
        print("-" * 78)

        for category in TARGETS:
            print()
            print(f"[{category}]")
            print_examples(buckets[category])

        print()
        print("NOTE: This scanner is read-only. It does not send orders or push data to Supabase.")
    finally:
        mt5.shutdown()


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("Stopped.")
    except Exception as exc:
        print(f"Qualification error: {exc}", file=sys.stderr)
        sys.exit(1)
