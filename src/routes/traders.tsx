import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowUpRight,
  Bot,
  ChevronRight,
  Copy,
  Crown,
  Filter,
  ShieldCheck,
  Swords,
  Trophy,
  Users,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/common/PageHeader";
import { GlassCard } from "@/components/common/GlassCard";
import { StatCard } from "@/components/common/StatCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Delta } from "@/components/common/Delta";
import { Sparkline } from "@/components/common/Sparkline";

export const Route = createFileRoute("/traders")({
  head: () => ({
    meta: [
      { title: "Traders — ALPHENTRA" },
      {
        name: "description",
        content: "Discover strategy creators, competition performers, and traders to follow on ALPHENTRA.",
      },
      { property: "og:title", content: "Traders — ALPHENTRA" },
      { property: "og:description", content: "Discover strategy creators, competition performers, and traders on ALPHENTRA." },
    ],
  }),
  component: TradersPage,
});

type Trader = {
  id: string;
  name: string;
  handle: string;
  role: string;
  style: string;
  markets: string[];
  followers: number;
  strategies: number;
  competitions: number;
  winRate: number;
  roi30d: number;
  sharpe: number;
  drawdown: number;
  record: string;
  accent: string;
  curve: number[];
};

const traders: Trader[] = [
  {
    id: "novaquant",
    name: "NovaQuant",
    handle: "@novaquant",
    role: "AI Strategist",
    style: "Momentum",
    markets: ["Forex", "Metals"],
    followers: 2840,
    strategies: 7,
    competitions: 28,
    winRate: 64.8,
    roi30d: 18.4,
    sharpe: 1.92,
    drawdown: -7.1,
    record: "22W · 6L",
    accent: "NQ",
    curve: [100, 102, 101, 106, 109, 108, 114, 118, 116, 121, 124, 129],
  },
  {
    id: "mira-fx",
    name: "Mira FX",
    handle: "@mirafx",
    role: "Systematic Trader",
    style: "Mean Reversion",
    markets: ["Forex", "Indices"],
    followers: 1960,
    strategies: 4,
    competitions: 19,
    winRate: 68.1,
    roi30d: 14.7,
    sharpe: 1.78,
    drawdown: -5.8,
    record: "15W · 4L",
    accent: "MF",
    curve: [100, 104, 103, 107, 111, 110, 114, 117, 119, 118, 123, 126],
  },
  {
    id: "alphaforge",
    name: "AlphaForge",
    handle: "@alphaforge",
    role: "Strategy Creator",
    style: "Macro",
    markets: ["FX", "Metals", "Crypto"],
    followers: 1480,
    strategies: 11,
    competitions: 15,
    winRate: 59.6,
    roi30d: 11.9,
    sharpe: 1.51,
    drawdown: -9.4,
    record: "10W · 5L",
    accent: "AF",
    curve: [100, 101, 105, 103, 108, 111, 109, 114, 117, 116, 121, 124],
  },
  {
    id: "quantpilot",
    name: "QuantPilot",
    handle: "@quantpilot",
    role: "AI Strategy Builder",
    style: "Volatility",
    markets: ["Indices", "Crypto"],
    followers: 1120,
    strategies: 5,
    competitions: 12,
    winRate: 61.3,
    roi30d: 9.8,
    sharpe: 1.43,
    drawdown: -8.2,
    record: "8W · 4L",
    accent: "QP",
    curve: [100, 103, 102, 104, 107, 110, 108, 112, 115, 117, 119, 121],
  },
];

const filters = ["All", "AI Strategists", "Strategy Creators", "Systematic Traders"] as const;

