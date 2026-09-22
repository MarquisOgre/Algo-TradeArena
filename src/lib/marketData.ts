import { mockMarkets } from "@/data/mockMarkets";
import type { Market } from "@/data/types";
import { supabase } from "@/lib/supabase";

export type LiveMarketQuote = {
  marketId: string;
  symbol: string;
  price: number;
  change: number;
  changePct: number;
  previousClose: number | null;
  volume: number | null;
  quoteTime: string;
  isMarketOpen: boolean | null;
  provider: string;
  bid: number | null;
  ask: number | null;
  spread: number | null;
  metadata: Record<string, unknown>;
};

type MarketRow = {
  id: string;
  symbol: string;
  name: string;
  asset_class: string;
  exchange: string | null;
};

export type MarketProviderStatus = "live" | "no_quote" | "unsupported";

export type MarketStatus = {
  marketId: string;
  symbol: string;
  status: MarketProviderStatus;
  provider: string;
  providerSymbol: string | null;
  checkedAt: string;
};

type StatusRow = {
  market_id: string;
  provider: string;
  status: MarketProviderStatus;
  provider_symbol: string | null;
  checked_at: string;
};

type QuoteRow = {
  market_id: string;
  provider: string;
  quote_time: string;
  price: number | string;
  change: number | string | null;
  percent_change: number | string | null;
  previous_close: number | string | null;
  volume: number | string | null;
  is_market_open: boolean | null;
  bid: number | string | null;
  ask: number | string | null;
  spread: number | string | null;
  metadata: Record<string, unknown> | null;
};

