import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowLeft, Eye, Timer, Trophy, Coins, CheckCircle2 } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/common/PageHeader";
import { GlassCard } from "@/components/common/GlassCard";
import { ChartCard } from "@/components/common/ChartCard";
import { DataTable, type Column } from "@/components/common/DataTable";
import { Delta } from "@/components/common/Delta";
import { Button } from "@/components/ui/button";
import { getBattle } from "@/data/mockBattles";
import { getStrategy } from "@/data/strategies";
import type { Strategy } from "@/data/types";
import { mockTrades } from "@/data/mockTrades";
import type { Trade } from "@/data/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/battle/$id")({
  loader: ({ params }) => {
    const battle = getBattle(params.id);
    if (!battle) throw notFound();
    return { battle };
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.battle.title} — ALPHENTRA` },
          { name: "description", content: `Simulated competition: ${loaderData.battle.format} on ${loaderData.battle.market}.` },
          { property: "og:title", content: `${loaderData.battle.title} — ALPHENTRA` },
          { property: "og:description", content: "Live AI strategy competition with simulated trading." },
        ]
      : [{ title: "Competition not found — ALPHENTRA" }, { name: "robots", content: "noindex" }],
  }),
  component: BattleDetail,
});

function EntryPanel({ status, strategy }: { status: string; strategy?: Strategy }) {
  const [entered, setEntered] = useState(false);
  const fee = 100;
  if (status === "Finished") return null;
  return (
    <GlassCard className="mt-6 border-primary/20 bg-primary-soft/30 p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2"><Coins className="size-5 text-primary" /><h2 className="font-semibold text-foreground">Enter this Arena</h2></div>
          <p className="mt-1 text-sm text-muted-foreground">Competition entry is settled in ALPHENTRA Token only.</p>
          <p className="mt-2 text-xs text-muted-foreground">Entry fee <span className="num font-semibold text-foreground">{fee} ALPH</span> · Rewards are paid in ALPHENTRA.</p>
          {strategy ? (
            <div className="mt-3 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Selected Strategy</p>
              <p className="mt-1 font-semibold text-foreground">{strategy.name}</p>
              <p className="text-[11px] text-muted-foreground">Strategy ID: {strategy.id}</p>
            </div>
          ) : (
            <p className="mt-3 text-xs text-amber-300">No strategy selected. Open the Marketplace and choose a strategy first.</p>
          )}
        </div>
        {entered ? (
          <div className="flex items-center gap-2 rounded-lg border border-success/30 bg-success/10 px-4 py-2 text-sm font-medium text-success"><CheckCircle2 className="size-4" /> Entry reserved</div>
        ) : (
          <button type="button" onClick={() => {
            if (!strategy) return;
            if (typeof window !== "undefined") {
              window.localStorage.setItem(`alphentra.arena.entry.${status}`, JSON.stringify({ battleId: window.location.pathname.split("/").pop(), strategyId: strategy.id, fee, enteredAt: new Date().toISOString() }));
            }
            setEntered(true);
          }} disabled={status === "Live" || !strategy} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50">{status === "Live" ? "Entry Closed" : `Enter for ${fee} ALPH`}</button>
        )}
      </div>
      <p className="mt-3 text-[11px] text-muted-foreground">Prototype flow — no real token transfer occurs.</p>
    </GlassCard>
  );
}

function BattleDetail() {
  const { battle } = Route.useLoaderData();
  const [selectedStrategy, setSelectedStrategy] = useState<Strategy>();

  useEffect(() => {
    const id = window.localStorage.getItem("alphentra.arena.selectedStrategyId");
    if (id) setSelectedStrategy(getStrategy(id));
  }, []);
  const chart = battle.left.equity.map((v, i) => ({
    session: `S${i + 1}`,
    [battle.left.name]: v,
    [battle.right.name]: battle.right.equity[i] ?? v,
  }));

  const columns: Column<Trade>[] = [
    { key: "time", header: "Time", cell: (t) => <span className="num text-muted-foreground">{t.time}</span> },
    { key: "agent", header: "Agent", cell: (t) => <span className="text-foreground">{t.agent}</span> },
    { key: "symbol", header: "Symbol", cell: (t) => <span className="num font-semibold text-foreground">{t.symbol}</span> },
    {
      key: "side",
      header: "Side",
      cell: (t) => (
        <span className={cn("num text-xs font-bold", t.side === "BUY" ? "text-success" : "text-danger")}>
          {t.side}
        </span>
      ),
    },
    { key: "qty", header: "Qty", align: "right", cell: (t) => <span className="num">{t.qty}</span> },
    { key: "price", header: "Price", align: "right", cell: (t) => <span className="num">{t.price.toFixed(2)}</span> },
    { key: "pnl", header: "P&L", align: "right", cell: (t) => <Delta value={t.pnl} suffix="" showIcon={false} /> },
  ];

  const sides = [battle.left, battle.right];

  return (
    <AppShell wide>
      <Button asChild variant="ghost" size="sm" className="-ml-2 mb-3">
        <Link to="/battle">
          <ArrowLeft className="size-4" /> Back to arena
        </Link>
      </Button>

      <PageHeader
        eyebrow={`${battle.status} · ${battle.market}`}
        title={battle.title}
        description={`${battle.format}. Both strategies start with identical simulated capital.`}
        actions={
          <>
            <span className="flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 text-xs text-muted-foreground">
              <Eye className="size-3.5" /> <span className="num">{battle.spectators.toLocaleString()}</span>
            </span>
            <span className="flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 text-xs text-muted-foreground">
              <Timer className="size-3.5" /> {battle.startsIn ?? battle.duration}
            </span>
            <span className="flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/10 px-3 py-1.5 text-xs font-semibold text-accent">
              <Trophy className="size-3.5" /> {battle.prizePool}
            </span>
          </>
        }
      />

      <EntryPanel status={battle.status} strategy={selectedStrategy} />

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {sides.map((s, i) => (
          <GlassCard
            key={s.agentId}
            className={cn(
              "p-5",
              s.pnlPct >= (sides[1 - i]?.pnlPct ?? 0) && "border-primary/40 bg-primary-soft",
            )}
          >
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              {i === 0 ? "Side A" : "Side B"}
            </p>
            <Link to="/agents/$id" params={{ id: s.agentId }} className="text-lg font-bold text-foreground hover:underline">
              {s.name}
            </Link>
            <Delta value={s.pnlPct} size="lg" className="mt-2" />
            <p className="mt-1 text-xs text-muted-foreground">Simulated return since duel start</p>
          </GlassCard>
        ))}
      </div>

      <ChartCard
        className="mt-4"
        title="Equity curves"
        subtitle="Simulated account value per session, indexed to 100"
      >
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chart} margin={{ left: -18, right: 8, top: 8, bottom: 0 }}>
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
              <Line type="monotone" dataKey={battle.left.name} stroke="var(--color-primary)" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey={battle.right.name} stroke="var(--color-accent)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      <GlassCard className="mt-4 overflow-hidden">
        <div className="border-b border-border px-5 py-4">
          <h3 className="text-sm font-semibold text-foreground">Competition trade tape</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">Simulated fills — no orders reach a broker.</p>
        </div>
        <DataTable columns={columns} rows={mockTrades.slice(0, 8)} />
      </GlassCard>
    </AppShell>
  );
}
