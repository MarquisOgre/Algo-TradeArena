import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/common/PageHeader";
import { GlassCard } from "@/components/common/GlassCard";
import { ChartCard } from "@/components/common/ChartCard";
import { Sparkline } from "@/components/common/Sparkline";
import { Delta } from "@/components/common/Delta";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { mockMarkets } from "@/data/mockMarkets";
import { PaperTradingBadge } from "@/components/layout/TopBar";
import { cn } from "@/lib/utils";
import { getMarketCalendarLabel, getMarketSessions } from "@/lib/marketCalendar";

export const Route = createFileRoute("/trade")({
  head: () => ({
    meta: [
      { title: "Paper Trade — ALPHENTRA" },
      {
        name: "description",
        content: "Place simulated paper trades using ALPHENTRA's mock market data. No broker, no real money.",
      },
      { property: "og:title", content: "Paper Trade — ALPHENTRA" },
      { property: "og:description", content: "Place simulated paper trades in ALPHENTRA." },
    ],
  }),
  component: TradePage,
});

function TradePage() {
  const [symbolId, setSymbolId] = useState(mockMarkets[0]!.id);
  const [side, setSide] = useState<"BUY" | "SELL">("BUY");
  const [qty, setQty] = useState("100");
  const market = mockMarkets.find((m) => m.id === symbolId)!;
  const notional = (Number(qty) || 0) * market.price;
  const forexOpen = getMarketSessions().find((session) => session.group === "forex")?.open ?? true;
  const marketClosed = market.assetClass === "FX" && !forexOpen;

  return (
    <AppShell>
      <PageHeader
        eyebrow="Order ticket"
        title="Paper trade"
        description="Everything here is simulated. Fills use mock prices and settle only inside your paper account."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <span className="hidden text-xs text-muted-foreground sm:inline">{getMarketCalendarLabel()}</span>
            <PaperTradingBadge />
          </div>
        }
      />

      <div className="mt-6 grid gap-4 xl:grid-cols-[1fr_380px]">
        <ChartCard
          title={`${market.symbol} · ${market.name}`}
          subtitle="Simulated last 30 sessions"
          actions={<Delta value={market.changePct} showIcon={false} size="md" />}
        >
          <div className="flex flex-wrap items-center gap-2">\n            <p className="num text-3xl font-bold text-foreground">
            {market.price.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </p>
          <div className="mt-2">
            <Sparkline data={market.spark} height={180} />
          </div>
        </ChartCard>

        <GlassCard className="h-fit p-5">
          <div className="grid grid-cols-2 gap-2">
            {(["BUY", "SELL"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setSide(s)}
                className={cn(
                  "rounded-xl border py-2.5 text-sm font-bold transition-colors",
                  side === s
                    ? s === "BUY"
                      ? "border-success/50 bg-success/12 text-success"
                      : "border-danger/50 bg-danger/12 text-danger"
                    : "border-border text-muted-foreground hover:text-foreground",
                )}
              >
                {s}
              </button>
            ))}
          </div>

          <div className="mt-4 space-y-2">
            <Label htmlFor="symbol">Instrument</Label>
            <select
              id="symbol"
              value={symbolId}
              onChange={(e) => setSymbolId(e.target.value)}
              className="h-10 w-full rounded-xl border border-border bg-surface px-3 text-sm text-foreground focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-ring/25"
            >
              {mockMarkets.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.symbol} — {m.name}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-4 space-y-2">
            <Label htmlFor="qty">Quantity</Label>
            <Input id="qty" inputMode="numeric" value={qty} onChange={(e) => setQty(e.target.value)} />
          </div>

          <dl className="mt-4 space-y-2 border-t border-border pt-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Est. price</dt>
              <dd className="num text-foreground">{market.price.toFixed(2)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Notional</dt>
              <dd className="num font-semibold text-foreground">
                ${notional.toLocaleString("en-US", { maximumFractionDigits: 2 })}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Commission</dt>
              <dd className="num text-foreground">$0.00 (simulated)</dd>
            </div>
          </dl>

          <Button
            className="mt-4 w-full"
            onClick={() =>
              toast.success(`Simulated ${side.toLowerCase()} recorded`, {
                description: `${qty} ${market.symbol} at ${market.price.toFixed(2)} — paper account only.`,
              })
            }
          >
            Submit paper order
          </Button>
          <p className="mt-3 text-center text-[11px] text-muted-foreground">
            {marketClosed ? "Order ticket disabled while this market is closed." : "ALPHENTRA does not route orders to any broker or exchange."}
          </p>
        </GlassCard>
      </div>
    </AppShell>
  );
}
