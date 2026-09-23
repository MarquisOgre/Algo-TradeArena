import type { Strategy, StrategyVersion } from "./types";

const STORAGE_KEY = "alphentra.strategies.v1";

const now = () => new Date().toISOString();

const makeId = (prefix: string) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const seedStrategies: Strategy[] = [
  {
    id: "atlas-momentum",
    name: "Atlas Momentum",
    description: "Confirmed breakout strategy with volatility-aware position sizing.",
    style: "Momentum",
    status: "Published",
    creator: "Nova Labs",
    createdAt: "2026-08-20T08:00:00.000Z",
    updatedAt: "2026-09-18T08:00:00.000Z",
    followers: 1248,
    activeVersionId: "atlas-momentum-v3",
    versions: [{
      id: "atlas-momentum-v3",
      version: 3,
      createdAt: "2026-09-18T08:00:00.000Z",
      specification: "20-day breakout confirmation with three-tranche entries and a 10-day trailing exit.",
      markets: ["US Equities"],
      riskLimit: 1,
    }],
    backtest: { returnPct: 18.4, maxDrawdownPct: -8.6, winRatePct: 61.4, sharpe: 1.72, trades: 184 },
    tags: ["Momentum", "Breakout", "Risk Managed"],
  },
  {
    id: "kepler-reversion",
    name: "Kepler Reversion",
    description: "Mean-reversion strategy targeting statistical dislocations.",
    style: "Mean Reversion",
    status: "Published",
    creator: "Helio Quant",
    createdAt: "2026-08-14T08:00:00.000Z",
    updatedAt: "2026-09-17T08:00:00.000Z",
    followers: 834,
    activeVersionId: "kepler-reversion-v2",
    versions: [{
      id: "kepler-reversion-v2",
      version: 2,
      createdAt: "2026-09-17T08:00:00.000Z",
      specification: "Two-sigma dislocation entries against a 60-day mean with volatility-scaled sizing.",
      markets: ["US Equities", "ETFs"],
      riskLimit: 0.75,
    }],
    backtest: { returnPct: 14.7, maxDrawdownPct: -5.2, winRatePct: 68.1, sharpe: 1.94, trades: 221 },
    tags: ["Mean Reversion", "Statistical", "Low Risk"],
  },
];

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function getStrategies(): Strategy[] {
  if (!canUseStorage()) return seedStrategies;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seedStrategies));
      return seedStrategies;
    }
    return JSON.parse(raw) as Strategy[];
  } catch {
    return seedStrategies;
  }
}

export function getStrategy(id: string) {
  return getStrategies().find((strategy) => strategy.id === id);
}

export function saveStrategy(input: {
  name: string;
  description: string;
  style?: Strategy["style"];
  specification: string;
  markets?: string[];
  riskLimit?: number;
  status?: Strategy["status"];
  backtest?: Strategy["backtest"];
  definition?: Record<string, unknown>;
}) {
  const strategies = getStrategies();
  const timestamp = now();
  const version: StrategyVersion = {
    id: makeId("version"),
    version: 1,
    createdAt: timestamp,
    specification: input.specification,
    markets: input.markets ?? ["Forex"],
    riskLimit: input.riskLimit ?? 1,
    definition: input.definition,
  };
  const strategy: Strategy = {
    id: makeId("strategy"),
    name: input.name.trim() || "Untitled Strategy",
    description: input.description,
    style: input.style ?? "Momentum",
    status: input.status ?? "Draft",
    creator: "Marquis Ogre",
    createdAt: timestamp,
    updatedAt: timestamp,
    followers: 0,
    versions: [version],
    activeVersionId: version.id,
    backtest: input.backtest,
    tags: ["Prototype"],
  };
  const next = [strategy, ...strategies];
  if (canUseStorage()) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return strategy;
}

export function updateStrategyStatus(id: string, status: Strategy["status"]) {
  const strategies = getStrategies().map((strategy) =>
    strategy.id === id ? { ...strategy, status, updatedAt: now() } : strategy,
  );
  if (canUseStorage()) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(strategies));
  return strategies.find((strategy) => strategy.id === id);
}
