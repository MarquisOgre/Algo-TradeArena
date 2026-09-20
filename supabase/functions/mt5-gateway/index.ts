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
  account: AccountSnapshot;
  quotes?: QuoteSnapshot[];
  candles?: CandleSnapshot[];
  positions?: PositionSnapshot[];
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

    if (!body.broker_account_id || !body.mt5_account_id || !body.account) {
      return Response.json(
        { error: "broker_account_id, mt5_account_id and account are required" },
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

    let quotesUpdated = 0;
    if (body.quotes?.length) {
      const quoteRows = body.quotes
        .filter((quote) => quote.market_id && quote.bid > 0 && quote.ask > 0)
        .map((quote) => ({
          market_id: quote.market_id,
          provider: "mt5",
          quote_time: quote.quote_time ?? now,
          price: numberOrNull(quote.price) ?? (quote.bid + quote.ask) / 2,
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

      if (quoteRows.length) {
        const { error: quoteError, data } = await ctx.supabaseAdmin
          .from("market_quotes")
          .upsert(quoteRows, { onConflict: "market_id,provider" })
          .select("id");

        if (quoteError) {
          return Response.json({ error: quoteError.message }, { status: 500, headers: corsHeaders() });
        }
        quotesUpdated = data?.length ?? quoteRows.length;
      }
    }

    if (body.candles?.length) {
      const candleRows = body.candles.map((candle) => ({
        market_id: candle.market_id,
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

      const { error: candleError } = await ctx.supabaseAdmin
        .from("market_data")
        .upsert(candleRows, { onConflict: "market_id,timeframe,candle_time,source" });

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
        .upsert(positionRows, { onConflict: "mt5_account_id,mt5_ticket" })
        .select("id");

      if (positionError) {
        return Response.json({ error: positionError.message }, { status: 500, headers: corsHeaders() });
      }
      positionsUpdated = data?.length ?? positionRows.length;
    }

    return Response.json(
      {
        ok: true,
        broker_account_id: body.broker_account_id,
        mt5_account_id: body.mt5_account_id,
        quotes_updated: quotesUpdated,
        positions_updated: positionsUpdated,
        synced_at: now,
      },
      { headers: corsHeaders() },
    );
  }),
};
