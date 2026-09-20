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
      return "Equity";
    case "etf":
      return "ETF";
    case "index":
      return "Index";
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

function formatVolume(value: number | null) {
  if (value === null) return "—";
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

export async function loadLiveMarketQuotes(): Promise<Map<string, LiveMarketQuote>> {
  const [{ data: markets, error: marketError }, { data: quotes, error: quoteError }] =
    await Promise.all([
      supabase
        .from("markets")
        .select("id, symbol, name, asset_class, exchange")
        .eq("status", "active")
        .order("symbol"),
      supabase
        .from("market_quotes")
        .select(
          "market_id, provider, quote_time, price, change, percent_change, previous_close, volume, is_market_open, bid, ask, spread, metadata",
        )
        .eq("provider", "mt5")
        .order("quote_time", { ascending: false })
        .limit(100),
    ]);

  if (marketError) throw marketError;
  if (quoteError) throw quoteError;

  const marketById = new Map(
    ((markets ?? []) as MarketRow[]).map((market) => [market.id, market]),
  );
  const latestByMarket = new Map<string, LiveMarketQuote>();

  for (const quote of (quotes ?? []) as QuoteRow[]) {
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
  const { data: marketRows, error } = await supabase
    .from("markets")
    .select("id, symbol, name, asset_class, exchange")
    .eq("status", "active")
    .eq("is_tradable", true)
    .order("symbol");

  if (error) throw error;

  const mockBySymbol = new Map(mockMarkets.map((market) => [market.symbol.toUpperCase(), market]));
  const bySymbol = new Map(
    [...liveQuotes.values()].map((quote) => [quote.symbol.toUpperCase(), quote]),
  );

  return ((marketRows ?? []) as MarketRow[]).map((row) => {
    const live = bySymbol.get(row.symbol.toUpperCase());
    const status = statuses.get(row.id);
    const fallback = mockBySymbol.get(row.symbol.toUpperCase());
    const providerStatus = status?.status ?? (live ? "live" : "unsupported");
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
      marketCap: fallback?.marketCap ?? "—",
      spark: providerStatus === "live" ? fallback?.spark ?? Array.from({ length: 30 }, () => price) : Array.from({ length: 30 }, () => 0),
      aiSignal: fallback?.aiSignal ?? "Neutral",
      aiConfidence: fallback?.aiConfidence ?? 50,
      providerStatus,
      providerSymbol: status?.providerSymbol ?? live?.symbol ?? null,
    };
  });
}

export type MarketCandle = {
  candle_time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number | null;
};

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

  const syncedAt =
    typeof quote.metadata?.synced_at === "string"
      ? quote.metadata.synced_at
      : quote.quoteTime;

  const age = Date.now() - new Date(syncedAt).getTime();
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
  const channel = supabase
    .channel("alphentra-market-quotes")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "market_quotes",
      },
      () => onChange(),
    )
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
    void supabase.removeChannel(channel);
  };
}
