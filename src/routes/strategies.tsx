import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { LockKeyhole, Plus, Store, TrendingUp, Users } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/common/PageHeader";
import { GlassCard } from "@/components/common/GlassCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getStrategies } from "@/data/strategies";
import type { Strategy } from "@/data/types";

export const Route = createFileRoute("/strategies")({
  head: () => ({
    meta: [
      { title: "Strategy Marketplace — ALPHENTRA" },
      { name: "description", content: "Discover, test, subscribe to, and follow trading strategies created by the ALPHENTRA community." },
    ],
  }),
  component: StrategiesPage,
});

const filters = ["All", "Published", "Forward Testing", "Draft"] as const;

function StrategiesPage() {
  const [filter, setFilter] = useState<(typeof filters)[number]>("All");
  const [strategies, setStrategies] = useState<Strategy[]>([]);

  useEffect(() => {
    setStrategies(getStrategies());
  }, []);
  const visible = strategies.filter((strategy) => filter === "All" || strategy.status === filter);

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Strategy Economy"
          title="Strategy Marketplace"
          description="One reusable strategy record can move from the Lab into testing, the Arena, discovery, and eventually subscriptions."
          actions={
            <Button asChild>
              <Link to="/lab"><Plus />Create Strategy</Link>
            </Button>
          }
        />

        <div className="flex flex-wrap gap-2">
          {filters.map((item) => (
            <Button key={item} size="sm" variant={filter === item ? "default" : "outline"} onClick={() => setFilter(item)}>
              {item}
            </Button>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((strategy) => <StrategyCard key={strategy.id} strategy={strategy} />)}
        </div>

        <GlassCard className="p-5">
          <div className="flex gap-3">
            <LockKeyhole className="size-5 shrink-0 text-amber-400" />
            <div>
              <h3 className="font-medium">Marketplace payments</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                ALPHENTRA Token is planned for strategy subscriptions and marketplace fees. Payments remain prototype-only until wallet infrastructure and regulatory requirements are finalized.
              </p>
            </div>
          </div>
        </GlassCard>
      </div>
    </AppShell>
  );
}

function StrategyCard({ strategy }: { strategy: Strategy }) {
  const backtest = strategy.backtest;

  return (
    <GlassCard interactive className="p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary"><Store className="size-4" /></div>
          <Badge variant="outline" className="border-border">{strategy.status}</Badge>
        </div>
        {backtest && <span className="num text-xs text-emerald-400">+{backtest.returnPct.toFixed(1)}% backtest</span>}
      </div>

      <h3 className="mt-5 font-semibold">{strategy.name}</h3>
      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{strategy.description}</p>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {strategy.tags.slice(0, 3).map((tag) => <Badge key={tag} variant="outline" className="bg-surface text-[10px]">{tag}</Badge>)}
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 text-xs">
        <div className="rounded-lg bg-surface/60 p-3"><p className="text-muted-foreground">Version</p><p className="mt-1 font-medium">v{strategy.versions.find((v) => v.id === strategy.activeVersionId)?.version ?? 1}</p></div>
        <div className="rounded-lg bg-surface/60 p-3"><p className="text-muted-foreground">Followers</p><p className="mt-1 flex items-center gap-1 font-medium"><Users className="size-3.5" />{strategy.followers.toLocaleString()}</p></div>
        {backtest && <div className="rounded-lg bg-surface/60 p-3"><p className="text-muted-foreground">Win rate</p><p className="mt-1 font-medium">{backtest.winRatePct.toFixed(1)}%</p></div>}
        {backtest && <div className="rounded-lg bg-surface/60 p-3"><p className="text-muted-foreground">Sharpe</p><p className="mt-1 flex items-center gap-1 font-medium"><TrendingUp className="size-3.5" />{backtest.sharpe.toFixed(2)}</p></div>}
      </div>

      <div className="mt-5 flex items-center justify-between text-xs text-muted-foreground">
        <span>By {strategy.creator}</span>
        <span>{strategy.versions.length} version{strategy.versions.length === 1 ? "" : "s"}</span>
      </div>

      <Button asChild variant="outline" size="sm" className="mt-4 w-full">
        <Link to="/strategies/$id" params={{ id: strategy.id }}>View Strategy</Link>
      </Button>
    </GlassCard>
  );
}
