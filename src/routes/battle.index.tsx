import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { GlassCard } from "@/components/common/GlassCard";
import { PageHeader } from "@/components/common/PageHeader";
import { BattleCard } from "@/components/cards/BattleCard";
import { StatCard } from "@/components/common/StatCard";
import { Swords, Eye, Timer } from "lucide-react";
import { mockBattles } from "@/data/mockBattles";
import { getStrategy } from "@/data/strategies";
import type { Strategy } from "@/data/types";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/battle/")({
  head: () => ({
    meta: [
      { title: "ALPHENTRA Arena — Competitions" },
      {
        name: "description",
        content: "Live and upcoming AI strategy competitions with simulated performance, equity curves and spectator counts.",
      },
      { property: "og:title", content: "ALPHENTRA Arena — Competitions" },
      { property: "og:description", content: "Live AI strategy competitions with simulated trading." },
    ],
  }),
  component: BattlePage,
});

function BattlePage() {
  const [selectedStrategy, setSelectedStrategy] = useState<Strategy>();

  useEffect(() => {
    const id = window.localStorage.getItem("alphentra.arena.selectedStrategyId");
    if (id) setSelectedStrategy(getStrategy(id));
  }, []);

  const groups = [
    { title: "Live now", items: mockBattles.filter((b) => b.status === "Live") },
    { title: "Starting soon", items: mockBattles.filter((b) => b.status === "Upcoming") },
    { title: "Recently completed", items: mockBattles.filter((b) => b.status === "Finished") },
  ];

  return (
    <AppShell>
      <PageHeader
        eyebrow="Competition Arena"
        title="AI Strategy Competitions"
        description="Strategies compete with identical simulated capital. Scoring uses risk-adjusted performance over the competition window."
      />

      {selectedStrategy && (
        <GlassCard className="mt-6 border-primary/20 bg-primary/5 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">Arena Strategy</p>
              <p className="mt-1 font-semibold">{selectedStrategy.name}</p>
              <p className="text-xs text-muted-foreground">Strategy ID: {selectedStrategy.id} · {selectedStrategy.status}</p>
            </div>
            <Button asChild variant="outline" size="sm"><Link to="/strategies/$id" params={{ id: selectedStrategy.id }}>View Strategy</Link></Button>
          </div>
        </GlassCard>
      )}

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <StatCard label="Live competitions" value="2" icon={Swords} hint="running now" />
        <StatCard label="Spectators" value="19,729" delta={8.4} icon={Eye} />
        <StatCard label="Avg competition length" value="5 sessions" icon={Timer} hint="simulated" />
      </div>

      {groups.map((g) =>
        g.items.length === 0 ? null : (
          <section key={g.title} className="mt-8">
            <h2 className="text-lg font-bold text-foreground">{g.title}</h2>
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              {g.items.map((b) => (
                <BattleCard key={b.id} battle={b} />
              ))}
            </div>
          </section>
        ),
      )}
    </AppShell>
  );
}
