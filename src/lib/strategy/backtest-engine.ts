import {
  evaluateStrategy,
  type StrategyBar,
  type StrategyDefinition,
} from "./condition-engine";

export type BacktestConfig = {
  initialCapital: number;
  feeBps?: number;
  slippageBps?: number;
  maxBars?: number;
};

export type BacktestTrade = {
  entryTime: number;
  exitTime: number;
  entryPrice: number;
  exitPrice: number;
  quantity: number;
  grossPnl: number;
  fees: number;
  netPnl: number;
  returnPct: number;
  reason: "signal" | "stop_loss" | "take_profit" | "end_of_data";
};

export type BacktestResult = {
  initialCapital: number;
  finalEquity: number;
  netReturnPct: number;
  maxDrawdownPct: number;
  winRatePct: number;
  profitFactor: number;
  trades: BacktestTrade[];
  equityCurve: Array<{ time: number; equity: number }>;
};

function executionPrice(price: number, side: "buy" | "sell", slippageBps: number) {
  const adjustment = price * (slippageBps / 10_000);
  return side === "buy" ? price + adjustment : price - adjustment;
}

function maxDrawdownPct(equityCurve: Array<{ equity: number }>) {
  let peak = equityCurve[0]?.equity ?? 0;
  let maxDrawdown = 0;
  for (const point of equityCurve) {
    peak = Math.max(peak, point.equity);
    if (peak > 0) maxDrawdown = Math.max(maxDrawdown, ((peak - point.equity) / peak) * 100);
  }
  return maxDrawdown;
}

export function runBacktest(
  definition: StrategyDefinition,
  inputBars: StrategyBar[],
  config: BacktestConfig,
): BacktestResult {
  const bars = inputBars.slice(-(config.maxBars ?? inputBars.length));
  const initialCapital = config.initialCapital;
  const feeBps = config.feeBps ?? 0;
  const slippageBps = config.slippageBps ?? 0;

  if (initialCapital <= 0) throw new Error("Initial capital must be greater than zero.");
  if (bars.length < 30) throw new Error("At least 30 bars are required for the strategy indicators.");

  let cash = initialCapital;
  let quantity = 0;
  let entryPrice = 0;
  let entryTime = 0;
  let stopPrice = 0;
  let takeProfitPrice = 0;
  const trades: BacktestTrade[] = [];
  const equityCurve: Array<{ time: number; equity: number }> = [];

  const recordEquity = (time: number, markPrice: number) => {
    const equity = cash + quantity * markPrice;
    equityCurve.push({ time, equity });
  };

  for (let index = 29; index < bars.length; index += 1) {
    const bar = bars[index];
    const history = bars.slice(0, index + 1);
    const evaluation = evaluateStrategy(definition, history);

    if (quantity === 0 && evaluation.entry) {
      const price = executionPrice(bar.close, "buy", slippageBps);
      const riskAmount = cash * (definition.riskPerTradePct / 100);
      const stopDistance = definition.stopLossPct > 0 ? price * (definition.stopLossPct / 100) : 0;
      const riskQuantity = stopDistance > 0 ? riskAmount / stopDistance : cash / price;
      quantity = Math.max(0, Math.min(riskQuantity, cash / price));
      entryPrice = price;
      entryTime = bar.time;
      stopPrice = definition.stopLossPct > 0 ? price * (1 - definition.stopLossPct / 100) : 0;
      takeProfitPrice = definition.takeProfitPct > 0 ? price * (1 + definition.takeProfitPct / 100) : 0;
      cash -= quantity * price;
    }

    if (quantity > 0) {
      let exitReason: BacktestTrade["reason"] | null = null;
      let exitMarketPrice = bar.close;

      if (stopPrice > 0 && bar.low <= stopPrice) {
        exitReason = "stop_loss";
        exitMarketPrice = stopPrice;
      } else if (takeProfitPrice > 0 && bar.high >= takeProfitPrice) {
        exitReason = "take_profit";
        exitMarketPrice = takeProfitPrice;
      } else if (evaluation.exit) {
        exitReason = "signal";
        exitMarketPrice = bar.close;
      } else if (index === bars.length - 1) {
        exitReason = "end_of_data";
        exitMarketPrice = bar.close;
      }

      if (exitReason) {
        const price = executionPrice(exitMarketPrice, "sell", slippageBps);
        const grossPnl = (price - entryPrice) * quantity;
        const turnover = (entryPrice + price) * quantity;
        const fees = turnover * (feeBps / 10_000);
        const netPnl = grossPnl - fees;
        cash += quantity * price - fees;
        trades.push({
          entryTime,
          exitTime: bar.time,
          entryPrice,
          exitPrice: price,
          quantity,
          grossPnl,
          fees,
          netPnl,
          returnPct: entryPrice > 0 ? ((price - entryPrice) / entryPrice) * 100 : 0,
          reason: exitReason,
        });
        quantity = 0;
        entryPrice = 0;
        entryTime = 0;
        stopPrice = 0;
        takeProfitPrice = 0;
      }
    }

    recordEquity(bar.time, bar.close);
  }

  const finalEquity = equityCurve.at(-1)?.equity ?? initialCapital;
  const winners = trades.filter((trade) => trade.netPnl > 0);
  const grossProfit = winners.reduce((sum, trade) => sum + trade.netPnl, 0);
  const grossLoss = Math.abs(trades.filter((trade) => trade.netPnl < 0).reduce((sum, trade) => sum + trade.netPnl, 0));

  return {
    initialCapital,
    finalEquity,
    netReturnPct: ((finalEquity - initialCapital) / initialCapital) * 100,
    maxDrawdownPct: maxDrawdownPct(equityCurve),
    winRatePct: trades.length ? (winners.length / trades.length) * 100 : 0,
    profitFactor: grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0,
    trades,
    equityCurve,
  };
}
