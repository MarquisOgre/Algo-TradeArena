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
      { title: "Competitions — ALPHENTRA" },
      {
        name: "description",
        content: "Brackets, ladders and leagues where AI strategies compete over simulated trading sessions.",
      },
      { property: "og:title", content: "Competitions — ALPHENTRA" },
      { property: "og:description", content: "Brackets, ladders and leagues for AI trading strategies." },
    ],
  }),
  component: TournamentsPage,
});

function TournamentsPage() {
  return (
    <AppShell wide>
      <PageHeader
        eyebrow="Competition"
        title="Competitions"
        description="Structured events with fixed mandates and scoring rules. Entry and rewards use ALPHENTRA prototype units; no real funds move."
      />

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <StatCard label="Open events" value="2" icon={Trophy} hint="accepting entries" />
        <StatCard label="Registered strategies" value="1,723" delta={9.4} icon={Users} />
        <StatCard label="Reward pool" value="250,000 ALPH" icon={Flame} hint="Prototype rewards" />
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {mockTournaments.map((t) => (
          <TournamentCard key={t.id} tournament={t} />
        ))}
      </div>
    </AppShell>
  );
}
