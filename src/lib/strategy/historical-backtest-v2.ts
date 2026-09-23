import { supabase } from "@/lib/supabase";
import type { StrategyBar, StrategyDefinition } from "./condition-engine";
import { runBacktest, type BacktestConfig, type BacktestResult } from "./backtest-engine-v2";
import { loadMarketHistory, requestMarketHistory } from "@/lib/marketData";
import { ensurePersistedStrategy } from "./strategy-persistence";

type Timeframe = "1m" | "5m" | "15m" | "1h" | "4h" | "1d";

export async function loadStrategyBacktestBars(marketId: string, timeframe: Timeframe, requestedBars = 240): Promise<StrategyBar[]> {
  const limit = Math.min(240, Math.max(30, requestedBars));
  let candles = await loadMarketHistory(marketId, timeframe, limit);
  if (candles.length < 30) {
    await requestMarketHistory(marketId, timeframe, limit);
    candles = await loadMarketHistory(marketId, timeframe, limit);
  }
  return candles.sort((a, b) => new Date(a.candle_time).getTime() - new Date(b.candle_time).getTime()).map((candle) => ({
    time: new Date(candle.candle_time).getTime(), open: candle.open, high: candle.high, low: candle.low,
    close: candle.close, volume: candle.volume ?? undefined,
  }));
}

export async function runAndPersistHistoricalStrategyBacktest(input: {
  strategyName: string; definition: StrategyDefinition; marketId: string; timeframe: Timeframe; config: BacktestConfig;
}): Promise<{ result: BacktestResult; backtestId: string }> {
  const bars = await loadStrategyBacktestBars(input.marketId, input.timeframe, input.config.maxBars ?? 240);
  if (bars.length < 30) throw new Error("MT5 historical data is not ready for this instrument/timeframe. Request history and retry.");
  const { strategyId, versionId } = await ensurePersistedStrategy({
    name: input.strategyName, description: "Strategy created and backtested in ALPHENTRA Strategy Lab.",
    definition: input.definition as unknown as Record<string, unknown>,
  });
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) throw new Error("You must be signed in to run a backtest.");

  const { data: backtest, error: createError } = await supabase.from("backtests").insert({
    profile_id: authData.user.id, strategy_id: strategyId, strategy_version_id: versionId,
    name: `${input.strategyName} · ${input.timeframe}`, status: "running",
    market_ids: [input.marketId], timeframe: input.timeframe,
    start_time: new Date(bars[0].time).toISOString(), end_time: new Date(bars.at(-1)!.time).toISOString(),
    initial_capital: input.config.initialCapital,
    parameters: { feeBps: input.config.feeBps ?? 0, slippageBps: input.config.slippageBps ?? 0, maxBars: input.config.maxBars ?? 240 },
    started_at: new Date().toISOString(),
  }).select("id").single();
  if (createError) throw createError;

  try {
    const result = runBacktest(input.definition, bars, input.config);
    await persistBacktestResultV2(backtest.id, result);
    return { result, backtestId: backtest.id };
  } catch (error) {
    await supabase.from("backtests").update({
      status: "failed", error_message: error instanceof Error ? error.message : "Backtest failed.",
      completed_at: new Date().toISOString(),
    }).eq("id", backtest.id);
    throw error;
  }
}

async function persistBacktestResultV2(backtestId: string, result: BacktestResult) {
  await supabase.from("backtest_trades").delete().eq("backtest_id", backtestId);
  await supabase.from("backtest_equity_snapshots").delete().eq("backtest_id", backtestId);

  const { data: run, error: runError } = await supabase.from("backtests").select("market_ids, strategy_id").eq("id", backtestId).single();
  if (runError) throw runError;
  const marketId = run.market_ids?.[0];
  if (!marketId || !run.strategy_id) throw new Error("Backtest is missing market or strategy identifiers.");

  const equityRows = result.equityCurve.map((point) => ({
    backtest_id: backtestId, snapshot_time: new Date(point.time).toISOString(),
    equity: point.equity, cash: Math.max(0, point.cash), unrealized_pnl: point.unrealizedPnl,
    realized_pnl: point.realizedPnl, drawdown_pct: point.drawdownPct,
  }));
  if (equityRows.length) {
    const { error } = await supabase.from("backtest_equity_snapshots").insert(equityRows);
    if (error) throw error;
  }

  const tradeRows = result.trades.map((trade) => ({
    backtest_id: backtestId, market_id: marketId, strategy_id: run.strategy_id,
    entry_time: new Date(trade.entryTime).toISOString(), exit_time: new Date(trade.exitTime).toISOString(),
    side: "buy" as const, quantity: trade.quantity, entry_price: trade.entryPrice, exit_price: trade.exitPrice,
    gross_pnl: trade.grossPnl, fees: trade.fees, net_pnl: trade.netPnl, return_pct: trade.returnPct,
    holding_seconds: Math.max(0, Math.floor((trade.exitTime - trade.entryTime) / 1000)),
    entry_reason: "strategy_signal", exit_reason: trade.reason, metadata: {},
  }));
  if (tradeRows.length) {
    const { error } = await supabase.from("backtest_trades").insert(tradeRows);
    if (error) throw error;
  }

  const { error: metricsError } = await supabase.from("backtest_metrics").upsert({
    backtest_id: backtestId, cagr_pct: result.annualizedReturnPct, volatility_pct: result.volatilityPct,
    downside_deviation_pct: result.downsideDeviationPct, max_drawdown_pct: result.maxDrawdownPct,
    recovery_factor: result.recoveryFactor, expectancy: result.expectancy, avg_win: result.avgWin, avg_loss: result.avgLoss,
    largest_win: result.largestWin, largest_loss: result.largestLoss, avg_trade_duration_seconds: Math.round(result.avgTradeDurationSeconds),
    consecutive_wins: result.consecutiveWins, consecutive_losses: result.consecutiveLosses, risk_reward_ratio: result.riskRewardRatio,
    calmar_ratio: result.calmarRatio, computed_at: new Date().toISOString(),
  }, { onConflict: "backtest_id" });
  if (metricsError) throw metricsError;

  const winners = result.trades.filter((trade) => trade.netPnl > 0);
  const losers = result.trades.filter((trade) => trade.netPnl < 0);
  const { error: updateError } = await supabase.from("backtests").update({
    status: "completed", final_equity: result.finalEquity, total_return_pct: result.netReturnPct,
    annualized_return_pct: result.annualizedReturnPct, max_drawdown_pct: result.maxDrawdownPct,
    sharpe_ratio: result.sharpeRatio, sortino_ratio: result.sortinoRatio, win_rate_pct: result.winRatePct,
    profit_factor: result.profitFactor, total_trades: result.trades.length, winning_trades: winners.length, losing_trades: losers.length,
    gross_profit: winners.reduce((sum, trade) => sum + trade.netPnl, 0),
    gross_loss: losers.reduce((sum, trade) => sum + trade.netPnl, 0),
    total_fees: result.trades.reduce((sum, trade) => sum + trade.fees, 0),
    completed_at: new Date().toISOString(),
  }).eq("id", backtestId);
  if (updateError) throw updateError;
}
