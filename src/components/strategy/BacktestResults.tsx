import { useEffect, useMemo, useState } from "react";
import { AlertCircle, BarChart3, Loader2, RefreshCw, TrendingDown, TrendingUp } from "lucide-react";
import { GlassCard } from "@/components/common/GlassCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { loadMarketBoard } from "@/lib/marketData";
import { runHistoricalStrategyBacktest } from "@/lib/strategy/historical-backtest";
import type { StrategyDefinition } from "@/lib/strategy/condition-engine";
import type { BacktestResult } from "@/lib/strategy/backtest-engine";
import type { Market } from "@/data/types";

const TIMEFRAMES = ["5m", "15m", "1h", "4h", "1d"] as const;
type Timeframe = typeof TIMEFRAMES[number];

export function BacktestResults({ definition }: { definition: StrategyDefinition }) {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [marketId, setMarketId] = useState("");
  const [timeframe, setTimeframe] = useState<Timeframe>("5m");
  const [capital, setCapital] = useState(100000);
  const [bars, setBars] = useState(500);
  const [result, setResult] = useState<BacktestResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshMarkets = async () => {
    setLoading(true); setError(null);
    try {
      const next = await loadMarketBoard();
      setMarkets(next);
      if (!marketId && next[0]) setMarketId(next[0].id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load the live MT5 instrument universe.");
    } finally { setLoading(false); }
  };

  useEffect(() => { void refreshMarkets(); }, []);

  const selected = markets.find((market) => market.id === marketId);
  const run = async () => {
    if (!marketId) return;
    setRunning(true); setError(null); setResult(null);
    try {
      const next = await runHistoricalStrategyBacktest(definition, marketId, timeframe, {
        initialCapital: capital,
        feeBps: 2,
        slippageBps: 1,
        maxBars: bars,
      });
      setResult(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Backtest failed.");
    } finally { setRunning(false); }
  };

  const curve = useMemo(() => result?.equityCurve ?? [], [result]);
  const minEquity = curve.length ? Math.min(...curve.map((p) => p.equity)) : capital;
  const maxEquity = curve.length ? Math.max(...curve.map((p) => p.equity)) : capital;
  const range = Math.max(1, maxEquity - minEquity);

  return (
    <div className="space-y-5">
      <GlassCard className="bg-surface/40 p-4">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            MT5 instrument
            <select value={marketId} onChange={(e) => setMarketId(e.target.value)} disabled={loading} className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm font-normal text-foreground">
              {markets.map((market) => <option key={market.id} value={market.id}>{market.symbol} — {market.name}</option>)}
            </select>
          </label>
          <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Timeframe
            <select value={timeframe} onChange={(e) => setTimeframe(e.target.value as Timeframe)} className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm font-normal text-foreground">
              {TIMEFRAMES.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
          <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Initial capital
            <input type="number" min={100} value={capital} onChange={(e) => setCapital(Number(e.target.value))} className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm font-normal text-foreground" />
          </label>
          <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Historical bars
            <input type="number" min={30} max={5000} value={bars} onChange={(e) => setBars(Number(e.target.value))} className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm font-normal text-foreground" />
          </label>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="border-primary/30 text-primary">MT5 · Live Universe</Badge>
          {selected && <span className="text-xs text-muted-foreground">Selected: {selected.symbol}</span>}
          <Button className="ml-auto" onClick={run} disabled={running || loading || !marketId}>
            {running ? <><Loader2 className="animate-spin" /> Running MT5 Backtest...</> : <><BarChart3 /> Run Real Backtest</>}
          </Button>
          <Button variant="outline" size="icon" onClick={() => void refreshMarkets()} disabled={loading} aria-label="Refresh MT5 instruments"><RefreshCw className={loading ? "animate-spin" : ""} /></Button>
        </div>
      </GlassCard>

      {error && <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive"><AlertCircle className="mr-2 inline size-4" />{error}</div>}

      {result && (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {[
              ["Net return", `${result.netReturnPct >= 0 ? "+" : ""}${result.netReturnPct.toFixed(2)}%`],
              ["Max drawdown", `-${result.maxDrawdownPct.toFixed(2)}%`],
              ["Win rate", `${result.winRatePct.toFixed(1)}%`],
              ["Profit factor", Number.isFinite(result.profitFactor) ? result.profitFactor.toFixed(2) : "∞"],
              ["Trades", String(result.trades.length)],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl border border-border bg-surface/50 p-4">
                <p className="text-xs text-muted-foreground">{label}</p><p className="num mt-2 text-2xl font-bold">{value}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-[1.5fr_0.5fr]">
            <GlassCard className="p-5">
              <div className="flex items-center justify-between"><p className="font-semibold">MT5 Equity Curve</p><span className="text-xs text-muted-foreground">{curve.length} points</span></div>
              <div className="mt-5 flex h-52 items-end gap-px rounded-lg bg-background/50 p-2">
                {curve.slice(-180).map((point, index, arr) => {
                  const h = ((point.equity - minEquity) / range) * 88 + 8;
                  return <div key={`${point.time}-${index}`} title={new Date(point.time).toLocaleString()} className="flex-1 min-w-0 rounded-t bg-primary/70" style={{ height: `${h}%` }} />;
                })}
              </div>
            </GlassCard>
            <GlassCard className="p-5">
              <p className="font-semibold">Run summary</p>
              <div className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Initial</span><span>{result.initialCapital.toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Final</span><span>{result.finalEquity.toLocaleString(undefined,{maximumFractionDigits:2})}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Winners</span><span>{result.trades.filter(t=>t.netPnl>0).length}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Losers</span><span>{result.trades.filter(t=>t.netPnl<0).length}</span></div>
              </div>
            </GlassCard>
          </div>

          <GlassCard className="overflow-hidden">
            <div className="border-b border-border p-4"><p className="font-semibold">Trade History</p></div>
            <div className="max-h-80 overflow-auto">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 bg-surface"><tr className="border-b border-border text-muted-foreground"><th className="p-3">Entry</th><th className="p-3">Exit</th><th className="p-3">Qty</th><th className="p-3">Entry</th><th className="p-3">Exit</th><th className="p-3">Net P&L</th><th className="p-3">Reason</th></tr></thead>
                <tbody>{result.trades.slice().reverse().map((trade, index) => (
                  <tr key={`${trade.entryTime}-${index}`} className="border-b border-border/60">
                    <td className="p-3">{new Date(trade.entryTime).toLocaleString()}</td><td className="p-3">{new Date(trade.exitTime).toLocaleString()}</td><td className="p-3">{trade.quantity.toFixed(4)}</td><td className="p-3">{trade.entryPrice.toFixed(5)}</td><td className="p-3">{trade.exitPrice.toFixed(5)}</td>
                    <td className={`p-3 font-semibold ${trade.netPnl >= 0 ? "text-success" : "text-destructive"}`}>{trade.netPnl >= 0 ? "+" : ""}{trade.netPnl.toFixed(2)}</td><td className="p-3"><Badge variant="outline">{trade.reason.replace("_"," ")}</Badge></td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
            {!result.trades.length && <div className="p-6 text-center text-sm text-muted-foreground">No trades were generated by these rules over the selected MT5 history.</div>}
          </GlassCard>
        </>
      )}
    </div>
  );
}
