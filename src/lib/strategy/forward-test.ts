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