function numberOrNull(value: number | string | null | undefined) {
  if (value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function assetClassLabel(value: string): Market["assetClass"] {
  switch (value) {
    case "stocks":
    case "etf":
    case "index":
      return "Equity";
    case "forex":
      return "FX";
    case "crypto":
      return "Crypto";
    case "commodity":
      return "Metals";
    default:
      return "Commodity";
  }
}

type MarketSegment = "Crypto" | "FX" | "Metals" | "Equity";

const MARKET_SEGMENT_LIMITS: Record<MarketSegment, number> = {
  Crypto: 7,
  FX: 6,
  Metals: 6,
  Equity: 6,
};

function selectMarketUniverse(markets: Market[]): Market[] {
  const selected: Market[] = [];

  // The public market board is a live-data surface. Never fill the 25 slots
  // with instruments that only have a mapping/status record but no fresh MT5
  // quote. If fewer than 25 live instruments are available, show only the
  // verified live instruments rather than presenting "No quote" rows as part
  // of the primary universe.
  const liveMarkets = markets.filter((market) => market.providerStatus === "live");

  for (const segment of Object.keys(MARKET_SEGMENT_LIMITS) as MarketSegment[]) {
    const limit = MARKET_SEGMENT_LIMITS[segment];
    selected.push(
      ...liveMarkets
        .filter((market) => market.assetClass === segment)
        .sort((a, b) => a.symbol.localeCompare(b.symbol))
        .slice(0, limit),
    );
  }

  return selected.slice(0, 25);
}

function formatVolume(value: number | null) {
  if (value === null) return "—";
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

async function loadAllActiveMarkets(tradableOnly = false): Promise<MarketRow[]> {
  const rows: MarketRow[] = [];
  const pageSize = 1000;
  let from = 0;

  while (true) {
    let query = supabase
      .from("markets")
      .select("id, symbol, name, asset_class, exchange")
      .eq("status", "active")
      .order("symbol")
      .range(from, from + pageSize - 1);

    if (tradableOnly) {
      query = query.eq("is_tradable", true);
    }

    const { data, error } = await query;
    if (error) throw error;

    const page = (data ?? []) as MarketRow[];
    rows.push(...page);

    if (page.length < pageSize) break;
    from += pageSize;
  }

  return rows;
}

async function loadAllMt5Quotes(): Promise<QuoteRow[]> {
  const rows: QuoteRow[] = [];
  const pageSize = 1000;
  let from = 0;

  while (true) {
    const { data, error } = await supabase
      .from("market_quotes")
      .select(
        "market_id, provider, quote_time, price, change, percent_change, previous_close, volume, is_market_open, bid, ask, spread, metadata",
      )
      .eq("provider", "mt5")
      .order("quote_time", { ascending: false })
      .range(from, from + pageSize - 1);

    if (error) throw error;

    const page = (data ?? []) as QuoteRow[];
    rows.push(...page);

    if (page.length < pageSize) break;
    from += pageSize;
  }

  return rows;
}

export async function loadLiveMarketQuotes(): Promise<Map<string, LiveMarketQuote>> {
  const [markets, quotes] = await Promise.all([
    loadAllActiveMarkets(),
    loadAllMt5Quotes(),
  ]);

  const marketById = new Map(
    markets.map((market) => [market.id, market]),
  );
  const latestByMarket = new Map<string, LiveMarketQuote>();

  for (const quote of quotes) {
    if (latestByMarket.has(quote.market_id)) continue;

    const market = marketById.get(quote.market_id);
    const price = numberOrNull(quote.price);
    if (!market || price === null || price <= 0) continue;

    latestByMarket.set(quote.market_id, {
      marketId: market.id,
      symbol: market.symbol,
      price,
      change: numberOrNull(quote.change) ?? 0,
      changePct: numberOrNull(quote.percent_change) ?? 0,
      previousClose: numberOrNull(quote.previous_close),
      volume: numberOrNull(quote.volume),
      quoteTime: quote.quote_time,
      isMarketOpen: quote.is_market_open,
      provider: quote.provider,
      bid: numberOrNull(quote.bid),
      ask: numberOrNull(quote.ask),
      spread: numberOrNull(quote.spread),
      metadata: quote.metadata ?? {},
    });
  }

  return latestByMarket;
}

export async function loadBrokerMarketMappings(): Promise<Map<string, MarketStatus>> {
  const { data: broker, error: brokerError } = await supabase
    .from("broker_accounts")
    .select("id")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (brokerError) throw brokerError;
  if (!broker) return new Map();

  const { data, error } = await supabase
    .from("broker_market_mappings")
    .select("market_id, provider, status, provider_symbol, last_verified_at")
    .eq("broker_account_id", broker.id)
    .eq("provider", "mt5")
    .order("last_verified_at", { ascending: false });

  if (error) throw error;

  const latestByMarket = new Map<string, MarketStatus>();
  for (const row of data ?? []) {
    if (latestByMarket.has(row.market_id)) continue;
    latestByMarket.set(row.market_id, {
      marketId: row.market_id,
      symbol: "",
      status: row.status as MarketProviderStatus,
      provider: row.provider,
      providerSymbol: row.provider_symbol,
      checkedAt: row.last_verified_at,
    });
  }

  return latestByMarket;
}

export async function loadMarketStatuses(): Promise<Map<string, MarketStatus>> {
  const { data, error } = await supabase
    .from("market_provider_status")
    .select("market_id, provider, status, provider_symbol, checked_at")
    .eq("provider", "mt5")
    .order("checked_at", { ascending: false });

  if (error) throw error;

  const latestByMarket = new Map<string, MarketStatus>();
  for (const row of (data ?? []) as StatusRow[]) {
    if (latestByMarket.has(row.market_id)) continue;
    latestByMarket.set(row.market_id, {
      marketId: row.market_id,
      symbol: "",
      status: row.status,
      provider: row.provider,
      providerSymbol: row.provider_symbol,
      checkedAt: row.checked_at,
    });
  }
  return latestByMarket;
}

export async function loadMarketBoard(): Promise<Market[]> {
  const [liveQuotes, statuses] = await Promise.all([
    loadLiveMarketQuotes(),
    loadMarketStatuses(),
  ]);
  const marketRows = await loadAllActiveMarkets(true);

  const mockBySymbol = new Map(mockMarkets.map((market) => [market.symbol.toUpperCase(), market]));
  const bySymbol = new Map(
    [...liveQuotes.values()].map((quote) => [quote.symbol.toUpperCase(), quote]),
  );

  const boardMarkets = ((marketRows ?? []) as MarketRow[]).map((row) => {
    const live = bySymbol.get(row.symbol.toUpperCase());
    const status = statuses.get(row.id);
    const fallback = mockBySymbol.get(row.symbol.toUpperCase());
    const liveQuoteFresh = isQuoteFresh(live);
    const providerStatus: MarketProviderStatus =
      liveQuoteFresh
        ? "live"
        : status?.status ?? (live ? "no_quote" : "unsupported");
    const price = providerStatus === "live" && live ? live.price : 0;

    return {
      id: row.id,
      symbol: row.symbol,
      name: row.name,
      assetClass: assetClassLabel(row.asset_class),
      price,
      change: providerStatus === "live" ? live?.change ?? 0 : 0,
      changePct: providerStatus === "live" ? live?.changePct ?? 0 : 0,
      volume: providerStatus === "live" ? formatVolume(live?.volume ?? null) : "—",
      bid: providerStatus === "live" ? live?.bid ?? null : null,
      ask: providerStatus === "live" ? live?.ask ?? null : null,
      spread: providerStatus === "live" ? live?.spread ?? null : null,
      isMarketOpen: providerStatus === "live" ? live?.isMarketOpen ?? null : false,
      marketCap: fallback?.marketCap ?? "—",
      spark: providerStatus === "live" ? fallback?.spark ?? Array.from({ length: 30 }, () => price) : Array.from({ length: 30 }, () => 0),
      aiSignal: fallback?.aiSignal ?? "Neutral",
      aiConfidence: fallback?.aiConfidence ?? 50,
      providerStatus,
      providerSymbol:
        status?.providerSymbol ??
        (typeof live?.metadata?.broker_symbol === "string"
          ? live.metadata.broker_symbol
          : null),
    };
  });

  return selectMarketUniverse(boardMarkets);
}

export type MarketCandle = {
  candle_time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number | null;
};

export async function requestMarketHistory(
  marketId: string,
  timeframe: "1m" | "5m" | "15m" | "1h" | "4h" | "1d",
  requestedBars = 120,
) {
  const now = Date.now();
  const bars = Math.max(30, Math.min(240, Math.trunc(requestedBars)));

  const { error } = await supabase
    .from("market_data_requests")
    .upsert(
      {
        market_id: marketId,
        timeframe,
        requested_bars: bars,
        status: "pending",
        requested_at: new Date(now).toISOString(),
        expires_at: new Date(now + 2 * 60_000).toISOString(),
        last_synced_at: null,
      },
      { onConflict: "market_id,timeframe" },
    );

  if (error) throw error;
}

export async function loadMarketHistory(marketId: string, timeframe = "1m", limit = 120): Promise<MarketCandle[]> {
  const { data, error } = await supabase
    .from("market_data")
    .select("candle_time, open, high, low, close, volume")
    .eq("market_id", marketId)
    .eq("timeframe", timeframe)
    .eq("source", "mt5")
    .order("candle_time", { ascending: false })
    .limit(limit);

  if (error) throw error;

  return (data ?? [])
    .map((row) => ({
      candle_time: row.candle_time,
      open: Number(row.open),
      high: Number(row.high),
      low: Number(row.low),
      close: Number(row.close),
      volume: row.volume == null ? null : Number(row.volume),
    }))
    .filter((row) => [row.open, row.high, row.low, row.close].every(Number.isFinite))
    .reverse();
}

export function isQuoteFresh(quote: LiveMarketQuote | undefined, maxAgeMs = 120_000) {
  if (!quote) return false;

  // Freshness must follow the MT5 tick itself. The bridge can sync the same
  // last tick repeatedly, so metadata.synced_at is not a market-data freshness signal.
  const age = Date.now() - new Date(quote.quoteTime).getTime();
  return Number.isFinite(age) && age >= -30_000 && age <= maxAgeMs;
}

export async function refreshPaperPortfolioMarks() {
  const { data, error } = await supabase.rpc("refresh_paper_portfolio_marks");
  if (error) throw error;
  return data as {
    portfolio_id: string;
    equity: number;
    cash_balance: number;
    unrealized_pnl: number;
    marked_at: string;
  };
}


export function subscribeToMarketQuotes(onChange: () => void) {
  // Quote rows are updated for a large, dynamically discovered MT5 universe.
  // Listening to every market_quotes row would fan out thousands of realtime
  // events and cause the browser to repeatedly reload the entire market board.
  // Poll the latest quote snapshot at a controlled cadence instead, while
  // retaining realtime for the much smaller provider-status table.
  const pollTimer = window.setInterval(onChange, 5000);

  const channel = supabase
    .channel("alphentra-market-status")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "market_provider_status",
      },
      () => onChange(),
    )
    .subscribe();

  return () => {
    window.clearInterval(pollTimer);
    void supabase.removeChannel(channel);
  };
}
