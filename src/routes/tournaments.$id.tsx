import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, CalendarDays, Trophy, Users } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/common/PageHeader";
import { GlassCard } from "@/components/common/GlassCard";
import { StatCard } from "@/components/common/StatCard";
import { DataTable, type Column } from "@/components/common/DataTable";
import { Delta } from "@/components/common/Delta";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { getCompetition } from "@/data/mockCompetitions";
import { mockAgents } from "@/data/mockAgents";
import type { Agent } from "@/data/types";

export const Route = createFileRoute("/competitions/$id")({
  loader: ({ params }) => {
    const competition = getCompetition(params.id);
    if (!competition) throw notFound();
    return { competition };
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.competition.name} — ALPHENTRA` },
          { name: "description", content: loaderData.competition.description },
          { property: "og:title", content: `${loaderData.competition.name} — ALPHENTRA` },
          { property: "og:description", content: loaderData.competition.description },
        ]
      : [{ title: "Competition not found — ALPHENTRA" }, { name: "robots", content: "noindex" }],
  }),
  component: CompetitionDetail,
});

function CompetitionDetail() {
  const { competition } = Route.useLoaderData();
  const standings = [...mockAgents].sort((a, b) => b.roi30d - a.roi30d);

  const columns: Column<Agent>[] = [
    { key: "pos", header: "Pos", cell: (_a, i) => <span className="num font-bold text-muted-foreground">{i + 1}</span> },
    {
      key: "strategy",
      header: "Agent",
      cell: (a) => (
        <Link to="/strategys/$id" params={{ id: a.id }} className="font-semibold text-foreground hover:text-primary">
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
        <Link to="/competitions">
          <ArrowLeft className="size-4" /> All competitions
        </Link>
      </Button>

      <PageHeader
        eyebrow={`${competition.season} · ${competition.status}`}
        title={competition.name}
        description={competition.description}
        actions={
          <Button disabled={competition.status === "Completed"}>
            {competition.status === "Registering" ? "Register an strategy" : "Follow event"}
          </Button>
        }
      />

      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Prize pool" value={competition.prizePool} icon={Trophy} hint="XP only" />
        <StatCard label="Entrants" value={`${competition.entrants.toLocaleString()}`} icon={Users} hint={`of ${competition.capacity.toLocaleString()}`} />
        <StatCard label="Window" value={`${competition.startDate} — ${competition.endDate}`} icon={CalendarDays} />
        <StatCard label="Format" value={competition.format.split(" · ")[0] ?? competition.format} hint={competition.format} />
      </div>

      <GlassCard className="mt-4 p-5">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Field filled</span>
          <span className="num font-semibold text-foreground">
            {Math.round((competition.entrants / competition.capacity) * 100)}%
          </span>
        </div>
        <Progress value={(competition.entrants / competition.capacity) * 100} className="mt-3 h-2" />
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
