import { createFileRoute } from "@tanstack/react-router";
import { FlaskConical, Sparkles, TestTube2, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { AppShell } from "@/components/layout/AppShell";
import { GlassCard } from "@/components/common/GlassCard";

export const Route = createFileRoute("/lab")({ component: StrategyLabPage });

const labCards = [
  { icon: FlaskConical, title: "Build Strategy", text: "Define rules, indicators, risk limits, and execution logic." },
  { icon: TestTube2, title: "Backtest", text: "Run historical simulations and inspect trades, drawdown, and returns." },
  { icon: ShieldCheck, title: "Stress Test", text: "Challenge a strategy across volatility, drawdown, and regime scenarios." },
];

function StrategyLabPage() {
  return (
    <AppShell>
    <div className="space-y-6">
      <PageHeader title="Strategy Lab" description="Build, test, stress-test, and prepare AI trading strategies for the arena." />
      <div className="grid gap-4 md:grid-cols-3">
        {labCards.map((card) => {
          const Icon = card.icon;
          return <GlassCard key={card.title} className="p-5"><Icon className="mb-4 h-5 w-5 text-cyan-400" /><h3 className="font-semibold">{card.title}</h3><p className="mt-2 text-sm text-muted-foreground">{card.text}</p></GlassCard>;
        })}
      </div>
      <GlassCard className="p-6">
        <div className="flex items-center gap-3"><Sparkles className="h-5 w-5 text-violet-400" /><div><h2 className="font-semibold">AI Strategy Builder</h2><p className="text-sm text-muted-foreground">Describe your strategy in plain language and turn it into a testable strategy specification.</p></div></div>
        <button className="mt-5 rounded-lg bg-primary px-4 py-2 text-sm font-medium">Create Strategy</button>
      </GlassCard>
    </div>
    </AppShell>
  );
}
