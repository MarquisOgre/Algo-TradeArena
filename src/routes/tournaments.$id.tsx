import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, CalendarDays, Trophy, Users } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/common/PageHeader";
import { GlassCard } from "@/components/common/GlassCard";
import { StatCard } from "@/components/common/StatCard";
import { DataTable, type Column } from "@/components/common/DataTable";
import { Delta } from "@/components/common/Delta";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { getTournament } from "@/data/mockTournaments";
import { mockAgents } from "@/data/mockAgents";
import type { Agent } from "@/data/types";

export const Route = createFileRoute("/tournaments/$id")({
  loader: ({ params }) => {
    const tournament = getTournament(params.id);
    if (!tournament) throw notFound();
    return { tournament };
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.tournament.name} — ALPHENTRA` },
          { name: "description", content: loaderData.tournament.description },
          { property: "og:title", content: `${loaderData.tournament.name} — ALPHENTRA` },
          { property: "og:description", content: loaderData.tournament.description },
        ]
      : [{ title: "Competition not found — ALPHENTRA" }, { name: "robots", content: "noindex" }],
  }),
  component: TournamentDetail,
});

function TournamentDetail() {
  const { tournament } = Route.useLoaderData();
  const standings = [...mockAgents].sort((a, b) => b.roi30d - a.roi30d);

  const columns: Column<Agent>[] = [
    { key: "pos", header: "Pos", cell: (_a, i) => <span className="num font-bold text-muted-foreground">{i + 1}</span> },
    {
      key: "strategy",
      header: "Strategy",
      cell: (a) => (
        <Link to="/agents/$id" params={{ id: a.id }} className="font-semibold text-foreground hover:text-primary">
          {a.name}
        </Link>
      ),
    },
    { key: "creator", header: "Creator", cell: (a) => <span className="text-muted-foreground">{a.creator}</span> },
    { key: "roi", header: "Event return", align: "right", cell: (a) => <Delta value={a.roi30d} showIcon={false} /> },
    { key: "sharpe", header: "Sharpe", align: "right", cell: (a) => <span className="num text-foreground">{a.sharpe.toFixed(2)}</span> },
    { key: "dd", header: "Max DD", align: "right", cell: (a) => <span className="num text-danger">{a.maxDrawdown}%</span> },
  ];

  return (
    <AppShell wide>
      <Button asChild variant="ghost" size="sm" className="-ml-2 mb-3">
        <Link to="/tournaments">
          <ArrowLeft className="size-4" /> All competitions
        </Link>
      </Button>

      <PageHeader
        eyebrow={`${tournament.season} · ${tournament.status}`}
        title={tournament.name}
        description={tournament.description}
        actions={
          <Button asChild disabled={tournament.status === "Completed"}>
            <Link to="/strategies">{tournament.status === "Registering" ? "Select Strategy" : "View Strategies"}</Link>
          </Button>
        }
      />

      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Prize pool" value={tournament.prizePool} icon={Trophy} hint="Prototype rewards" />
        <StatCard label="Entrants" value={`${tournament.entrants.toLocaleString()}`} icon={Users} hint={`of ${tournament.capacity.toLocaleString()}`} />
        <StatCard label="Window" value={`${tournament.startDate} — ${tournament.endDate}`} icon={CalendarDays} />
        <StatCard label="Format" value={tournament.format.split(" · ")[0] ?? tournament.format} hint={tournament.format} />
      </div>

      <GlassCard className="mt-4 border-primary/20 bg-primary/5 p-5">\n        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">\n          <div>\n            <p className="text-sm font-semibold">Competition rewards</p>\n            <p className="mt-1 text-xs text-muted-foreground">Entry and rewards use ALPHENTRA prototype units only. No real token transfer occurs.</p>\n          </div>\n          <Badge variant="outline" className="w-fit border-primary/30 text-primary">ALPH prototype</Badge>\n        </div>\n      </GlassCard>\n\n      <GlassCard className="mt-4 p-5">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Field filled</span>
          <span className="num font-semibold text-foreground">
            {Math.round((tournament.entrants / tournament.capacity) * 100)}%
          </span>
        </div>
        <Progress value={(tournament.entrants / tournament.capacity) * 100} className="mt-3 h-2" />
      </GlassCard>

      <GlassCard className="mt-4 overflow-hidden">
        <div className="border-b border-border px-5 py-4">
          <h3 className="text-sm font-semibold text-foreground">Standings</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">Simulated results across the event window.</p>
        </div>
        <DataTable columns={columns} rows={standings} />
      </GlassCard>
    </AppShell>
  );
}
