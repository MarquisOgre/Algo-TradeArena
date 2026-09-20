import { withSupabase } from "npm:@supabase/server";

type MarketRow = {
  id: string;
  symbol: string;
  broker_symbol: string | null;
  asset_class: string;
  metadata: Record<string, unknown> | null;
};

type QuoteRow = {
  symbol?: string;
  name?: string;
  exchange?: string;
  currency?: string;
  datetime?: string;
  timestamp?: number;
  last_quote_at?: number;
  open?: string | number;
  high?: string | number;
  low?: string | number;
  close?: string | number;
  volume?: string | number;
  previous_close?: string | number;
  change?: string | number;
  percent_change?: string | number;
  is_market_open?: boolean;
  status?: string;
  message?: string;
  code?: number;
};

const PROVIDER = "twelve_data";

function providerSymbol(market: MarketRow): string {
  const configured = market.metadata?.provider_symbol;
  if (typeof configured === "string" && configured.trim()) return configured.trim();

  switch (market.symbol.toUpperCase()) {
    case "EURUSD":
      return "EUR/USD";
    case "BTCUSD":
      return "BTC/USD";
    case "ETHUSD":
      return "ETH/USD";
    case "XAUUSD":
      return "XAU/USD";
    default:
      return market.broker_symbol?.trim() || market.symbol;
  }
}

function numberOrNull(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function quoteTime(row: QuoteRow): string {
  if (typeof row.timestamp === "number" && Number.isFinite(row.timestamp)) {
    return new Date(row.timestamp * 1000).toISOString();
  }

  if (typeof row.last_quote_at === "number" && Number.isFinite(row.last_quote_at)) {
    return new Date(row.last_quote_at * 1000).toISOString();
  }

  if (row.datetime) {
    const parsed = new Date(row.datetime);
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString();
  }

  return new Date().toISOString();
}

function extractQuotes(payload: unknown): QuoteRow[] {
  if (Array.isArray(payload)) return payload as QuoteRow[];

  if (!payload || typeof payload !== "object") return [];

  const record = payload as Record<string, unknown>;
  const nested = record.data;
  if (Array.isArray(nested)) return nested as QuoteRow[];

  return Object.values(record).filter(
    (value): value is QuoteRow =>
      Boolean(value) &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      ("symbol" in (value as Record<string, unknown>) || "close" in (value as Record<string, unknown>)),
  );
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json",
  };
}

export default {
  fetch: withSupabase({ auth: "secret:market-data-sync" }, async (req, ctx) => {
    if (req.method === "OPTIONS") {
      return new Response("ok", { headers: corsHeaders() });
    }

    if (req.method !== "POST") {
      return Response.json({ error: "POST required" }, { status: 405, headers: corsHeaders() });
    }

    const apiKey = Deno.env.get("TWELVE_DATA_API_KEY");
    if (!apiKey) {
      return Response.json(
        { error: "TWELVE_DATA_API_KEY is not configured" },
        { status: 503, headers: corsHeaders() },
      );
    }

    const { data: markets, error: marketError } = await ctx.supabaseAdmin
      .from("markets")
      .select("id, symbol, broker_symbol, asset_class, metadata")
      .eq("status", "active")
      .eq("is_tradable", true)
      .order("symbol");

    if (marketError) {
      return Response.json(
        { error: marketError.message },
        { status: 500, headers: corsHeaders() },
      );
    }

    const rows = (markets ?? []) as MarketRow[];
    if (rows.length === 0) {
      return Response.json({ provider: PROVIDER, updated: 0 }, { headers: corsHeaders() });
    }

    const requested = rows.map((market) => ({
      market,
      symbol: providerSymbol(market),
    }));

    const url = new URL("https://api.twelvedata.com/quote");
    url.searchParams.set("symbol", requested.map((item) => item.symbol).join(","));
    url.searchParams.set("apikey", apiKey);
    url.searchParams.set("dp", "12");

    const response = await fetch(url, {
      headers: { Accept: "application/json" },
    });

    const payload = await response.json();

    if (!response.ok) {
      return Response.json(
        { error: "Market data provider request failed", details: payload },
        { status: 502, headers: corsHeaders() },
      );
    }

    const quotes = extractQuotes(payload);
    const bySymbol = new Map<string, QuoteRow>();

    for (const quote of quotes) {
      if (quote.symbol) bySymbol.set(quote.symbol.toUpperCase(), quote);
    }

    const upserts: Array<Record<string, unknown>> = [];
    const errors: Array<{ symbol: string; message: string }> = [];

    for (const item of requested) {
      const quote = bySymbol.get(item.symbol.toUpperCase());

      if (!quote) {
        errors.push({ symbol: item.market.symbol, message: "No quote returned" });
        continue;
      }

      const price = numberOrNull(quote.close);
      if (price === null || price <= 0) {
        errors.push({
          symbol: item.market.symbol,
          message: quote.message || "Provider returned no valid price",
        });
        continue;
      }

      upserts.push({
        market_id: item.market.id,
        provider: PROVIDER,
        quote_time: quoteTime(quote),
        price,
        open: numberOrNull(quote.open),
        high: numberOrNull(quote.high),
        low: numberOrNull(quote.low),
        previous_close: numberOrNull(quote.previous_close),
        change: numberOrNull(quote.change),
        percent_change: numberOrNull(quote.percent_change),
        volume: numberOrNull(quote.volume),
        is_market_open: quote.is_market_open ?? null,
        provider_symbol: item.symbol,
        metadata: {
          provider: PROVIDER,
          exchange: quote.exchange ?? null,
          currency: quote.currency ?? null,
          name: quote.name ?? null,
          source_timestamp: quote.timestamp ?? null,
        },
      });
    }

    if (upserts.length > 0) {
      const { error: upsertError } = await ctx.supabaseAdmin
        .from("market_quotes")
        .upsert(upserts, { onConflict: "market_id,provider" });

      if (upsertError) {
        return Response.json(
          { error: upsertError.message, attempted: upserts.length },
          { status: 500, headers: corsHeaders() },
        );
      }
    }

    return Response.json(
      {
        provider: PROVIDER,
        requested: rows.length,
        updated: upserts.length,
        errors,
        updated_at: new Date().toISOString(),
      },
      { headers: corsHeaders() },
    );
  }),
};
