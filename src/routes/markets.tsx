import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/common/PageHeader";
import { GlassCard } from "@/components/common/GlassCard";
import { DataTable, type Column } from "@/components/common/DataTable";
import { Sparkline } from "@/components/common/Sparkline";
import { Delta } from "@/components/common/Delta";
import { Button } from "@/components/ui/button";
import type { Market } from "@/data/types";
import { cn } from "@/lib/utils";
import { getMarketCalendarLabel, getMarketSessions } from "@/lib/marketCalendar";
import { loadMarketBoard, subscribeToMarketQuotes } from "@/lib/marketData";

export const Route = createFileRoute("/markets")({
  head: () => ({
    meta: [
      { title: "Markets — ALPHENTRA" },
      {
        name: "description",
        content:
          "Simulated market board with prices, movement and AI signal confidence across equities, ETFs, FX and commodities.",
      },
      { property: "og:title", content: "Markets — ALPHENTRA" },
      { property: "og:description", content: "Simulated market board with AI signals." },
    ],
  }),
  component: MarketsPage,
});

const filters = ["All", "FX", "Crypto", "Metals", "Equity", "ETF", "Index", "Commodity"] as const;

function MarketsPage() {
  const [filter, setFilter] = useState<(typeof filters)[number]>("All");
  const [markets, setMarkets] = useState<Market[]>([]);
  const [liveData, setLiveData] = useState(false);

  useEffect(() => {
    let active = true;

    const refresh = () => {
      void loadMarketBoard()
        .then((nextMarkets) => {
          if (!active) return;
          setMarkets(nextMarkets);
          setLiveData(nextMarkets.some((market) => market.providerStatus === "live"));
        })
        .catch((error) => {
          console.error("Failed to load market data:", error);
        });
    };

    refresh();
    const unsubscribe = subscribeToMarketQuotes(refresh);

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const rows = markets.filter((m) => filter === "All" || m.assetClass === filter);

  const columns: Column<Market>[] = [
    {
      key: "symbol",
      header: "Instrument",
      cell: (m) => (
        <div>
          <div className="flex items-center gap-2">
            <p className="num text-sm font-bold text-foreground">{m.symbol}</p>
            <span
              className={cn(
                "rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide",
                m.providerStatus === "live"
                  ? "bg-success/12 text-success"
                  : m.providerStatus === "no_quote"
                    ? "bg-warning/12 text-warning"
                    : "bg-muted text-muted-foreground",
              )}
            >
              {m.providerStatus === "live" ? "Live" : m.providerStatus === "no_quote" ? "No quote" : "Unavailable"}
            </span>
            {m.providerStatus === "live" && (
              <span className={cn(
                "text-[9px] font-bold uppercase tracking-wide",
                m.isMarketOpen ? "text-success" : "text-muted-foreground",
              )}>
                {m.isMarketOpen ? "Open" : "Closed"}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">{m.name}</p>
        </div>
      ),
    },
    {
      key: "price",
      header: "Last",
      align: "right",
      cell: (m) => (
        <span className="num font-semibold text-foreground">
          {m.providerStatus === "live"
            ? m.price.toLocaleString("en-US", { minimumFractionDigits: m.assetClass === "FX" ? 4 : 2 })
            : "—"}
          {m.providerStatus === "live" && m.bid != null && m.ask != null && (
            <span className="mt-1 block text-[10px] font-normal text-muted-foreground">
              B {m.bid.toLocaleString("en-US", { maximumFractionDigits: 8 })} · A {m.ask.toLocaleString("en-US", { maximumFractionDigits: 8 })}
            </span>
          )}
        </span>
      ),
    },
    {
      key: "chg",
      header: "Change",
      align: "right",
      cell: (m) => (
        <div className="inline-flex flex-col items-end">
          <Delta value={m.changePct} showIcon={false} />
          {m.spread != null && (
            <span className="mt-1 text-[10px] text-muted-foreground">
              Spread {m.spread.toLocaleString("en-US", { maximumFractionDigits: 8 })}
            </span>
          )}
        </div>
      ),
    },
    {
      key: "spark",
      header: "30 sessions",
      align: "right",
      cell: (m) => (
        <div className="ml-auto w-24">
          {m.spark.length >= 2 ? <Sparkline data={m.spark} height={30} /> : <span className="text-xs text-muted-foreground">—</span>}
        </div>
      ),
    },
    { key: "vol", header: "Tick Volume", align: "right", cell: (m) => <span className="num text-muted-foreground">{m.volume}</span> },
    {
      key: "signal",
      header: "AI signal (prototype)",
      align: "right",
      cell: (m) => (
        <div className="inline-flex flex-col items-end">
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
              m.aiSignal === "Bullish"
                ? "bg-success/12 text-success"
                : m.aiSignal === "Bearish"
                  ? "bg-danger/12 text-danger"
                  : "bg-muted text-muted-foreground",
            )}
          >
            {m.aiSignal}
          </span>
          <span className="num mt-1 text-[11px] text-muted-foreground">{m.aiConfidence > 0 ? `${m.aiConfidence}% conf.` : "Prototype"}</span>
        </div>
      ),
    },
  ];

  return (
    <AppShell wide>
      <PageHeader
        eyebrow="Market board"
        title="Markets"
        description="Live market data powered by MetaTrader 5 with bid, ask, spread, change and quote activity."
      />

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <GlassCard className="px-4 py-3">
          <p className="text-xs text-muted-foreground">Live instruments</p>
          <p className="num mt-1 text-lg font-bold text-foreground">{markets.length}</p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">Dynamically selected from MT5</p>
        </GlassCard>
        <GlassCard className="px-4 py-3">
          <p className="text-xs text-muted-foreground">Open instruments</p>
          <p className="num mt-1 text-lg font-bold text-foreground">
            {markets.filter((market) => market.isMarketOpen).length}
          </p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">Based on current MT5 quote activity</p>
        </GlassCard>
        <GlassCard className="px-4 py-3">
          <p className="text-xs text-muted-foreground">Market source</p>
          <p className="mt-1 text-lg font-bold text-foreground">MT5</p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">No seeded market index values</p>
        </GlassCard>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {getMarketSessions().map((session) => (
          <GlassCard key={session.group} className="flex items-center justify-between px-4 py-3">
            <div>
              <p className="text-xs font-semibold text-foreground">{session.label}</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">{session.note}</p>
            </div>
            <span
              className={cn(
                "rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wide",
                session.open ? "bg-success/12 text-success" : "bg-muted text-muted-foreground",
              )}
            >
              {session.open ? "Open" : "Closed"}
            </span>
          </GlassCard>
        ))}
      </div>

      <div className="mt-2 text-xs text-muted-foreground">
        <div className="flex flex-wrap items-center gap-2">
          <span>{getMarketCalendarLabel()} · Session calendar</span>
          <span className="rounded-full border border-border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
            {liveData ? "MT5 live quotes" : "No live quotes"}
          </span>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {filters.map((f) => (
          <Button
            key={f}
            size="sm"
            variant={filter === f ? "default" : "outline"}
            onClick={() => setFilter(f)}
          >
            {f}
          </Button>
        ))}
      </div>

      <GlassCard className="mt-4 overflow-hidden">
        <DataTable columns={columns} rows={rows} />
      </GlassCard>
    </AppShell>
  );
}
