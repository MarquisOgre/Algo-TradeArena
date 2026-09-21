import { withSupabase } from "npm:@supabase/server";

type AccountSnapshot = {
  login: string;
  server: string;
  balance: number;
  equity: number;
  margin: number;
  free_margin: number;
  leverage: number | null;
  currency: string;
  terminal_build: number | null;
  is_hedging_account: boolean;
};

type QuoteSnapshot = {
  market_id: string;
  symbol: string;
  bid: number;
  ask: number;
  price?: number;
  change?: number | null;
  percent_change?: number | null;
  previous_close?: number | null;
  quote_time?: string;
  volume?: number | null;
  is_market_open?: boolean | null;
  metadata?: Record<string, unknown>;
};

type CandleSnapshot = {
  market_id: string;
  symbol: string;
  timeframe: string;
  candle_time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number | null;
  trade_count?: number | null;
  metadata?: Record<string, unknown>;
};

type BrokerMarketMappingSnapshot = {
  market_id?: string;
  symbol: string;
  status: "live" | "no_quote" | "unsupported";
  provider_symbol?: string | null;
  checked_at?: string;
  metadata?: Record<string, unknown>;
};

type MarketUniverseSnapshot = {
  symbol: string;
  name: string;
  asset_class: "crypto" | "forex" | "stocks" | "etf" | "index" | "commodity" | "futures" | "options";
  exchange?: string | null;
  quote_currency?: string | null;
  base_currency?: string | null;
  broker_symbol: string;
  price_precision?: number;
  quantity_precision?: number;
  min_quantity?: number | null;
  contract_size?: number;
  is_tradable?: boolean;
  metadata?: Record<string, unknown>;
};

type MarketStatusSnapshot = {
  market_id?: string;
  symbol: string;
  status: "live" | "no_quote" | "unsupported";
  provider_symbol?: string | null;
  checked_at?: string;
  metadata?: Record<string, unknown>;
};

type PositionSnapshot = {
  ticket: number;
  symbol: string;
  side: "long" | "short";
  volume: number;
  open_price: number;
  current_price?: number | null;
  stop_loss?: number | null;
  take_profit?: number | null;
  swap?: number;
  commission?: number;
  profit?: number;
  opened_at?: string | null;
  metadata?: Record<string, unknown>;
};

type SyncPayload = {
  broker_account_id: string;
  mt5_account_id: string;
  market_universe?: MarketUniverseSnapshot[];
  account?: AccountSnapshot;
  quotes?: QuoteSnapshot[];
  candles?: CandleSnapshot[];
  positions?: PositionSnapshot[];
  market_statuses?: MarketStatusSnapshot[];
  broker_market_mappings?: BrokerMarketMappingSnapshot[];
};

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "apikey, authorization, content-type, x-mt5-bridge-secret",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json",
  };
}

