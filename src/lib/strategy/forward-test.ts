import { supabase } from "@/lib/supabase";
import { loadMarketBoard } from "@/lib/marketData";
import { loadStrategyBacktestBars } from "./historical-backtest-v2";
import { evaluateStrategy, type StrategyDefinition } from "./condition-engine";

type Timeframe = "5m" | "15m" | "1h" | "4h" | "1d";

export async function startForwardTest(input: { backtestId: string; definition: StrategyDefinition }) {
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  if (!authData.user) throw new Error("You must be signed in to start a paper forward test.");

  const { data: backtest, error: backtestError } = await supabase.from("backtests")
    .select("strategy_id,strategy_version_id,market_ids,timeframe,initial_capital,status")
    .eq("id", input.backtestId).single();
  if (backtestError) throw backtestError;
  if (backtest.status !== "completed") throw new Error("A completed backtest is required before forward testing.");
  const marketId = backtest.market_ids?.[0];
  if (!marketId) throw new Error("The backtest has no market assigned.");

  const { data, error } = await supabase.from("strategy_forward_tests").insert({
    profile_id: authData.user.id,
    strategy_id: backtest.strategy_id,
    strategy_version_id: backtest.strategy_version_id,
    market_id: marketId,
    timeframe: backtest.timeframe,
    initial_capital: backtest.initial_capital,
    status: "active",
    metadata: { definition: input.definition },
  }).select("id").single();
  if (error) throw error;
  return { id: data.id as string, marketId, timeframe: backtest.timeframe as "5m" | "15m" | "1h" | "4h" | "1d" };
}



export async function runForwardTestCycle(input: {
  forwardTestId: string;
  marketId: string;
  timeframe: Timeframe;
  definition: StrategyDefinition;
}) {
  const { data: forwardTest, error: testError } = await supabase
    .from("strategy_forward_tests")
    .select("id,status,market_id,timeframe,initial_capital")
    .eq("id", input.forwardTestId)
    .single();
  if (testError) throw testError;
  if (forwardTest.status !== "active") throw new Error("Forward-test session is not active.");
  if (forwardTest.market_id !== input.marketId) throw new Error("Forward-test market does not match the backtest market.");

  const board = await loadMarketBoard();
  const market = board.find((item) => item.id === input.marketId);
  if (!market || market.providerStatus !== "live" || !Number.isFinite(market.price) || market.price <= 0) {
    throw new Error("The selected MT5 market does not currently have a live quote.");
  }

  const candles = await loadStrategyBacktestBars(input.marketId, input.timeframe, 120);
  if (candles.length < 30) throw new Error("Insufficient MT5 history for a forward-test cycle.");

  const bars = candles.map((bar) => ({
    time: new Date(bar.candle_time).getTime(),
    open: bar.open,
    high: bar.high,
    low: bar.low,
    close: bar.close,
    volume: bar.volume ?? undefined,
  }));

  const evaluation = evaluateStrategy(input.definition, bars);
  let action: "none" | "paper_buy" | "paper_sell" | "blocked" = "none";
  let quantity = 0;
  let orderId: string | null = null;
  let orderResult: Record<string, unknown> | null = null;

  if (evaluation.signal === "BUY") {
    const stopDistance = market.price * Math.max(input.definition.stopLossPct, 0.1) / 100;
    quantity = Math.max(0.000001, (Number(forwardTest.initial_capital) * (input.definition.riskPerTradePct / 100)) / stopDistance);

    const { data: existingPosition, error: positionError } = await supabase
      .from("positions")
      .select("id")
      .eq("market_id", input.marketId)
      .eq("is_open", true)
      .eq("side", "long")
      .limit(1)
      .maybeSingle();
    if (positionError) throw positionError;

    if (!existingPosition) {
      const { data, error } = await supabase.rpc("execute_paper_market_order", {
        p_market_symbol: market.symbol,
        p_side: "buy",
        p_quantity: quantity,
        p_execution_price: market.price,
        p_client_order_id: `forward-${input.forwardTestId}-${Date.now()}`,
      });
      if (error) throw error;
      orderResult = (data ?? {}) as Record<string, unknown>;
      orderId = typeof orderResult.order_id === "string" ? orderResult.order_id : null;
      action = "paper_buy";
    } else {
      action = "blocked";
    }
  } else if (evaluation.signal === "SELL") {
    const { data: position, error: positionError } = await supabase
      .from("positions")
      .select("quantity")
      .eq("market_id", input.marketId)
      .eq("is_open", true)
      .eq("side", "long")
      .limit(1)
      .maybeSingle();
    if (positionError) throw positionError;

    quantity = Number(position?.quantity ?? 0);
    if (quantity > 0) {
      const { data, error } = await supabase.rpc("execute_paper_market_order", {
        p_market_symbol: market.symbol,
        p_side: "sell",
        p_quantity: quantity,
        p_execution_price: market.price,
        p_client_order_id: `forward-${input.forwardTestId}-${Date.now()}`,
      });
      if (error) throw error;
      orderResult = (data ?? {}) as Record<string, unknown>;
      orderId = typeof orderResult.order_id === "string" ? orderResult.order_id : null;
      action = "paper_sell";
    } else {
      action = "blocked";
    }
  }

  const { error: eventError } = await supabase.from("strategy_forward_events").insert({
    forward_test_id: input.forwardTestId,
    signal: evaluation.signal,
    price: market.price,
    quantity: quantity || null,
    action,
    order_id: orderId,
    metadata: {
      timeframe: input.timeframe,
      symbol: market.symbol,
      quote_time: market.providerSymbol ?? null,
      diagnostics: evaluation.diagnostics,
      order: orderResult,
    },
  });
  if (eventError) throw eventError;

  const { error: updateError } = await supabase
    .from("strategy_forward_tests")
    .update({ last_cycle_at: new Date().toISOString() })
    .eq("id", input.forwardTestId);
  if (updateError) throw updateError;

  return {
    signal: evaluation.signal,
    action,
    price: market.price,
    quantity,
    orderId,
    diagnostics: evaluation.diagnostics,
  };
}
