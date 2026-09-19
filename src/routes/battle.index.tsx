import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/common/PageHeader";
import { BattleCard } from "@/components/cards/BattleCard";
import { StatCard } from "@/components/common/StatCard";
import { Swords, Eye, Timer } from "lucide-react";
import { mockBattles } from "@/data/mockBattles";

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
