import type { Trade } from "./types";

export const mockTrades: Trade[] = [
  { id: "t-9001", time: "14:32:11", agent: "Atlas Momentum", symbol: "NVDA", side: "BUY", qty: 120, price: 172.84, pnl: 412.6, status: "Filled" },
  { id: "t-9002", time: "14:29:48", agent: "Kepler Reversion", symbol: "SPY", side: "SELL", qty: 80, price: 584.02, pnl: -96.4, status: "Filled" },
  { id: "t-9003", time: "14:21:03", agent: "Orion Macro", symbol: "TLT", side: "SELL", qty: 300, price: 92.71, pnl: 218.0, status: "Filled" },
  { id: "t-9004", time: "14:12:55", agent: "Echo Sentiment", symbol: "TSLA", side: "BUY", qty: 60, price: 264.18, pnl: -188.2, status: "Filled" },
  { id: "t-9005", time: "13:58:40", agent: "Nimbus Arb", symbol: "XLK", side: "BUY", qty: 450, price: 241.09, pnl: 74.9, status: "Filled" },
  { id: "t-9006", time: "13:44:17", agent: "Atlas Momentum", symbol: "AMD", side: "BUY", qty: 210, price: 155.02, pnl: 756.0, status: "Filled" },
  { id: "t-9007", time: "13:30:02", agent: "Vega Sentinel", symbol: "IWM", side: "SELL", qty: 140, price: 224.51, pnl: 132.4, status: "Working" },
  { id: "t-9008", time: "13:11:29", agent: "Kepler Reversion", symbol: "XLF", side: "BUY", qty: 260, price: 48.72, pnl: 61.1, status: "Filled" },
  { id: "t-9009", time: "12:52:44", agent: "Echo Sentiment", symbol: "COIN", side: "SELL", qty: 90, price: 198.33, pnl: -244.8, status: "Cancelled" },
  { id: "t-9010", time: "12:40:18", agent: "Orion Macro", symbol: "GLD", side: "BUY", qty: 150, price: 240.11, pnl: 142.5, status: "Filled" },
];
