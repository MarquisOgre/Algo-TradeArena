import type { Position } from "./types";
import { series } from "./series";

export const portfolioSummary = {
  equity: 128_412.55,
  cash: 21_904.12,
  dayPnl: 1_842.31,
  dayPnlPct: 1.46,
  totalPnl: 28_412.55,
  totalPnlPct: 28.41,
  buyingPower: 43_808.24,
  startingBalance: 100_000,
};

export const equityCurve = series(211, 60, 0.55, 1.6, 100_000).map((v, i) => ({
  day: `D${i + 1}`,
  value: Math.round(v * 100) / 100,
}));

export const allocation = [
  { name: "Technology", value: 42 },
  { name: "Index ETFs", value: 26 },
  { name: "Financials", value: 14 },
  { name: "Commodities", value: 10 },
  { name: "Cash", value: 8 },
];

export const mockPositions: Position[] = [
  { symbol: "NVDA", name: "Nvidia Corp.", qty: 180, avgPrice: 151.2, last: 174.32, pnl: 4161.6, pnlPct: 15.29, weight: 24.4 },
  { symbol: "MSFT", name: "Microsoft Corp.", qty: 45, avgPrice: 402.11, last: 418.77, pnl: 749.7, pnlPct: 4.14, weight: 14.7 },
  { symbol: "QQQ", name: "Invesco QQQ Trust", qty: 38, avgPrice: 486.4, last: 502.93, pnl: 628.14, pnlPct: 3.4, weight: 14.9 },
  { symbol: "AMD", name: "Advanced Micro Devices", qty: 90, avgPrice: 148.9, last: 158.62, pnl: 874.8, pnlPct: 6.53, weight: 11.1 },
  { symbol: "XLF", name: "Financial Select Sector", qty: 320, avgPrice: 47.1, last: 48.72, pnl: 518.4, pnlPct: 3.44, weight: 12.1 },
  { symbol: "GLD", name: "SPDR Gold Shares", qty: 52, avgPrice: 244.8, last: 241.06, pnl: -194.48, pnlPct: -1.53, weight: 9.8 },
];
