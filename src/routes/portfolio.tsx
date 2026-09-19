import { createFileRoute, Link } from "@tanstack/react-router";
import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Wallet } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/common/PageHeader";
import { GlassCard } from "@/components/common/GlassCard";
import { ChartCard } from "@/components/common/ChartCard";
import { StatCard } from "@/components/common/StatCard";
import { DataTable, type Column } from "@/components/common/DataTable";
import { Delta, formatMoney } from "@/components/common/Delta";
import { Button } from "@/components/ui/button";
import { allocation, equityCurve, mockPositions, portfolioSummary } from "@/data/mockPortfolio";
import { mockTrades } from "@/data/mockTrades";
import type { Position, Trade } from "@/data/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/portfolio")({
  head: () => ({
    meta: [
      { title: "Paper Portfolio — ALPHENTRA" },
      {
        name: "description",
        content: "Your simulated paper portfolio: equity curve, open positions, allocation and simulated trade history.",
      },
      { property: "og:title", content: "Paper Portfolio — ALPHENTRA" },
      { property: "og:description", content: "ALPHENTRA simulated paper portfolio and positions." },
    ],
  }),
  component: PortfolioPage,
});

const pieColors = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
];

function PortfolioPage() {
  const positionColumns: Column<Position>[] = [
    {
      key: "sym",
      header: "Position",
      cell: (p) => (
        <div>
          <p className="num text-sm font-bold text-foreground">{p.symbol}</p>
          <p className="text-xs text-muted-foreground">{p.name}</p>
        </div>
      ),
    },
    { key: "qty", header: "Qty", align: "right", cell: (p) => <span className="num">{p.qty}</span> },
    { key: "avg", header: "Avg price", align: "right", cell: (p) => <span className="num">{p.avgPrice.toFixed(2)}</span> },
    { key: "last", header: "Last", align: "right", cell: (p) => <span className="num text-foreground">{p.last.toFixed(2)}</span> },
    { key: "pnl", header: "P&L", align: "right", cell: (p) => <Delta value={p.pnl} suffix="" showIcon={false} /> },
    { key: "pnlpct", header: "Return", align: "right", cell: (p) => <Delta value={p.pnlPct} showIcon={false} /> },
    { key: "w", header: "Weight", align: "right", cell: (p) => <span className="num text-muted-foreground">{p.weight}%</span> },
  ];

  const tradeColumns: Column<Trade>[] = [
    { key: "time", header: "Time", cell: (t) => <span className="num text-muted-foreground">{t.time}</span> },
    { key: "sym", header: "Symbol", cell: (t) => <span className="num font-semibold text-foreground">{t.symbol}</span> },
    {
      key: "side",
      header: "Side",
      cell: (t) => (
        <span className={cn("num text-xs font-bold", t.side === "BUY" ? "text-success" : "text-danger")}>{t.side}</span>
      ),
    },
    { key: "agent", header: "Executed by", cell: (t) => <span className="text-muted-foreground">{t.agent}</span> },
    { key: "pnl", header: "P&L", align: "right", cell: (t) => <Delta value={t.pnl} suffix="" showIcon={false} /> },
    { key: "status", header: "Status", align: "right", cell: (t) => <span className="text-muted-foreground">{t.status}</span> },
  ];

  return (
    <AppShell wide>
      <PageHeader
        eyebrow="Paper account"
        title="Portfolio"
        description="A simulated account funded with virtual capital. Nothing here settles with a broker."
        actions={
          <Button asChild>
            <Link to="/trade">
              <Wallet className="size-4" /> Place a paper trade
            </Link>
          </Button>
        }
      />

      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Account value" value={formatMoney(portfolioSummary.equity)} delta={portfolioSummary.dayPnlPct} hint="today" />
        <StatCard label="Total P&L" value={formatMoney(portfolioSummary.totalPnl)} delta={portfolioSummary.totalPnlPct} hint="since funding" />
        <StatCard label="Cash" value={formatMoney(portfolioSummary.cash)} hint="settled virtual cash" />
        <StatCard label="Buying power" value={formatMoney(portfolioSummary.buyingPower)} hint="2x simulated margin" />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[2fr_1fr]">
        <ChartCard title="Equity curve" subtitle="Simulated account value over the last 60 sessions">
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={equityCurve} margin={{ left: 4, right: 8, top: 8, bottom: 0 }}>
                <defs>
                  <linearGradient id="pf" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-success)" stopOpacity={0.32} />
                    <stop offset="100%" stopColor="var(--color-success)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} tickLine={false} axisLine={false} minTickGap={24} />
                <YAxis
                  tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                  tickLine={false}
                  axisLine={false}
                  domain={["auto", "auto"]}
                  tickFormatter={(v: number) => `${Math.round(v / 1000)}k`}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--color-popover)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                />
                <Area type="monotone" dataKey="value" stroke="var(--color-success)" strokeWidth={2} fill="url(#pf)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Allocation" subtitle="Simulated exposure by sleeve">
          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={allocation} dataKey="value" nameKey="name" innerRadius={52} outerRadius={80} paddingAngle={3} stroke="none">
                  {allocation.map((entry, i) => (
                    <Cell key={entry.name} fill={pieColors[i % pieColors.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "var(--color-popover)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="mt-2 space-y-2">
            {allocation.map((a, i) => (
              <li key={a.name} className="flex items-center gap-2 text-sm">
                <span className="size-2.5 rounded-full" style={{ background: pieColors[i % pieColors.length] }} />
                <span className="flex-1 text-muted-foreground">{a.name}</span>
                <span className="num font-semibold text-foreground">{a.value}%</span>
              </li>
            ))}
          </ul>
        </ChartCard>
      </div>

      <GlassCard className="mt-4 overflow-hidden">
        <div className="border-b border-border px-5 py-4">
          <h3 className="text-sm font-semibold text-foreground">Open positions</h3>
        </div>
        <DataTable columns={positionColumns} rows={mockPositions} />
      </GlassCard>

      <GlassCard className="mt-4 overflow-hidden">
        <div className="border-b border-border px-5 py-4">
          <h3 className="text-sm font-semibold text-foreground">Simulated activity</h3>
        </div>
        <DataTable columns={tradeColumns} rows={mockTrades} />
      </GlassCard>
    </AppShell>
  );
}
