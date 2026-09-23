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
    candle_time: new Date(point.time).toISOString(),
    equity: point.equity,
  }));

  const tradeRows = result.trades.map((trade) => ({
    backtest_id: backtestId,
    entry_time: new Date(trade.entryTime).toISOString(),
    exit_time: new Date(trade.exitTime).toISOString(),
    entry_price: trade.entryPrice,
    exit_price: trade.exitPrice,
    quantity: trade.quantity,
    gross_pnl: trade.grossPnl,
    fees: trade.fees,
    net_pnl: trade.netPnl,
    return_pct: trade.returnPct,
    exit_reason: trade.reason,
  }));

  const { error: equityError } = await supabase
    .from("backtest_equity_points")
    .upsert(equityRows, { onConflict: "backtest_id,candle_time" });
  if (equityError) throw equityError;

  const { error: tradeError } = await supabase
    .from("backtest_trades")
    .insert(tradeRows);
  if (tradeError) throw tradeError;

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
