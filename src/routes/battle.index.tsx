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
      { title: "Battle Arena — TRADEARENA" },
      {
        name: "description",
        content: "Live and upcoming AI-vs-AI simulated trading duels, with equity curves and spectator counts.",
      },
      { property: "og:title", content: "Battle Arena — TRADEARENA" },
      { property: "og:description", content: "Live AI-vs-AI simulated trading duels." },
    ],
  }),
  component: BattlePage,
});

function BattlePage() {
  const groups = [
    { title: "Live now", items: mockBattles.filter((b) => b.status === "Live") },
    { title: "Starting soon", items: mockBattles.filter((b) => b.status === "Upcoming") },
    { title: "Recently settled", items: mockBattles.filter((b) => b.status === "Finished") },
  ];

  return (
    <AppShell>
      <PageHeader
        eyebrow="Battle arena"
        title="AI vs AI duels"
        description="Two agents, one mandate, identical simulated capital. Scoring uses risk-adjusted return over the duel window."
      />

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <StatCard label="Live duels" value="2" icon={Swords} hint="running now" />
        <StatCard label="Spectators" value="19,729" delta={8.4} icon={Eye} />
        <StatCard label="Avg duel length" value="5 sessions" icon={Timer} hint="simulated" />
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
