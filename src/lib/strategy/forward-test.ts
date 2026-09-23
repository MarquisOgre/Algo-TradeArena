import { supabase } from "@/lib/supabase";
import { loadMarketBoard, isQuoteFresh } from "@/lib/marketData";
import { loadStrategyBacktestBars } from "./historical-backtest-v2";
import { evaluateStrategy, type StrategyDefinition } from "./condition-engine";

type Timeframe = "5m" | "15m" | "1h" | "4h" | "1d";

export async function startForwardTest(input: {
  strategyId: string;
  versionId: string;
  marketId: string;
  timeframe: Timeframe;
  initialCapital: number;
  definition: StrategyDefinition;
}) {
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  if (!authData.user) throw new Error("You must be signed in to start a paper forward test.");

  const { data, error } = await supabase.from("strategy_forward_tests").insert({
    profile_id: authData.user.id,
    strategy_id: input.strategyId,
    strategy_version_id: input.versionId,
    market_id: input.marketId,
    timeframe: input.timeframe,
    initial_capital: input.initialCapital,
    status: "active",
    metadata: { definition: input.definition },
  }).select("id").single();
  if (error) throw error;
  return data.id as string;
}

async function paperPortfolio() {
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) throw new Error("Authentication required.");
  const { data, error } = await supabase.from("portfolios")
    .select("id,cash_balance,equity")
    .eq("profile_id", authData.user.id)
    .eq("name", "Main Paper Account")
    .eq("portfolio_type", "paper")
    .eq("is_active", true)
    .single();
  if (error) throw error;
  return data;
}

export async function runForwardTestCycle(input: {
  forwardTestId: string;
  marketId: string;
  timeframe: Timeframe;
  definition: StrategyDefinition;
}) {
  const markets = await loadMarketBoard();
  const market = markets.find((item) => item.id === input.marketId);
  if (!market) throw new Error("The selected MT5 market is no longer available.");
  if (!market.isMarketOpen) throw new Error("The selected MT5 market is currently closed.");
  if (!isQuoteFresh({ quoteTime: new Date().toISOString(), price: market.price, bid: market.bid, ask: market.ask, change: market.change, changePct: market.changePct, volume: 0, isMarketOpen: market.isMarketOpen, metadata: {} })) {
    throw new Error("MT5 quote freshness could not be verified.");
  }

  const bars = await loadStrategyBacktestBars(input.marketId, input.timeframe, 60);
  const evaluation = evaluateStrategy(input.definition, bars);
  const price = Number(market.price);
  let action: "none" | "paper_buy" | "paper_sell" | "blocked" = "none";
  let quantity = 0;
  let orderId: string | null = null;
  let metadata: Record<string, unknown> = { diagnostics: evaluation.diagnostics };

  if (evaluation.entry) {
    const portfolio = await paperPortfolio();
    const riskAmount = Number(portfolio.cash_balance) * (input.definition.riskPerTradePct / 100);
    const stopDistance = input.definition.stopLossPct > 0 ? price * input.definition.stopLossPct / 100 : price * 0.01;
    quantity = Math.max(0, Math.min(riskAmount / stopDistance, Number(portfolio.cash_balance) / price));
    if (quantity > 0) {
      const { data, error } = await supabase.rpc("execute_paper_market_order", {
        p_market_symbol: market.symbol,
        p_side: "buy",
        p_quantity: quantity,
        p_execution_price: price,
        p_client_order_id: `alphentra-forward-${input.forwardTestId}-${Date.now()}-buy`,
      });
      if (error) {
        action = "blocked";
        metadata = { ...metadata, error: error.message };
      } else {
        action = "paper_buy";
        orderId = data?.order_id ?? null;
      }
    }
  } else if (evaluation.exit) {
    const portfolio = await paperPortfolio();
    const { data: position } = await supabase.from("positions")
      .select("quantity")
      .eq("portfolio_id", portfolio.id)
      .eq("market_id", input.marketId)
      .eq("is_open", true)
      .maybeSingle();
    quantity = Number(position?.quantity ?? 0);
    if (quantity > 0) {
      const { data, error } = await supabase.rpc("execute_paper_market_order", {
        p_market_symbol: market.symbol,
        p_side: "sell",
        p_quantity: quantity,
        p_execution_price: price,
        p_client_order_id: `alphentra-forward-${input.forwardTestId}-${Date.now()}-sell`,
      });
      if (error) {
        action = "blocked";
        metadata = { ...metadata, error: error.message };
      } else {
        action = "paper_sell";
        orderId = data?.order_id ?? null;
      }
    }
  }

  const { error: eventError } = await supabase.from("strategy_forward_events").insert({
    forward_test_id: input.forwardTestId,
    signal: evaluation.signal,
    price,
    quantity: quantity || null,
    action,
    order_id: orderId,
    metadata,
  });
  if (eventError) throw eventError;

  await supabase.from("strategy_forward_tests").update({ last_cycle_at: new Date().toISOString() }).eq("id", input.forwardTestId);

  return { signal: evaluation.signal, action, quantity, price, orderId, diagnostics: evaluation.diagnostics };
}