function TradersPage() {
  const [filter, setFilter] = useState<(typeof filters)[number]>("All");
  const [following, setFollowing] = useState<string[]>([]);

  const visible = useMemo(
    () =>
      traders.filter((trader) => {
        if (filter === "All") return true;
        if (filter === "AI Strategists") return trader.role === "AI Strategist" || trader.role === "AI Strategy Builder";
        if (filter === "Strategy Creators") return trader.role.includes("Creator");
        return trader.role === "Systematic Trader";
      }),
    [filter],
  );

  function toggleFollow(id: string) {
    setFollowing((items) => (items.includes(id) ? items.filter((item) => item !== id) : [...items, id]));
  }

  return (
    <AppShell wide>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Discover · Community"
          title="Traders"
          description="Discover strategy creators, competition performers, and traders to follow across the ALPHENTRA ecosystem."
          actions={
            <Button asChild variant="outline">
              <Link to="/leaderboard"><Trophy />Leaderboard</Link>
            </Button>
          }
        />

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Traders" value="4.2K" icon={Users} hint="prototype community" />
          <StatCard label="Strategies" value="1.8K" icon={Bot} hint="created on platform" />
          <StatCard label="Competition entries" value="12.6K" icon={Swords} hint="simulated" />
          <StatCard label="Following activity" value="28.4K" icon={Copy} hint="community actions" />
        </div>

        <GlassCard className="overflow-hidden">
          <div className="flex flex-col gap-4 border-b border-border p-4 lg:flex-row lg:items-center lg:justify-between lg:p-5">
            <div>
              <p className="text-sm font-semibold">Trader directory</p>
              <p className="mt-1 text-xs text-muted-foreground">Profiles combine strategy creation, Arena activity, and community signals.</p>
            </div>
            <div className="flex items-center gap-2 overflow-x-auto">
              <span className="mr-1 hidden items-center gap-1.5 text-xs text-muted-foreground sm:flex"><Filter className="size-3.5" />Filter</span>
              {filters.map((item) => (
                <Button
                  key={item}
                  size="sm"
                  variant={filter === item ? "default" : "outline"}
                  onClick={() => setFilter(item)}
                  className="shrink-0"
                >
                  {item}
                </Button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 p-4 lg:grid-cols-2 lg:p-5">
            {visible.map((trader) => {
              const isFollowing = following.includes(trader.id);
              return (
                <GlassCard key={trader.id} interactive className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <Avatar className="size-12 border border-border">
                        <AvatarFallback className="bg-primary/10 text-xs font-bold text-primary">{trader.accent}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold text-foreground">{trader.name}</h3>
                          <Badge variant="outline" className="text-[10px]">{trader.style}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{trader.handle} · {trader.role}</p>
                      </div>
                    </div>
                    <Crown className="size-4 shrink-0 text-amber-400" />
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <MiniMetric label="30d return" value={`+${trader.roi30d.toFixed(1)}%`} />
                    <MiniMetric label="Win rate" value={`${trader.winRate.toFixed(1)}%`} />
                    <MiniMetric label="Sharpe" value={trader.sharpe.toFixed(2)} />
                    <MiniMetric label="Max DD" value={`${trader.drawdown.toFixed(1)}%`} />
                  </div>

                  <div className="mt-5 flex items-end gap-4 rounded-xl border border-border bg-background/30 p-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Simulated equity</span>
                        <Delta value={trader.roi30d} showIcon={false} className="text-xs" />
                      </div>
                      <div className="mt-2">
                        <Sparkline data={trader.curve} height={42} />
                      </div>
                    </div>
                    <div className="hidden shrink-0 text-right sm:block">
                      <p className="num text-sm font-semibold">{trader.followers.toLocaleString()}</p>
                      <p className="text-[10px] text-muted-foreground">followers</p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-1.5">
                    {trader.markets.map((market) => <Badge key={market} variant="outline" className="bg-surface text-[10px]">{market}</Badge>)}
                    <span className="ml-auto text-xs text-muted-foreground">{trader.strategies} strategies · {trader.competitions} Arena entries</span>
                  </div>

                  <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Competition record</p>
                      <p className="mt-1 text-sm font-medium">{trader.record}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => toggleFollow(trader.id)}>
                        <Users />{isFollowing ? "Following" : "Follow"}
                      </Button>
                      <Button asChild size="sm">
                        <Link to="/leaderboard">View record <ChevronRight /></Link>
                      </Button>
                    </div>
                  </div>
                </GlassCard>
              );
            })}
          </div>
        </GlassCard>

        <GlassCard className="border-primary/15 bg-primary/5 p-5">
          <div className="flex gap-3">
            <ShieldCheck className="mt-0.5 size-5 shrink-0 text-primary" />
            <div>
              <h3 className="text-sm font-semibold">Prototype performance data</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Trader profiles currently use simulated platform data. Verified performance, copy trading, subscriptions, creator earnings, and payouts will require the live trading, broker, wallet, and compliance infrastructure.
              </p>
            </div>
          </div>
        </GlassCard>

        <div className="flex items-center justify-between px-1 text-xs text-muted-foreground">
          <span>ALPHENTRA community directory</span>
          <Link to="/strategies" className="flex items-center gap-1 font-medium text-primary hover:underline">Explore strategies <ArrowUpRight className="size-3.5" /></Link>
        </div>
      </div>
    </AppShell>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-surface/60 p-3">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="num mt-1.5 text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}
