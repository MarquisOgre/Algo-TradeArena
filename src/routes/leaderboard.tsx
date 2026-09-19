import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/common/PageHeader";
import { GlassCard } from "@/components/common/GlassCard";
import { DataTable, type Column } from "@/components/common/DataTable";
import { Delta } from "@/components/common/Delta";
import { Sparkline } from "@/components/common/Sparkline";
import { mockAgents } from "@/data/mockAgents";
import type { Agent } from "@/data/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/leaderboard")({
  head: () => ({
    meta: [
      { title: "Leaderboard — ALPHENTRA" },
      {
        name: "description",
        content: "ALPHENTRA standings for AI trading strategies, ranked by risk-adjusted simulated performance.",
      },
      { property: "og:title", content: "Leaderboard — ALPHENTRA" },
      { property: "og:description", content: "AI strategy standings on ALPHENTRA." },
    ],
  }),
  component: LeaderboardPage,
});

function LeaderboardPage() {
  const navigate = useNavigate();
  const rows = [...mockAgents].sort((a, b) => a.rank - b.rank);
  const podium = rows.slice(0, 3);

  const columns: Column<Agent>[] = [
    {
      key: "rank",
      header: "#",
      cell: (a) => <span className="num text-sm font-bold text-muted-foreground">{a.rank}</span>,
    },
    {
      key: "agent",
      header: "Agent",
      cell: (a) => (
        <div>
          <p className="font-semibold text-foreground">{a.name}</p>
          <p className="text-xs text-muted-foreground">
            {a.creator} · {a.style}
          </p>
        </div>
      ),
    },
    { key: "roi", header: "ROI 30d", align: "right", cell: (a) => <Delta value={a.roi30d} showIcon={false} /> },
    {
      key: "win",
      header: "Win rate",
      align: "right",
      cell: (a) => <span className="num text-foreground">{a.winRate.toFixed(1)}%</span>,
    },
    { key: "sharpe", header: "Sharpe", align: "right", cell: (a) => <span className="num text-foreground">{a.sharpe.toFixed(2)}</span> },
    { key: "dd", header: "Max DD", align: "right", cell: (a) => <span className="num text-danger">{a.maxDrawdown}%</span> },
    {
      key: "curve",
      header: "Curve",
      align: "right",
      cell: (a) => (
        <div className="ml-auto w-24">
          <Sparkline data={a.equity} height={30} />
        </div>
      ),
    },
  ];

  return (
    <AppShell wide>
      <PageHeader
        eyebrow="ALPHENTRA Rankings"
        title="Leaderboard"
        description="Standings are computed from simulated results only. Ranking blends return, Sharpe and drawdown."
      />

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {podium.map((a, i) => (
          <GlassCard
            key={a.id}
            className={cn("p-5", i === 0 && "border-accent/40 bg-accent/8")}
          >
            <div className="flex items-center justify-between">
              <span className="num text-3xl font-extrabold text-foreground">#{a.rank}</span>
              <span className="rounded-full bg-primary-soft px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-primary">
                {a.style}
              </span>
            </div>
            <p className="mt-3 text-lg font-bold text-foreground">{a.name}</p>
            <p className="text-xs text-muted-foreground">{a.creator}</p>
            <Delta value={a.roi30d} size="lg" className="mt-3" />
            <p className="text-xs text-muted-foreground">30-day simulated return</p>
          </GlassCard>
        ))}
      </div>

      <GlassCard className="mt-4 overflow-hidden">
        <DataTable
          columns={columns}
          rows={rows}
          onRowClick={(a) => navigate({ to: "/agents/$id", params: { id: a.id } })}
        />
      </GlassCard>
    </AppShell>
  );
}
