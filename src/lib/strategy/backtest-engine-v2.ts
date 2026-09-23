import { evaluateStrategy, type StrategyBar, type StrategyDefinition } from "./condition-engine";

export type BacktestConfig = { initialCapital: number; feeBps?: number; slippageBps?: number; maxBars?: number };
export type BacktestTrade = {
  entryTime: number; exitTime: number; entryPrice: number; exitPrice: number; quantity: number;
  grossPnl: number; fees: number; netPnl: number; returnPct: number;
  reason: "signal" | "stop_loss" | "take_profit" | "trailing_stop" | "end_of_data";
};
export type BacktestEquityPoint = {
  time: number; equity: number; cash: number; unrealizedPnl: number; realizedPnl: number; drawdownPct: number;
};
export type BacktestResult = {
  initialCapital: number; finalEquity: number; netReturnPct: number; annualizedReturnPct: number;
  volatilityPct: number; downsideDeviationPct: number; sharpeRatio: number; sortinoRatio: number;
  maxDrawdownPct: number; recoveryFactor: number; expectancy: number; avgWin: number; avgLoss: number;
  largestWin: number; largestLoss: number; avgTradeDurationSeconds: number; consecutiveWins: number;
  consecutiveLosses: number; riskRewardRatio: number; calmarRatio: number; winRatePct: number;
  profitFactor: number; trades: BacktestTrade[]; equityCurve: BacktestEquityPoint[];
};

const executionPrice = (price: number, side: "buy" | "sell", slippageBps: number) =>
  side === "buy" ? price * (1 + slippageBps / 10_000) : price * (1 - slippageBps / 10_000);
const mean = (values: number[]) => values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
const stdev = (values: number[]) => {
  if (values.length < 2) return 0;
  const avg = mean(values);
  return Math.sqrt(mean(values.map((v) => (v - avg) ** 2)));
};
const median = (values: number[]) => {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
};
const maxDrawdownPct = (curve: BacktestEquityPoint[]) => {
  let peak = curve[0]?.equity ?? 0;
  let max = 0;
  for (const point of curve) {
    peak = Math.max(peak, point.equity);
    if (peak > 0) max = Math.max(max, ((peak - point.equity) / peak) * 100);
  }
  return max;
};
const maxConsecutive = (trades: BacktestTrade[], positive: boolean) => {
  let current = 0, best = 0;
  for (const trade of trades) {
    if ((trade.netPnl > 0) === positive) { current += 1; best = Math.max(best, current); }
    else current = 0;
  }
  return best;
};

