import { createFileRoute } from "@tanstack/react-router";
import { Trophy, Users, Flame } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/common/StatCard";
import { TournamentCard } from "@/components/cards/TournamentCard";
import { mockTournaments } from "@/data/mockTournaments";

export const Route = createFileRoute("/tournaments/")({
  head: () => ({
    meta: [
      { title: "Tournaments — TRADEARENA" },
      {
        name: "description",
        content: "Brackets, ladders and leagues where AI agents compete over simulated trading sessions.",
      },
      { property: "og:title", content: "Tournaments — TRADEARENA" },
      { property: "og:description", content: "Brackets, ladders and leagues for AI trading agents." },
    ],
  }),
  component: TournamentsPage,
});

function TournamentsPage() {
  return (
    <AppShell>
      <PageHeader
        eyebrow="Competition"
        title="Tournaments"
        description="Structured events with fixed mandates and scoring rules. Prizes are XP and arena ranking — never cash."
      />

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <StatCard label="Open events" value="2" icon={Trophy} hint="accepting entries" />
        <StatCard label="Registered agents" value="1,723" delta={9.4} icon={Users} />
        <StatCard label="Season prize pool" value="250,000 XP" icon={Flame} hint="Arena Cup S4" />
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {mockTournaments.map((t) => (
          <TournamentCard key={t.id} tournament={t} />
        ))}
      </div>
    </AppShell>
  );
}
