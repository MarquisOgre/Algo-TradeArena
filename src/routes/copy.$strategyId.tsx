import { useState } from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, CheckCircle2, Copy, ShieldCheck, WalletCards } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/common/PageHeader";
import { GlassCard } from "@/components/common/GlassCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getStrategy } from "@/data/strategies";

export const Route = createFileRoute("/copy/$strategyId")({
  loader: ({ params }) => {
    const strategy = getStrategy(params.strategyId);
    if (!strategy) throw notFound();
    return { strategy };
  },
  head: ({ loaderData }) => ({
    meta: [{ title: loaderData ? `Copy ${loaderData.strategy.name} — ALPHENTRA` : "Copy Strategy — ALPHENTRA" }],
  }),
  component: CopyStrategyPage,
});

function CopyStrategyPage() {
  const { strategy } = Route.useLoaderData();
  const [allocation, setAllocation] = useState("1000");
  const [ratio, setRatio] = useState("50");
  const [risk, setRisk] = useState("Balanced");
  const [maxDrawdown, setMaxDrawdown] = useState("10");
  const [started, setStarted] = useState(false);

  return (
    <AppShell wide>
      <Button asChild variant="ghost" size="sm" className="-ml-2 mb-3">
        <Link to="/copy"><ArrowLeft className="size-4" /> Copy Trading</Link>
      </Button>

      <PageHeader
        eyebrow="Copy Strategy · Paper Trading"
        title={strategy.name}
        description={strategy.description}
        actions={<Badge variant="outline">Prototype</Badge>}
      />

      <div className="mt-6 grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
        <GlassCard className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Copy configuration</p>
              <h2 className="mt-1 text-xl font-semibold">Set your paper allocation</h2>
            </div>
            <Copy className="size-5 text-primary" />
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <Field label="Allocation (ALPH)" value={allocation} onChange={setAllocation} />
            <Field label="Copy ratio (%)" value={ratio} onChange={setRatio} />
            <label className="space-y-2 text-sm">
              <span className="text-muted-foreground">Risk mode</span>
              <select value={risk} onChange={(event) => setRisk(event.target.value)} className="h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm text-foreground">
                <option>Conservative</option>
                <option>Balanced</option>
                <option>Full Strategy Risk</option>
              </select>
            </label>
            <Field label="Maximum drawdown (%)" value={maxDrawdown} onChange={setMaxDrawdown} />
          </div>

          <div className="mt-6 rounded-xl border border-border bg-surface/60 p-4">
            <div className="flex items-center gap-2 text-sm font-medium"><ShieldCheck className="size-4 text-success" /> Copy risk check</div>
            <div className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
              <span>Strategy drawdown: {Math.abs(strategy.backtest?.maxDrawdownPct ?? 0).toFixed(1)}%</span>
              <span>Risk mode: {risk}</span>
              <span>Copy ratio: {ratio}%</span>
              <span>Stop copy: {maxDrawdown}% drawdown</span>
            </div>
          </div>

          <Button className="mt-6 w-full" onClick={() => setStarted(true)}>
            <Copy /> {started ? "Paper Copy Active" : "Start Paper Copy"}
          </Button>
        </GlassCard>

        <div className="space-y-4">
          <GlassCard className="p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Strategy</p>
            <h2 className="mt-2 text-lg font-semibold">{strategy.name}</h2>
            <p className="mt-1 text-sm text-muted-foreground">Creator: {strategy.creator}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge variant="outline">{strategy.style}</Badge>
              <Badge variant="outline">Paper only</Badge>
              <Badge variant="outline">Simulated performance</Badge>
            </div>
          </GlassCard>

          <GlassCard className="p-5">
            <div className="flex items-center gap-2"><WalletCards className="size-4 text-primary" /><h2 className="text-sm font-semibold">ALPH payment context</h2></div>
            <p className="mt-3 text-sm text-muted-foreground">Strategy subscriptions are planned in ALPH. The current copy flow does not move real funds.</p>
            <Button asChild variant="outline" size="sm" className="mt-4"><Link to="/wallet">Open ALPH Wallet</Link></Button>
          </GlassCard>

          {started && (
            <GlassCard className="p-4 border-success/20">
              <div className="flex gap-2 text-sm text-success"><CheckCircle2 className="size-4" /> Paper copy configuration saved for this prototype session.</div>
            </GlassCard>
          )}
        </div>
      </div>
    </AppShell>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label className="space-y-2 text-sm"><span className="text-muted-foreground">{label}</span><input value={value} onChange={(event) => onChange(event.target.value)} inputMode="decimal" className="h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm text-foreground focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-ring/25" /></label>;
}
