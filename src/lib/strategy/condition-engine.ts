export type StrategyBar = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
};

export type StrategySignal = "BUY" | "SELL" | "HOLD";

export type EngineCondition = {
  indicator: string;
  period?: number;
  comparator: string;
  value: string | number;
};

export type EngineRuleGroup = {
  operator: "AND" | "OR";
  conditions: EngineCondition[];
};

export type StrategyDefinition = {
  entry: EngineRuleGroup;
  exit: EngineRuleGroup;
  stopLossPct: number;
  takeProfitPct: number;
  trailingStopPct: number;
  riskPerTradePct: number;
  positionSizing: "fixed" | "risk_percent" | "volatility_adjusted";
};

export type StrategyEvaluation = {
  entry: boolean;
  exit: boolean;
  signal: StrategySignal;
  diagnostics: string[];
};

const EPSILON = 1e-10;

function closes(bars: StrategyBar[]) {
  return bars.map((bar) => bar.close);
}

function sma(values: number[], period: number) {
  if (period <= 0 || values.length < period) return null;
  const slice = values.slice(-period);
  return slice.reduce((sum, value) => sum + value, 0) / period;
}

function ema(values: number[], period: number) {
  if (period <= 0 || values.length < period) return null;
  const seed = sma(values.slice(0, period), period);
  if (seed === null) return null;
  const multiplier = 2 / (period + 1);
  let result = seed;
  for (let i = period; i < values.length; i += 1) {
    result = (values[i] - result) * multiplier + result;
  }
  return result;
}

function rsi(values: number[], period: number) {
  if (period <= 0 || values.length <= period) return null;
  let gains = 0;
  let losses = 0;
  for (let i = 1; i <= period; i += 1) {
    const change = values[i] - values[i - 1];
    if (change >= 0) gains += change;
    else losses -= change;
  }
  let averageGain = gains / period;
  let averageLoss = losses / period;
  for (let i = period + 1; i < values.length; i += 1) {
    const change = values[i] - values[i - 1];
    const gain = Math.max(change, 0);
    const loss = Math.max(-change, 0);
    averageGain = (averageGain * (period - 1) + gain) / period;
    averageLoss = (averageLoss * (period - 1) + loss) / period;
  }
  if (averageLoss < EPSILON) return 100;
  return 100 - 100 / (1 + averageGain / averageLoss);
}

function atr(bars: StrategyBar[], period: number) {
  if (period <= 0 || bars.length <= period) return null;
  const ranges: number[] = [];
  for (let i = 1; i < bars.length; i += 1) {
    ranges.push(Math.max(
      bars[i].high - bars[i].low,
      Math.abs(bars[i].high - bars[i - 1].close),
      Math.abs(bars[i].low - bars[i - 1].close),
    ));
  }
  return sma(ranges, period);
}

function macd(values: number[]) {
  const fast = ema(values, 12);
  const slow = ema(values, 26);
  return fast === null || slow === null ? null : fast - slow;
}

function readIndicator(expression: string | number, bars: StrategyBar[]): number | null {
  if (typeof expression === "number") return expression;
  const text = expression.trim().toUpperCase();
  const numeric = Number(text);
  if (Number.isFinite(numeric)) return numeric;

  const match = text.match(/^([A-Z_]+)(?:\((\d+)\))?$/);
  if (!match) return null;
  const name = match[1];
  const period = Number(match[2] ?? 20);
  const values = closes(bars);
  switch (name) {
    case "PRICE":
    case "CLOSE":
      return bars.at(-1)?.close ?? null;
    case "OPEN":
      return bars.at(-1)?.open ?? null;
    case "HIGH":
      return bars.at(-1)?.high ?? null;
    case "LOW":
      return bars.at(-1)?.low ?? null;
    case "VOLUME":
      return bars.at(-1)?.volume ?? null;
    case "SMA":
      return sma(values, period);
    case "EMA":
      return ema(values, period);
    case "RSI":
      return rsi(values, period);
    case "ATR":
      return atr(bars, period);
    case "MACD":
      return macd(values);
    default:
      return null;
  }
}

function evaluateComparator(comparator: string, left: number, right: number, previousLeft?: number | null, previousRight?: number | null) {
  switch (comparator) {
    case "gt": return left > right;
    case "gte": return left >= right;
    case "lt": return left < right;
    case "lte": return left <= right;
    case "eq": return Math.abs(left - right) <= EPSILON;
    case "neq": return Math.abs(left - right) > EPSILON;
    case "crosses_above":
      return previousLeft !== null && previousLeft !== undefined && previousRight !== null && previousRight !== undefined
        && previousLeft <= previousRight && left > right;
    case "crosses_below":
      return previousLeft !== null && previousLeft !== undefined && previousRight !== null && previousRight !== undefined
        && previousLeft >= previousRight && left < right;
    case "between":
      return left >= Math.min(left, right) && left <= Math.max(left, right);
    default:
      return false;
  }
}

