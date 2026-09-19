import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowLeft, Trophy } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/common/PageHeader";
import { GlassCard } from "@/components/common/GlassCard";
import { ChartCard } from "@/components/common/ChartCard";
import { StatCard } from "@/components/common/StatCard";
import { DataTable, type Column } from "@/components/common/DataTable";
import { Delta } from "@/components/common/Delta";
import { Button } from "@/components/ui/button";
import { getAgent } from "@/data/mockAgents";
import { mockTrades } from "@/data/mockTrades";
import type { Trade } from "@/data/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/agents/$id")({
  loader: ({ params }) => {
    const agent = getAgent(params.id);
    if (!agent) throw notFound();
    return { agent };
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.agent.name} — ALPHENTRA` },
          { name: "description", content: loaderData.agent.tagline },
          { property: "og:title", content: `${loaderData.agent.name} — ALPHENTRA` },
          { property: "og:description", content: loaderData.agent.tagline },
        ]
      : [{ title: "Agent not found — ALPHENTRA" }, { name: "robots", content: "noindex" }],
  }),
  component: AgentDetail,
});

function AgentDetail() {
  const { agent } = Route.useLoaderData();
  const chart = agent.equity.map((v, i) => ({ session: `S${i + 1}`, value: v }));
  const trades = mockTrades.filter((t) => t.agent === agent.name);

  const columns: Column<Trade>[] = [
    { key: "time", header: "Time", cell: (t) => <span className="num text-muted-foreground">{t.time}</span> },
    { key: "symbol", header: "Symbol", cell: (t) => <span className="num font-semibold text-foreground">{t.symbol}</span> },
    {
      key: "side",
      header: "Side",
      cell: (t) => (
        <span className={cn("num text-xs font-bold", t.side === "BUY" ? "text-success" : "text-danger")}>{t.side}</span>
      ),
    },
    { key: "qty", header: "Qty", align: "right", cell: (t) => <span className="num">{t.qty}</span> },
    { key: "price", header: "Price", align: "right", cell: (t) => <span className="num">{t.price.toFixed(2)}</span> },
    { key: "pnl", header: "P&L", align: "right", cell: (t) => <Delta value={t.pnl} suffix="" showIcon={false} /> },
    { key: "status", header: "Status", align: "right", cell: (t) => <span className="text-muted-foreground">{t.status}</span> },
  ];

  return (
    <AppShell wide>
      <Button asChild variant="ghost" size="sm" className="-ml-2 mb-3">
        <Link to="/agents">
          <ArrowLeft className="size-4" /> All agents
        </Link>
      </Button>

      <PageHeader
        eyebrow={`AI Strategy · Rank #${agent.rank} · ${agent.style}`}
        title={agent.name}
        description={agent.tagline}
        actions={
          <>
            <Button variant="outline">Follow</Button>
            <Button asChild>
              <Link to="/battle">Challenge to a duel</Link>
            </Button>
          </>
        }
      />

      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="ROI 30d" value={`${agent.roi30d > 0 ? "+" : ""}${agent.roi30d.toFixed(1)}%`} delta={agent.roi30d} />
        <StatCard label="ROI all time" value={`+${agent.roiAll.toFixed(1)}%`} hint="simulated" />
        <StatCard label="Win rate" value={`${agent.winRate.toFixed(1)}%`} hint={`${agent.trades.toLocaleString()} trades`} />
        <StatCard label="Sharpe" value={agent.sharpe.toFixed(2)} hint={`max DD ${agent.maxDrawdown}%`} />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[2fr_1fr]">
        <ChartCard title="Simulated equity curve" subtitle="Indexed to 100 at inception">
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chart} margin={{ left: -18, right: 8, top: 8, bottom: 0 }}>
                <defs>
                  <linearGradient id="agentArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="session" tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} tickLine={false} axisLine={false} domain={["auto", "auto"]} />
                <Tooltip
                  contentStyle={{
                    background: "var(--color-popover)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                />
                <Area type="monotone" dataKey="value" stroke="var(--color-primary)" strokeWidth={2} fill="url(#agentArea)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <div className="space-y-4">
          <GlassCard className="p-5">
            <h3 className="text-sm font-semibold text-foreground">Strategy</h3>
            <p className="mt-2 text-sm text-muted-foreground">{agent.strategy}</p>
            <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-4 text-sm">
              <div>
                <dt className="text-xs text-muted-foreground">Creator</dt>
                <dd className="text-foreground">{agent.creator}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Status</dt>
                <dd className="text-foreground">{agent.status}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Followers</dt>
                <dd className="num text-foreground">{agent.followers.toLocaleString()}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Max drawdown</dt>
                <dd className="num text-danger">{agent.maxDrawdown}%</dd>
              </div>
            </dl>
          </GlassCard>

          <GlassCard className="p-5">
            <h3 className="text-sm font-semibold text-foreground">Traded markets</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {agent.markets.map((m) => (
                <span key={m} className="num rounded-lg border border-border bg-surface-2 px-2.5 py-1 text-xs font-semibold text-foreground">
                  {m}
                </span>
              ))}
            </div>
          </GlassCard>
        </div>
      </div>

      <GlassCard className="mt-4 overflow-hidden">
        <div className="border-b border-border px-5 py-4">
          <h3 className="text-sm font-semibold text-foreground">Recent simulated trades</h3>
        </div>
        <DataTable columns={columns} rows={trades} empty="No simulated fills in the current session." />
      </GlassCard>
    </AppShell>
  );
}
