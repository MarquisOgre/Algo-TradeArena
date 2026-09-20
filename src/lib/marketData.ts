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
};

type MarketRow = {
  id: string;
  symbol: string;
  name: string;
  asset_class: string;
  exchange: string | null;
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
          "market_id, provider, quote_time, price, change, percent_change, previous_close, volume, is_market_open, bid, ask, spread",
        )
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
    });
  }

  return latestByMarket;
}

export async function loadMarketBoard(): Promise<Market[]> {
  const liveQuotes = await loadLiveMarketQuotes();
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
    const fallback = mockBySymbol.get(row.symbol.toUpperCase());
    const fallbackPrice = fallback?.price ?? 0;
    const price = live?.price ?? fallbackPrice;

    return {
      id: row.id,
      symbol: row.symbol,
      name: row.name,
      assetClass: assetClassLabel(row.asset_class),
      price,
      change: live?.change ?? fallback?.change ?? 0,
      changePct: live?.changePct ?? fallback?.changePct ?? 0,
      volume: formatVolume(live?.volume ?? null),
      marketCap: fallback?.marketCap ?? "—",
      spark: fallback?.spark ?? Array.from({ length: 30 }, () => price),
      aiSignal: fallback?.aiSignal ?? "Neutral",
      aiConfidence: fallback?.aiConfidence ?? 50,
    };
  });
}

export async function loadMarketHistory(marketId: string, timeframe = "1m", limit = 60): Promise<number[]> {
  const { data, error } = await supabase
    .from("market_data")
    .select("close")
    .eq("market_id", marketId)
    .eq("timeframe", timeframe)
    .eq("source", "mt5")
    .order("candle_time", { ascending: false })
    .limit(limit);

  if (error) throw error;

  return (data ?? [])
    .map((row) => Number(row.close))
    .filter((value) => Number.isFinite(value) && value > 0)
    .reverse();
}

export function isQuoteFresh(quote: LiveMarketQuote | undefined, maxAgeMs = 120_000) {
  if (!quote) return false;
  return Date.now() - new Date(quote.quoteTime).getTime() <= maxAgeMs;
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
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}
