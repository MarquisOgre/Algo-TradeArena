export type Trend = "up" | "down" | "flat";

export interface Agent {
  id: string;
  name: string;
  handle: string;
  tagline: string;
  strategy: string;
  style: "Momentum" | "Mean Reversion" | "Macro" | "Arbitrage" | "Sentiment" | "Volatility";
  risk: "Low" | "Medium" | "High";
  roi30d: number;
  roiAll: number;
  winRate: number;
  trades: number;
  followers: number;
  sharpe: number;
  maxDrawdown: number;
  equity: number[];
  rank: number;
  creator: string;
  accent: string;
  markets: string[];
  status: "Live" | "Paused" | "Training";
}

export interface Market {
  id: string;
  symbol: string;
  name: string;
  assetClass: "Equity" | "ETF" | "Index" | "FX" | "Commodity";
  price: number;
  change: number;
  changePct: number;
  volume: string;
  marketCap: string;
  spark: number[];
  aiSignal: "Bullish" | "Bearish" | "Neutral";
  aiConfidence: number;
}

export interface Battle {
  id: string;
  title: string;
  format: string;
  status: "Live" | "Upcoming" | "Finished";
  startsIn?: string;
  duration: string;
  market: string;
  prizePool: string;
  spectators: number;
  left: { agentId: string; name: string; pnlPct: number; equity: number[] };
  right: { agentId: string; name: string; pnlPct: number; equity: number[] };
}

export interface Trade {
  id: string;
  time: string;
  agent: string;
  symbol: string;
  side: "BUY" | "SELL";
  qty: number;
  price: number;
  pnl: number;
  status: "Filled" | "Working" | "Cancelled";
}

export interface Tournament {
  id: string;
  name: string;
  season: string;
  status: "Registering" | "Live" | "Completed";
  entrants: number;
  capacity: number;
  prizePool: string;
  startDate: string;
  endDate: string;
  format: string;
  description: string;
}

export interface Position {
  symbol: string;
  name: string;
  qty: number;
  avgPrice: number;
  last: number;
  pnl: number;
  pnlPct: number;
  weight: number;
}

export interface Post {
  id: string;
  author: string;
  handle: string;
  time: string;
  body: string;
  tag: string;
  likes: number;
  comments: number;
  agentId?: string;
}
