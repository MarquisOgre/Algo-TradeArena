import { createFileRoute, Link } from "@tanstack/react-router";
import { Activity, ArrowRight, Bot, Swords, Trophy, Users } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { GlassCard } from "@/components/common/GlassCard";
import { StatCard } from "@/components/common/StatCard";
import { Sparkline } from "@/components/common/Sparkline";
import { Delta } from "@/components/common/Delta";
import { AgentCard } from "@/components/cards/AgentCard";
import { BattleCard } from "@/components/cards/BattleCard";
import { Button } from "@/components/ui/button";
import { mockAgents } from "@/data/mockAgents";
import { mockBattles } from "@/data/mockBattles";
import { marketIndices, mockMarkets } from "@/data/mockMarkets";
import { mockPosts } from "@/data/mockPosts";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ALPHENTRA — Build. Test. Compete. Trade." },
      {
        name: "description",
        content:
          "Watch AI trading strategies and agents battle head to head in a fully simulated paper-trading arena. Leaderboards, tournaments and live market analytics.",
      },
      { property: "og:title", content: "ALPHENTRA — Build. Test. Compete. Trade." },
      {
        property: "og:description",
        content: "AI trading strategies, simulated battles, tournaments and leaderboards.",
      },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const liveBattles = mockBattles.filter((b) => b.status !== "Finished").slice(0, 2);
  const topAgents = [...mockAgents].sort((a, b) => a.rank - b.rank).slice(0, 3);
  const movers = [...mockMarkets].sort((a, b) => Math.abs(b.changePct) - Math.abs(a.changePct)).slice(0, 5);

  return (
    <AppShell>
      {/* Hero */}
      <GlassCard className="arena-grid relative overflow-hidden p-6 sm:p-10">
        <div className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-primary/12 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 left-1/3 size-72 rounded-full bg-accent/10 blur-3xl" />
        <div className="relative max-w-2xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background/60 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
            <Activity className="size-3.5" /> Season 4 live
          </span>
          <h1 className="mt-4 text-3xl font-extrabold leading-tight tracking-tight text-foreground sm:text-5xl">
            Build. Test. Compete. Trade.
          </h1>
          <p className="mt-3 max-w-xl text-sm text-muted-foreground sm:text-base">
            Build agents, put them in head-to-head battles and climb the ladder. Every position,
            price and payout in ALPHENTRA is simulated — no real money moves.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <Button asChild size="lg">
              <Link to="/battle">
                Enter the arena <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/agents/create">Create an agent</Link>
            </Button>
          </div>
        </div>
      </GlassCard>

      {/* Index strip */}
      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {marketIndices.map((idx) => (
          <GlassCard key={idx.label} className="flex items-center justify-between px-4 py-3">
            <div>
              <p className="text-xs text-muted-foreground">{idx.label}</p>
              <p className="num text-lg font-bold text-foreground">{idx.value}</p>
            </div>
            <Delta value={idx.changePct} showIcon={false} />
          </GlassCard>
        ))}
      </div>

      {/* Stats */}
      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Active agents" value="4,812" delta={6.2} icon={Bot} hint="last 7 days" />
        <StatCard label="Battles today" value="1,204" delta={12.8} icon={Swords} hint="vs yesterday" />
        <StatCard label="Arena traders" value="128,440" delta={3.1} icon={Users} hint="paper accounts" />
        <StatCard label="Season prize pool" value="250,000 XP" delta={0} icon={Trophy} hint="Arena Cup S4" />
      </div>

      {/* Live battles */}
      <section className="mt-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-foreground">Live battles</h2>
            <p className="text-sm text-muted-foreground">Simulated duels running right now.</p>
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link to="/battle">
              All battles <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {liveBattles.map((b) => (
            <BattleCard key={b.id} battle={b} />
          ))}
        </div>
      </section>

      <div className="mt-8 grid gap-4 xl:grid-cols-[2fr_1fr]">
        {/* Top agents */}
        <section>
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-foreground">Top ranked agents</h2>
              <p className="text-sm text-muted-foreground">Ranked by risk-adjusted simulated return.</p>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link to="/leaderboard">
                Leaderboard <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {topAgents.map((a) => (
              <AgentCard key={a.id} agent={a} />
            ))}
          </div>
        </section>

        {/* Movers */}
        <section>
          <div className="flex items-end justify-between gap-4">
            <h2 className="text-lg font-bold text-foreground">Market movers</h2>
            <Button asChild variant="ghost" size="sm">
              <Link to="/markets">
                Markets <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
          <GlassCard className="mt-4 divide-y divide-border">
            {movers.map((m) => (
              <div key={m.id} className="flex items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="num text-sm font-bold text-foreground">{m.symbol}</p>
                  <p className="truncate text-xs text-muted-foreground">{m.name}</p>
                </div>
                <div className="w-16">
                  <Sparkline data={m.spark} height={28} />
                </div>
                <div className="text-right">
                  <p className="num text-sm font-semibold text-foreground">
                    {m.price.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </p>
                  <Delta value={m.changePct} showIcon={false} className="text-xs" />
                </div>
              </div>
            ))}
          </GlassCard>
        </section>
      </div>

      {/* Feed */}
      <section className="mt-8">
        <div className="flex items-end justify-between gap-4">
          <h2 className="text-lg font-bold text-foreground">From the arena</h2>
          <Button asChild variant="ghost" size="sm">
            <Link to="/discover">
              Discover <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {mockPosts.slice(0, 3).map((p) => (
            <GlassCard key={p.id} className="p-5">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="rounded-full bg-primary-soft px-2 py-0.5 font-semibold text-primary">
                  {p.tag}
                </span>
                <span>{p.handle}</span>
                <span>· {p.time}</span>
              </div>
              <p className="mt-3 text-sm text-foreground">{p.body}</p>
            </GlassCard>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
