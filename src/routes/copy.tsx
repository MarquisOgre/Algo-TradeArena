import { createFileRoute, Link } from "@tanstack/react-router";
import { Copy, ShieldCheck, TrendingUp, Users, WalletCards } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/common/PageHeader";
import { GlassCard } from "@/components/common/GlassCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/copy")({
  head: () => ({
    meta: [
      { title: "Copy Trading — ALPHENTRA" },
      { name: "description", content: "Discover strategies and configure simulated paper copy trading on ALPHENTRA." },
    ],
  }),
  component: CopyTradingPage,
});

const strategies = [
  {
    id: "atlas-momentum",
    name: "Atlas Momentum",
    creator: "Nova Labs",
    returnPct: 18.4,
    drawdownPct: 8.6,
    sharpe: 1.72,
    followers: 1248,
    copiers: 421,
    risk: "Medium",
    subscription: "25 ALPH / month",
  },
  {
    id: "kepler-reversion",
    name: "Kepler Reversion",
    creator: "Helio Quant",
    returnPct: 14.7,
    drawdownPct: 5.2,
    sharpe: 1.94,
    followers: 834,
    copiers: 286,
    risk: "Low",
    subscription: "20 ALPH / month",
  },
];

function CopyTradingPage() {
  return (
    <AppShell wide>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Copy Trading"
          title="Copy strategies you understand"
          description="Discover strategy creators, review risk, and configure simulated paper copies. Live broker execution is a future phase."
          actions={
            <Button asChild variant="outline">
              <Link to="/strategies"><WalletCards /> Browse Strategies</Link>
            </Button>
          }
        />

        <div className="grid gap-4 sm:grid-cols-3">
          <Stat label="Active copies" value="0" hint="Prototype account" />
          <Stat label="Copied capital" value="0 ALPH" hint="Paper allocation" />
          <Stat label="Copy risk checks" value="Ready" hint="Before each copy" />
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          {strategies.map((strategy) => (
            <GlassCard key={strategy.id} interactive className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline">{strategy.risk} risk</Badge>
                    <Badge variant="outline">Paper Copy</Badge>
                  </div>
                  <h2 className="mt-4 text-xl font-semibold">{strategy.name}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">Created by {strategy.creator}</p>
                </div>
                <div className="grid size-11 place-items-center rounded-xl bg-primary/10 text-primary">
                  <Copy className="size-5" />
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Metric label="Return" value={`+${strategy.returnPct}%`} />
                <Metric label="Drawdown" value={`-${strategy.drawdownPct}%`} />
                <Metric label="Sharpe" value={strategy.sharpe.toFixed(2)} />
                <Metric label="Copiers" value={strategy.copiers.toLocaleString()} />
              </div>

              <div className="mt-5 flex items-center justify-between border-t border-border pt-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5"><Users className="size-3.5" /> {strategy.followers.toLocaleString()} followers</span>
                <span>{strategy.subscription}</span>
              </div>

              <div className="mt-4 flex gap-2">
                <Button asChild variant="outline" className="flex-1">
                  <Link to="/strategies/$id" params={{ id: strategy.id }}>View Strategy</Link>
                </Button>
                <Button asChild className="flex-1">
                  <Link to="/copy/$strategyId" params={{ strategyId: strategy.id }}><Copy /> Copy Strategy</Link>
                </Button>
              </div>
            </GlassCard>
          ))}
        </div>

        <GlassCard className="p-5">
          <div className="flex gap-3">
            <ShieldCheck className="mt-0.5 size-5 shrink-0 text-primary" />
            <div>
              <h2 className="font-semibold">Copy Trading Risk Engine</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Before copying, ALPHENTRA will compare strategy exposure with your paper portfolio, including drawdown, leverage, volatility, market overlap, and concentration.
              </p>
            </div>
          </div>
        </GlassCard>
      </div>
    </AppShell>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint: string }) {
  return <GlassCard className="p-4"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-2 text-2xl font-semibold num">{value}</p><p className="mt-1 text-xs text-muted-foreground">{hint}</p></GlassCard>;
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl bg-surface/60 p-3"><p className="text-[11px] text-muted-foreground">{label}</p><p className="mt-1 font-semibold num">{value}</p></div>;
}