function numberOrNull(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export default {
  fetch: withSupabase({ auth: "secret:mt5_gateway" }, async (req, ctx) => {
    if (req.method === "OPTIONS") {
      return new Response("ok", { headers: corsHeaders() });
    }

    if (req.method !== "POST") {
      return Response.json({ error: "POST required" }, { status: 405, headers: corsHeaders() });
    }

    const body = (await req.json()) as SyncPayload;

    if (!body.broker_account_id || !body.mt5_account_id) {
      return Response.json(
        { error: "broker_account_id and mt5_account_id are required" },
        { status: 400, headers: corsHeaders() },
      );
    }

    const { data: mt5Account, error: accountLookupError } = await ctx.supabaseAdmin
      .from("mt5_accounts")
      .select("id, broker_account_id")
      .eq("id", body.mt5_account_id)
      .eq("broker_account_id", body.broker_account_id)
      .maybeSingle();

    if (accountLookupError) {
      return Response.json(
        { error: accountLookupError.message },
        { status: 500, headers: corsHeaders() },
      );
    }

    if (!mt5Account) {
      return Response.json({ error: "MT5 account mapping not found" }, { status: 404, headers: corsHeaders() });
    }

    const now = new Date().toISOString();

    if (body.account) {
      const { error: brokerError } = await ctx.supabaseAdmin
        .from("broker_accounts")
        .update({
          status: "connected",
          last_synced_at: now,
          metadata: {
            source: "mt5_bridge",
            last_bridge_sync: now,
          },
          updated_at: now,
        })
        .eq("id", body.broker_account_id);

      if (brokerError) {
        return Response.json({ error: brokerError.message }, { status: 500, headers: corsHeaders() });
      }

      const { error: mt5Error } = await ctx.supabaseAdmin
        .from("mt5_accounts")
        .update({
          login_identifier: String(body.account.login),
          server_name: body.account.server,
          terminal_build: body.account.terminal_build,
          balance: body.account.balance,
          equity: body.account.equity,
          margin: body.account.margin,
          free_margin: body.account.free_margin,
          leverage: body.account.leverage,
          currency: body.account.currency,
          is_hedging_account: body.account.is_hedging_account,
          last_account_sync_at: now,
          updated_at: now,
        })
        .eq("id", body.mt5_account_id);

      if (mt5Error) {
        return Response.json({ error: mt5Error.message }, { status: 500, headers: corsHeaders() });
      }


    }

    const marketIdByProviderSymbol = new Map<string, string>();

    if (body.market_universe?.length) {
      // The MT5 bridge is the source of truth for the development universe.
      // Deactivate the old prototype/simulated catalog before applying the
      // currently discovered MT5 instruments.
      const { error: deactivateError } = await ctx.supabaseAdmin
        .from("markets")
        .update({ status: "inactive", is_tradable: false, updated_at: now })
        .eq("exchange", "ALPHENTRA-SIM");

      if (deactivateError) {
        return Response.json({ error: deactivateError.message }, { status: 500, headers: corsHeaders() });
      }

      const providerSymbols = body.market_universe
        .map((market) => market.broker_symbol)
        .filter(Boolean);

      const existingMarkets: Array<{ id: string; broker_symbol: string | null }> = [];
      for (let start = 0; start < providerSymbols.length; start += 100) {
        const chunk = providerSymbols.slice(start, start + 100);
        const { data, error } = await ctx.supabaseAdmin
          .from("markets")
          .select("id,broker_symbol")
          .in("broker_symbol", chunk);

        if (error) {
          return Response.json({ error: error.message }, { status: 500, headers: corsHeaders() });
        }
        existingMarkets.push(...(data ?? []));
      }

      const existingByBrokerSymbol = new Map(
        existingMarkets
          .filter((market) => market.broker_symbol)
          .map((market) => [market.broker_symbol!.toUpperCase(), market.id]),
      );

      const marketRows = body.market_universe.map((market) => {
        const existingId = existingByBrokerSymbol.get(market.broker_symbol.toUpperCase());
        return {
          ...(existingId ? { id: existingId } : {}),
          symbol: market.symbol,
          name: market.name,
          asset_class: market.asset_class,
          exchange: market.exchange ?? "MT5",
          quote_currency: market.quote_currency ?? "USD",
          base_currency: market.base_currency ?? null,
          broker_symbol: market.broker_symbol,
          price_precision: Math.max(0, Math.min(18, Math.trunc(market.price_precision ?? 8))),
          quantity_precision: Math.max(0, Math.min(18, Math.trunc(market.quantity_precision ?? 8))),
          min_quantity: numberOrNull(market.min_quantity),
          contract_size: Math.max(0.000000000001, Number(market.contract_size ?? 1)),
          status: "active",
          is_tradable: market.is_tradable ?? true,
          metadata: {
            ...(market.metadata ?? {}),
            provider: "mt5",
            synced_at: now,
          },
          updated_at: now,
        };
      });

      if (marketRows.length) {
        const { data, error } = await ctx.supabaseAdmin
          .from("markets")
          .upsert(marketRows, { onConflict: "id" })
          .select("id,broker_symbol");

        if (error) {
          return Response.json({ error: error.message }, { status: 500, headers: corsHeaders() });
        }

        for (const row of data ?? []) {
          if (row.broker_symbol) {
            marketIdByProviderSymbol.set(row.broker_symbol.toUpperCase(), row.id);
          }
        }
      }
    }

    let brokerMarketMappingsUpdated = 0;
    if (body.broker_market_mappings?.length) {
      const mappingRows = body.broker_market_mappings.map((mapping) => ({
        broker_account_id: body.broker_account_id,
        market_id: mapping.market_id ?? marketIdByProviderSymbol.get(
          (mapping.provider_symbol ?? mapping.symbol).toUpperCase(),
        ),
        provider: "mt5",
        provider_symbol: mapping.provider_symbol ?? null,
        status: mapping.status,
        last_verified_at: mapping.checked_at ?? now,
        metadata: {
          ...(mapping.metadata ?? {}),
          provider: "mt5",
          synced_at: now,
        },
        updated_at: now,
      }));

      const validMappingRows = mappingRows.filter((row) => row.market_id);
      const { error: mappingError } = await ctx.supabaseAdmin
        .from("broker_market_mappings")
        .upsert(validMappingRows, { onConflict: "broker_account_id,market_id,provider" });

      if (mappingError) {
        return Response.json({ error: mappingError.message }, { status: 500, headers: corsHeaders() });
      }
      brokerMarketMappingsUpdated = validMappingRows.length;
    }

    let marketStatusesUpdated = 0;
    if (body.market_statuses?.length) {
      const statusRows = body.market_statuses.map((status) => ({
        market_id: status.market_id ?? marketIdByProviderSymbol.get(
          (status.provider_symbol ?? status.symbol).toUpperCase(),
        ),
        provider: "mt5",
        status: status.status,
        provider_symbol: status.provider_symbol ?? null,
        checked_at: status.checked_at ?? now,
        metadata: {
          ...(status.metadata ?? {}),
          provider: "mt5",
          synced_at: now,
        },
      }));

      const validStatusRows = statusRows.filter((row) => row.market_id);
      const { error: statusError } = await ctx.supabaseAdmin
        .from("market_provider_status")
        .upsert(validStatusRows, { onConflict: "market_id,provider" });

      if (statusError) {
        return Response.json({ error: statusError.message }, { status: 500, headers: corsHeaders() });
      }
      marketStatusesUpdated = validStatusRows.length;
    }

    let quotesUpdated = 0;
    if (body.quotes?.length) {
      const quoteRows = body.quotes
        .filter((quote) => quote.market_id && quote.bid > 0 && quote.ask > 0)
        .map((quote) => ({
          market_id: quote.market_id ?? marketIdByProviderSymbol.get(quote.symbol.toUpperCase()),
          provider: "mt5",
          quote_time: quote.quote_time ?? now,
          price: numberOrNull(quote.price) ?? (quote.bid + quote.ask) / 2,
          change: numberOrNull(quote.change),
          percent_change: numberOrNull(quote.percent_change),
          previous_close: numberOrNull(quote.previous_close),
          bid: quote.bid,
          ask: quote.ask,
          spread: Math.max(0, quote.ask - quote.bid),
          volume: quote.volume ?? null,
          is_market_open: quote.is_market_open ?? null,
          provider_symbol: quote.symbol,
          metadata: {
            ...(quote.metadata ?? {}),
            provider: "mt5",
            synced_at: now,
          },
        }));

      const validQuoteRows = quoteRows.filter((row) => row.market_id);
      if (validQuoteRows.length) {
        const { error: quoteError, data } = await ctx.supabaseAdmin
          .from("market_quotes")
          .upsert(validQuoteRows, { onConflict: "market_id,provider" });

        if (quoteError) {
          return Response.json({ error: quoteError.message }, { status: 500, headers: corsHeaders() });
        }
        quotesUpdated = validQuoteRows.length;
      }
    }

    if (body.candles?.length) {
      const candleRows = body.candles.map((candle) => ({
        market_id: candle.market_id ?? marketIdByProviderSymbol.get(candle.symbol.toUpperCase()),
        timeframe: candle.timeframe,
        candle_time: candle.candle_time,
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close,
        volume: candle.volume ?? null,
        trade_count: candle.trade_count ?? null,
        source: "mt5",
      }));

      const validCandleRows = candleRows.filter((row) => row.market_id);
      const { error: candleError } = await ctx.supabaseAdmin
        .from("market_data")
        .upsert(validCandleRows, { onConflict: "market_id,timeframe,candle_time,source" });

      if (candleError) {
        return Response.json({ error: candleError.message }, { status: 500, headers: corsHeaders() });
      }
    }

    let positionsUpdated = 0;
    if (body.positions?.length) {
      const positionRows = body.positions.map((position) => ({
        mt5_account_id: body.mt5_account_id,
        symbol: position.symbol,
        side: position.side,
        volume: position.volume,
        open_price: position.open_price,
        current_price: position.current_price ?? null,
        stop_loss: position.stop_loss ?? null,
        take_profit: position.take_profit ?? null,
        swap: position.swap ?? 0,
        commission: position.commission ?? 0,
        profit: position.profit ?? 0,
        mt5_ticket: position.ticket,
        opened_at: position.opened_at ?? null,
        last_synced_at: now,
        is_open: true,
        metadata: {
          ...(position.metadata ?? {}),
          source: "mt5_bridge",
        },
        updated_at: now,
      }));

      const { error: positionError, data } = await ctx.supabaseAdmin
        .from("mt5_positions")
        .upsert(positionRows, { onConflict: "mt5_account_id,mt5_ticket" });

      if (positionError) {
        return Response.json({ error: positionError.message }, { status: 500, headers: corsHeaders() });
      }
      positionsUpdated = positionRows.length;
    }

    return Response.json(
      {
        ok: true,
        broker_account_id: body.broker_account_id,
        mt5_account_id: body.mt5_account_id,
        quotes_updated: quotesUpdated,
        market_statuses_updated: marketStatusesUpdated,
        broker_market_mappings_updated: brokerMarketMappingsUpdated,
        positions_updated: positionsUpdated,
        synced_at: now,
      },
      { headers: corsHeaders() },
    );
  }),
};