export function runBacktest(definition: StrategyDefinition, inputBars: StrategyBar[], config: BacktestConfig): BacktestResult {
  const bars = inputBars.slice(-(config.maxBars ?? inputBars.length));
  const initialCapital = config.initialCapital;
  const feeBps = config.feeBps ?? 0;
  const slippageBps = config.slippageBps ?? 0;
  if (initialCapital <= 0) throw new Error("Initial capital must be greater than zero.");
  if (bars.length < 30) throw new Error("At least 30 bars are required for the strategy indicators.");
  if (feeBps < 0 || slippageBps < 0) throw new Error("Fees and slippage cannot be negative.");

  let cash = initialCapital, quantity = 0, entryPrice = 0, entryTime = 0;
  let stopPrice = 0, takeProfitPrice = 0, trailingStopPrice = 0, highestPrice = 0, realizedPnl = 0;
  const trades: BacktestTrade[] = [];
  const equityCurve: BacktestEquityPoint[] = [];

  const recordEquity = (time: number, markPrice: number) => {
    const unrealizedPnl = quantity > 0 ? (markPrice - entryPrice) * quantity : 0;
    const equity = cash + quantity * markPrice;
    const peak = equityCurve.reduce((max, point) => Math.max(max, point.equity), initialCapital);
    const drawdownPct = peak > 0 ? Math.max(0, ((peak - equity) / peak) * 100) : 0;
    equityCurve.push({ time, equity, cash, unrealizedPnl, realizedPnl, drawdownPct });
  };

  for (let index = 29; index < bars.length; index += 1) {
    const bar = bars[index];
    const evaluation = evaluateStrategy(definition, bars.slice(0, index + 1));

    if (quantity === 0 && evaluation.entry) {
      const price = executionPrice(bar.close, "buy", slippageBps);
      const riskAmount = cash * (definition.riskPerTradePct / 100);
      const stopDistance = definition.stopLossPct > 0 ? price * definition.stopLossPct / 100 : 0;
      const riskDistance = definition.positionSizing === "volatility_adjusted"
        ? Math.max(price * 0.005, stopDistance) : stopDistance;
      const riskQuantity = riskDistance > 0 ? riskAmount / riskDistance : cash / price;
      const desiredQuantity = definition.positionSizing === "fixed" ? cash / price : riskQuantity;
      quantity = Math.max(0, Math.min(desiredQuantity, cash / price));
      if (quantity > 0) {
        entryPrice = price; entryTime = bar.time; highestPrice = bar.high;
        stopPrice = definition.stopLossPct > 0 ? price * (1 - definition.stopLossPct / 100) : 0;
        takeProfitPrice = definition.takeProfitPct > 0 ? price * (1 + definition.takeProfitPct / 100) : 0;
        trailingStopPrice = definition.trailingStopPct > 0 ? highestPrice * (1 - definition.trailingStopPct / 100) : 0;
        cash -= quantity * price;
      }
    }

    if (quantity > 0) {
      highestPrice = Math.max(highestPrice, bar.high);
      if (definition.trailingStopPct > 0) {
        trailingStopPrice = Math.max(trailingStopPrice, highestPrice * (1 - definition.trailingStopPct / 100));
      }
      let exitReason: BacktestTrade["reason"] | null = null;
      let exitMarketPrice = bar.close;
      if (stopPrice > 0 && bar.low <= stopPrice) { exitReason = "stop_loss"; exitMarketPrice = stopPrice; }
      else if (trailingStopPrice > 0 && bar.low <= trailingStopPrice) { exitReason = "trailing_stop"; exitMarketPrice = trailingStopPrice; }
      else if (takeProfitPrice > 0 && bar.high >= takeProfitPrice) { exitReason = "take_profit"; exitMarketPrice = takeProfitPrice; }
      else if (evaluation.exit) { exitReason = "signal"; }
      else if (index === bars.length - 1) { exitReason = "end_of_data"; }

      if (exitReason) {
        const price = executionPrice(exitMarketPrice, "sell", slippageBps);
        const grossPnl = (price - entryPrice) * quantity;
        const fees = ((entryPrice + price) * quantity) * feeBps / 10_000;
        const netPnl = grossPnl - fees;
        cash += quantity * price - fees; realizedPnl += netPnl;
        trades.push({
          entryTime, exitTime: bar.time, entryPrice, exitPrice: price, quantity, grossPnl, fees, netPnl,
          returnPct: entryPrice > 0 ? ((price - entryPrice) / entryPrice) * 100 : 0, reason: exitReason,
        });
        quantity = 0; entryPrice = 0; entryTime = 0; stopPrice = 0; takeProfitPrice = 0;
        trailingStopPrice = 0; highestPrice = 0;
      }
    }
    recordEquity(bar.time, bar.close);
  }

  const finalEquity = equityCurve.at(-1)?.equity ?? initialCapital;
  const durationMs = Math.max(1, (equityCurve.at(-1)?.time ?? 0) - (equityCurve[0]?.time ?? 0));
  const years = durationMs / (365.25 * 24 * 60 * 60 * 1000);
  const annualizedReturnPct = years > 0 ? ((finalEquity / initialCapital) ** (1 / years) - 1) * 100 : 0;
  const periodicReturns = equityCurve.slice(1).flatMap((point, i) => equityCurve[i].equity > 0 ? [point.equity / equityCurve[i].equity - 1] : []);
  const intervalSeconds = median(equityCurve.slice(1).map((point, i) => Math.max(1, (point.time - equityCurve[i].time) / 1000)));
  const periodsPerYear = intervalSeconds > 0 ? (365.25 * 24 * 60 * 60) / intervalSeconds : 1;
  const volatility = stdev(periodicReturns) * Math.sqrt(Math.max(1, periodsPerYear));
  const downside = stdev(periodicReturns.map((value) => Math.min(value, 0))) * Math.sqrt(Math.max(1, periodsPerYear));
  const averageReturn = mean(periodicReturns);
  const sharpeRatio = volatility > 0 ? averageReturn * periodsPerYear / volatility : 0;
  const sortinoRatio = downside > 0 ? averageReturn * periodsPerYear / downside : 0;
  const winners = trades.filter((trade) => trade.netPnl > 0), losers = trades.filter((trade) => trade.netPnl < 0);
  const grossProfit = winners.reduce((sum, trade) => sum + trade.netPnl, 0);
  const grossLoss = Math.abs(losers.reduce((sum, trade) => sum + trade.netPnl, 0));
  const maxDd = maxDrawdownPct(equityCurve), avgWin = mean(winners.map((trade) => trade.netPnl));
  const avgLoss = mean(losers.map((trade) => Math.abs(trade.netPnl))), netProfit = finalEquity - initialCapital;

  return {
    initialCapital, finalEquity, netReturnPct: ((finalEquity - initialCapital) / initialCapital) * 100,
    annualizedReturnPct: Number.isFinite(annualizedReturnPct) ? annualizedReturnPct : 0,
    volatilityPct: volatility * 100, downsideDeviationPct: downside * 100,
    sharpeRatio: Number.isFinite(sharpeRatio) ? sharpeRatio : 0,
    sortinoRatio: Number.isFinite(sortinoRatio) ? sortinoRatio : 0, maxDrawdownPct: maxDd,
    recoveryFactor: maxDd > 0 ? netProfit / (initialCapital * maxDd / 100) : 0,
    expectancy: mean(trades.map((trade) => trade.netPnl)), avgWin, avgLoss,
    largestWin: winners.length ? Math.max(...winners.map((trade) => trade.netPnl)) : 0,
    largestLoss: losers.length ? Math.min(...losers.map((trade) => trade.netPnl)) : 0,
    avgTradeDurationSeconds: mean(trades.map((trade) => (trade.exitTime - trade.entryTime) / 1000)),
    consecutiveWins: maxConsecutive(trades, true), consecutiveLosses: maxConsecutive(trades, false),
    riskRewardRatio: avgLoss > 0 ? avgWin / avgLoss : 0,
    calmarRatio: maxDd > 0 ? annualizedReturnPct / maxDd : 0,
    winRatePct: trades.length ? winners.length / trades.length * 100 : 0,
    profitFactor: grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0,
    trades, equityCurve,
  };
}