function evaluateCondition(condition: EngineCondition, bars: StrategyBar[]) {
  if (bars.length === 0) return { matched: false, reason: "No market bars available." };

  const period = condition.period ?? 20;
  const left = readIndicator(
    condition.indicator + (condition.indicator.match(/\(\d+\)$/) ? "" : period ? `(${period})` : ""),
    bars,
  );
  const right = readIndicator(condition.value, bars);
  if (left === null || right === null) {
    return { matched: false, reason: `Insufficient data or unsupported indicator: ${condition.indicator} ${condition.comparator} ${condition.value}.` };
  }

  const previousBars = bars.slice(0, -1);
  const previousLeft = previousBars.length ? readIndicator(
    condition.indicator + (condition.indicator.match(/\(\d+\)$/) ? "" : `(${period})`),
    previousBars,
  ) : null;
  const previousRight = previousBars.length ? readIndicator(condition.value, previousBars) : null;

  return {
    matched: evaluateComparator(condition.comparator, left, right, previousLeft, previousRight),
    reason: `${condition.indicator} ${condition.comparator} ${condition.value}: ${left.toFixed(6)} vs ${right.toFixed(6)}`,
  };
}

export function evaluateConditionGroup(group: EngineRuleGroup, bars: StrategyBar[]) {
  const results = group.conditions.map((condition) => evaluateCondition(condition, bars));
  const matched = group.operator === "AND"
    ? results.length > 0 && results.every((result) => result.matched)
    : results.some((result) => result.matched);

  return {
    matched,
    diagnostics: results.map((result) => result.reason),
  };
}

export function evaluateStrategy(definition: StrategyDefinition, bars: StrategyBar[]): StrategyEvaluation {
  const entry = evaluateConditionGroup(definition.entry, bars);
  const exit = evaluateConditionGroup(definition.exit, bars);
  const diagnostics = [...entry.diagnostics, ...exit.diagnostics];

  return {
    entry: entry.matched,
    exit: exit.matched,
    signal: exit.matched ? "SELL" : entry.matched ? "BUY" : "HOLD",
    diagnostics,
  };
}

type RuleBuilderDefinition = {
  entryOperator: "AND" | "OR";
  entry: EngineCondition[];
  exitOperator: "AND" | "OR";
  exit: EngineCondition[];
  stopLossPct: number;
  takeProfitPct: number;
  trailingStopPct: number;
  riskPerTradePct: number;
  positionSizing: "fixed" | "risk_percent" | "volatility_adjusted";
};

export function validateStrategyDefinition(definition: StrategyDefinition | RuleBuilderDefinition) {
  const errors: string[] = [];
  if (!definition || typeof definition !== "object") {
    return { valid: false, errors: ["Strategy definition is missing."] };
  }

  const candidate = definition as StrategyDefinition & Partial<RuleBuilderDefinition>;
  const entryConditions = Array.isArray(candidate.entry)
    ? candidate.entry
    : Array.isArray(candidate.entry?.conditions)
      ? candidate.entry.conditions
      : [];
  const exitConditions = Array.isArray(candidate.exit)
    ? candidate.exit
    : Array.isArray(candidate.exit?.conditions)
      ? candidate.exit.conditions
      : [];

  if (entryConditions.length === 0) errors.push("At least one entry condition is required.");
  if (exitConditions.length === 0) errors.push("At least one exit condition is required.");

  if (!Number.isFinite(candidate.riskPerTradePct) || candidate.riskPerTradePct <= 0 || candidate.riskPerTradePct > 10) {
    errors.push("Risk per trade must be greater than 0% and no more than 10%.");
  }
  if (!Number.isFinite(candidate.stopLossPct) || candidate.stopLossPct < 0 || candidate.stopLossPct > 50) {
    errors.push("Stop loss must be between 0% and 50%.");
  }
  if (!Number.isFinite(candidate.takeProfitPct) || candidate.takeProfitPct < 0 || candidate.takeProfitPct > 100) {
    errors.push("Take profit must be between 0% and 100%.");
  }
  if (!Number.isFinite(candidate.trailingStopPct) || candidate.trailingStopPct < 0 || candidate.trailingStopPct > 50) {
    errors.push("Trailing stop must be between 0% and 50%.");
  }

  for (const condition of [...entryConditions, ...exitConditions]) {
    if (!condition || typeof condition !== "object") {
      errors.push("Every condition must be a valid object.");
      continue;
    }
    if (typeof condition.indicator !== "string" || !condition.indicator.trim()) {
      errors.push("Every condition requires an indicator.");
    }
    if (typeof condition.comparator !== "string" || !condition.comparator.trim()) {
      errors.push("Every condition requires a comparator.");
    }
    if (condition.period !== undefined && (!Number.isInteger(condition.period) || condition.period <= 0)) {
      errors.push("Indicator periods must be positive whole numbers.");
    }
    if (condition.value === undefined || condition.value === null || String(condition.value).trim() === "") {
      errors.push("Every condition requires a comparison value.");
    }
  }

  return { valid: errors.length === 0, errors };
}
