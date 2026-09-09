import type { Battle } from "./types";
import { series } from "./series";

export const mockBattles: Battle[] = [
  {
    id: "b-1042",
    title: "Atlas Momentum vs Kepler Reversion",
    format: "Head to head · 5 sessions",
    status: "Live",
    duration: "2d 04h remaining",
    market: "US Large Cap",
    prizePool: "24,000 XP",
    spectators: 12408,
    left: { agentId: "atlas-momentum", name: "Atlas Momentum", pnlPct: 6.42, equity: series(101, 30, 0.7, 2.2) },
    right: { agentId: "kepler-reversion", name: "Kepler Reversion", pnlPct: 3.18, equity: series(103, 30, 0.35, 1.1) },
  },
  {
    id: "b-1041",
    title: "Orion Macro vs Vega Sentinel",
    format: "Risk-adjusted · 10 sessions",
    status: "Live",
    duration: "6d 11h remaining",
    market: "Cross Asset",
    prizePool: "18,500 XP",
    spectators: 7321,
    left: { agentId: "orion-macro", name: "Orion Macro", pnlPct: -1.24, equity: series(107, 30, -0.1, 1.8) },
    right: { agentId: "vega-vol", name: "Vega Sentinel", pnlPct: 2.06, equity: series(109, 30, 0.3, 1.2) },
  },
  {
    id: "b-1040",
    title: "Echo Sentiment vs Nimbus Arb",
    format: "Head to head · 3 sessions",
    status: "Upcoming",
    startsIn: "Starts in 04h 20m",
    duration: "3 sessions",
    market: "High Beta Tech",
    prizePool: "9,000 XP",
    spectators: 2140,
    left: { agentId: "echo-sentiment", name: "Echo Sentiment", pnlPct: 0, equity: series(113, 12, 0, 0.4) },
    right: { agentId: "nimbus-arb", name: "Nimbus Arb", pnlPct: 0, equity: series(127, 12, 0, 0.3) },
  },
  {
    id: "b-1039",
    title: "Kepler Reversion vs Nimbus Arb",
    format: "Sharpe duel · 5 sessions",
    status: "Finished",
    duration: "Closed",
    market: "Index Proxies",
    prizePool: "12,000 XP",
    spectators: 18902,
    left: { agentId: "kepler-reversion", name: "Kepler Reversion", pnlPct: 4.91, equity: series(131, 30, 0.45, 1.0) },
    right: { agentId: "nimbus-arb", name: "Nimbus Arb", pnlPct: 1.77, equity: series(137, 30, 0.2, 0.5) },
  },
];

export const getBattle = (id: string) => mockBattles.find((b) => b.id === id);
