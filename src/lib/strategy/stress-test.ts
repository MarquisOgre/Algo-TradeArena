import { loadStrategyBacktestBars } from "./historical-backtest-v2";
import { runBacktest, type BacktestResult } from "./backtest-engine-v2";
import type { StrategyDefinition } from "./condition-engine";

export type StressScenario = {
  id: "cost_shock" | "slippage_shock" | "volatility_shock" | "adverse_drift";
  name: string;
  description: string;
  result: BacktestResult;
  deltaReturnPct: number;
  deltaDrawdownPct: number;
};

export type StressTestResult = {
  baseline: BacktestResult;
  scenarios: StressScenario[];
};

function applyVolatilityShock(bars: Awaited<ReturnType<typeof loadStrategyBacktestBars>>, multiplier: number) {
  return bars.map((bar) => {
    const open = bar.open;
    const close = open + (bar.close - open) * multiplier;
    const high = open + (bar.high - open) * multiplier;
    const low = open + (bar.low - open) * multiplier;
    return { ...bar, close, high: Math.max(open, high, close), low: Math.min(open, low, close) };
  });
}

function applyAdverseDrift(bars: Awaited<ReturnType<typeof loadStrategyBacktestBars>>, driftPerBar: number) {
  return bars.map((bar, index) => {
    const factor = Math.max(0.75, 1 - driftPerBar * index);
    return {
      ...bar,
      open: bar.open * factor,
      high: bar.high * factor,
      low: bar.low * factor,
      close: bar.close * factor,
    };
  });
}

export async function runStrategyStressTest(input: {
  definition: StrategyDefinition;
  marketId: string;
  timeframe: "5m" | "15m" | "1h" | "4h" | "1d";
  initialCapital: number;
  maxBars: number;
}): Promise<StressTestResult> {
  const bars = await loadStrategyBacktestBars(input.marketId, input.timeframe, input.maxBars);
  if (bars.length < 30) throw new Error("At least 30 MT5 historical bars are required for stress testing.");

  const baseConfig = { initialCapital: input.initialCapital, feeBps: 2, slippageBps: 1, maxBars: input.maxBars };
  const baseline = runBacktest(input.definition, bars, baseConfig);
  const cases: Array<{
    id: StressScenario["id"]; name: string; description: string;
    bars: typeof bars; feeBps: number; slippageBps: number;
  }> = [
    { id: "cost_shock", name: "Fee shock", description: "Trading costs increase from 2 bps to 8 bps.", bars, feeBps: 8, slippageBps: 1 },
    { id: "slippage_shock", name: "Slippage shock", description: "Execution slippage increases from 1 bps to 8 bps.", bars, feeBps: 2, slippageBps: 8 },
    { id: "volatility_shock", name: "Volatility shock", description: "Intrabar movement is amplified by 50%.", bars: applyVolatilityShock(bars, 1.5), feeBps: 2, slippageBps: 3 },
    { id: "adverse_drift", name: "Adverse drift", description: "A deterministic adverse drift is applied across the test path.", bars: applyAdverseDrift(bars, 0.0001), feeBps: 2, slippageBps: 3 },
  ];

  const scenarios = cases.map((scenario) => {
    const result = runBacktest(input.definition, scenario.bars, {
      ...baseConfig, feeBps: scenario.feeBps, slippageBps: scenario.slippageBps,
    });
    return {
      id: scenario.id, name: scenario.name, description: scenario.description, result,
      deltaReturnPct: result.netReturnPct - baseline.netReturnPct,
      deltaDrawdownPct: result.maxDrawdownPct - baseline.maxDrawdownPct,
    };
  });

  return { baseline, scenarios };
}
