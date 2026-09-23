import { supabase } from "@/lib/supabase";
import type { StrategyBar, StrategyDefinition } from "./condition-engine";
import { runBacktest, type BacktestConfig, type BacktestResult } from "./backtest-engine";
import { loadMarketHistory, requestMarketHistory } from "@/lib/marketData";

export async function loadStrategyBacktestBars(
  marketId: string,
  timeframe: "1m" | "5m" | "15m" | "1h" | "4h" | "1d",
  requestedBars = 240,
): Promise<StrategyBar[]> {
  let candles = await loadMarketHistory(marketId, timeframe, requestedBars);
  if (candles.length < 30) {
    await requestMarketHistory(marketId, timeframe, requestedBars);
    candles = await loadMarketHistory(marketId, timeframe, requestedBars);
  }

  return candles.map((candle) => ({
    time: new Date(candle.candle_time).getTime(),
    open: candle.open,
    high: candle.high,
    low: candle.low,
    close: candle.close,
    volume: candle.volume ?? undefined,
  }));
}

export async function runHistoricalStrategyBacktest(
  definition: StrategyDefinition,
  marketId: string,
  timeframe: "1m" | "5m" | "15m" | "1h" | "4h" | "1d",
  config: BacktestConfig,
): Promise<BacktestResult> {
  const bars = await loadStrategyBacktestBars(marketId, timeframe, config.maxBars ?? 240);
  if (bars.length < 30) {
    throw new Error("MT5 historical data is not ready for this instrument/timeframe. Request history and retry.");
  }
  return runBacktest(definition, bars, config);
}

export async function persistBacktestResult(
  backtestId: string,
  result: BacktestResult,
) {
  const equityRows = result.equityCurve.map((point) => ({
    backtest_id: backtestId,
    snapshot_time: new Date(point.time).toISOString(),
    equity: point.equity,
    cash: point.equity,
    unrealized_pnl: 0,
    realized_pnl: 0,
    drawdown_pct: 0,
  }));

  const { error: equityError } = await supabase
    .from("backtest_equity_snapshots")
    .upsert(equityRows, { onConflict: "backtest_id,snapshot_time" });
  if (equityError) throw equityError;

  // Trade rows require the canonical market and strategy IDs from the backtest record.
  const { data: run, error: runError } = await supabase
    .from("backtests")
    .select("market_ids, strategy_id")
    .eq("id", backtestId)
    .single();
  if (runError) throw runError;
  const marketId = run.market_ids?.[0];
  if (!marketId || !run.strategy_id) throw new Error("Backtest is missing market or strategy identifiers.");

  const tradeRows = result.trades.map((trade) => ({
    backtest_id: backtestId,
    market_id: marketId,
    strategy_id: run.strategy_id,
    entry_time: new Date(trade.entryTime).toISOString(),
    exit_time: new Date(trade.exitTime).toISOString(),
    side: "buy" as const,
    quantity: trade.quantity,
    entry_price: trade.entryPrice,
    exit_price: trade.exitPrice,
    gross_pnl: trade.grossPnl,
    fees: trade.fees,
    net_pnl: trade.netPnl,
    return_pct: trade.returnPct,
    holding_seconds: Math.max(0, Math.floor((trade.exitTime - trade.entryTime) / 1000)),
    entry_reason: "strategy_signal",
    exit_reason: trade.reason,
    metadata: {},
  }));

  if (tradeRows.length) {
    const { error: tradeError } = await supabase.from("backtest_trades").insert(tradeRows);
    if (tradeError) throw tradeError;
  }

  const { data, error } = await supabase
    .from("backtests")
    .update({
      status: "completed",
      final_equity: result.finalEquity,
      total_return_pct: result.netReturnPct,
      max_drawdown_pct: result.maxDrawdownPct,
      win_rate_pct: result.winRatePct,
      profit_factor: result.profitFactor,
      total_trades: result.trades.length,
      winning_trades: result.trades.filter((trade) => trade.netPnl > 0).length,
      losing_trades: result.trades.filter((trade) => trade.netPnl < 0).length,
      gross_profit: result.trades.filter((trade) => trade.netPnl > 0).reduce((sum, trade) => sum + trade.netPnl, 0),
      gross_loss: result.trades.filter((trade) => trade.netPnl < 0).reduce((sum, trade) => sum + trade.netPnl, 0),
      total_fees: result.trades.reduce((sum, trade) => sum + trade.fees, 0),
      completed_at: new Date().toISOString(),
    })
    .eq("id", backtestId)
    .select()
    .single();

  if (error) throw error;
  return data;
}
