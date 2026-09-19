import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowRight,
  Check,
  ChevronRight,
  FlaskConical,
  Gauge,
  LineChart,
  Play,
  Save,
  ShieldCheck,
  Sparkles,
  TestTube2,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/common/PageHeader";
import { GlassCard } from "@/components/common/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/lab")({
  head: () => ({
    meta: [
      { title: "Strategy Lab — ALPHENTRA" },
      {
        name: "description",
        content: "Build, backtest, stress-test, and prepare AI trading strategies for the ALPHENTRA arena.",
      },
    ],
  }),
  component: StrategyLabPage,
});

const steps = [
  { id: "build", label: "Build", icon: FlaskConical },
  { id: "backtest", label: "Backtest", icon: LineChart },
  { id: "stress", label: "Stress Test", icon: ShieldCheck },
  { id: "forward", label: "Forward Test", icon: TestTube2 },
  { id: "publish", label: "Publish", icon: Save },
] as const;

const backtestStats = [
  { label: "Net return", value: "+24.8%", note: "simulated" },
  { label: "Max drawdown", value: "-8.6%", note: "peak to trough" },
  { label: "Win rate", value: "61.4%", note: "184 trades" },
  { label: "Sharpe", value: "1.72", note: "annualized" },
];

function StrategyLabPage() {
  const [step, setStep] = useState(0);
  const [strategyName, setStrategyName] = useState("Momentum Alpha");
  const [prompt, setPrompt] = useState(
    "Build a momentum strategy for major FX pairs using trend confirmation, volatility-aware position sizing, and a strict 1% risk limit per trade.",
  );
  const [running, setRunning] = useState(false);
  const [completed, setCompleted] = useState<number[]>([]);

  const current = steps[step];

  const progress = useMemo(() => Math.round((step / (steps.length - 1)) * 100), [step]);

  function nextStep() {
    setCompleted((items) => (items.includes(step) ? items : [...items, step]));
    setStep((value) => Math.min(value + 1, steps.length - 1));
  }

  function runBacktest() {
    setRunning(true);
    window.setTimeout(() => {
      setRunning(false);
      setCompleted((items) => (items.includes(1) ? items : [...items, 1]));
      setStep(2);
    }, 700);
  }

  return (
    <AppShell wide>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Build · Test · Deploy"
          title="Strategy Lab"
          description="Turn an idea into a measurable strategy, then prepare it for forward testing and the ALPHENTRA Arena."
          actions={
            <Badge variant="outline" className="border-primary/30 bg-primary/5 text-primary">
              Prototype workflow
            </Badge>
          }
        />

        <GlassCard className="overflow-hidden">
          <div className="flex flex-col gap-4 border-b border-border p-4 lg:flex-row lg:items-center lg:justify-between lg:p-5">
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {steps.map((item, index) => {
                const Icon = item.icon;
                const active = index === step;
                const done = completed.includes(index);
                return (
                  <button
                    key={item.id}
                    onClick={() => setStep(index)}
                    className={`flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition-colors ${
                      active
                        ? "bg-primary text-primary-foreground"
                        : done
                          ? "bg-success/10 text-success"
                          : "bg-surface-2 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {done ? <Check className="size-3.5" /> : <Icon className="size-3.5" />}
                    {item.label}
                  </button>
                );
              })}
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <div className="h-1.5 w-28 overflow-hidden rounded-full bg-surface-2">
                <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
              </div>
              <span>{progress}% complete</span>
            </div>
          </div>

          <div className="p-5 lg:p-7">
            {step === 0 && (
              <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
                <div className="space-y-5">
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Strategy name</label>
                    <Input value={strategyName} onChange={(event) => setStrategyName(event.target.value)} className="mt-2" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Strategy specification</label>
                      <span className="text-[11px] text-muted-foreground">Natural language</span>
                    </div>
                    <Textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} className="mt-2 min-h-40 resize-none" />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {["Forex", "Momentum", "1% Risk", "Volatility Filter"].map((tag) => (
                      <Badge key={tag} variant="outline" className="border-border bg-surface">{tag}</Badge>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button onClick={nextStep}><Sparkles />Generate Strategy</Button>
                    <Button variant="outline" onClick={() => setPrompt("")}>Clear</Button>
                  </div>
                </div>

                <GlassCard className="bg-surface/40 p-5">
                  <div className="flex items-start gap-3">
                    <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Sparkles className="size-5" />
                    </div>
                    <div>
                      <p className="font-semibold">AI Strategy Builder</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        The prototype converts your description into a structured strategy specification. Live model generation will plug into this step later.
                      </p>
                    </div>
                  </div>
                  <div className="mt-5 space-y-2 text-sm">
                    {["Entry: trend confirmation", "Exit: momentum reversal", "Risk: 1% per position", "Universe: major FX pairs"].map((item) => (
                      <div key={item} className="flex items-center gap-2 rounded-lg bg-background/50 px-3 py-2">
                        <Check className="size-3.5 text-success" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </GlassCard>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">Historical simulation</p>
                    <h2 className="mt-1 text-xl font-semibold">{strategyName || "Untitled Strategy"}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">EUR/USD · GBP/USD · USD/JPY · 5-year sample · simulated execution</p>
                  </div>
                  <Button onClick={runBacktest} disabled={running}>
                    <Play />{running ? "Running..." : "Run Backtest"}
                  </Button>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {backtestStats.map((stat) => (
                    <div key={stat.label} className="rounded-xl border border-border bg-surface/50 p-4">
                      <p className="text-xs text-muted-foreground">{stat.label}</p>
                      <p className="num mt-2 text-2xl font-bold">{stat.value}</p>
                      <p className="mt-1 text-[11px] text-muted-foreground">{stat.note}</p>
                    </div>
                  ))}
                </div>
                <div className="grid gap-4 lg:grid-cols-[1.4fr_0.6fr]">
                  <div className="rounded-xl border border-border bg-background/40 p-5">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold">Equity curve</p>
                      <span className="text-xs text-success">Simulated</span>
                    </div>
                    <div className="mt-6 flex h-40 items-end gap-1">
                      {[22, 27, 25, 34, 31, 40, 44, 39, 51, 48, 60, 57, 68, 64, 74, 71, 83, 79, 92].map((height, index) => (
                        <div key={index} className="flex-1 rounded-t bg-primary/60" style={{ height: `${height}%` }} />
                      ))}
                    </div>
                  </div>
                  <div className="rounded-xl border border-border bg-background/40 p-5">
                    <p className="text-sm font-semibold">Risk diagnostics</p>
                    <div className="mt-4 space-y-3 text-sm">
                      {["No leverage breach", "Position cap respected", "Stop-loss coverage 96%", "Outlier loss contained"].map((item) => (
                        <div key={item} className="flex items-center gap-2"><ShieldCheck className="size-4 text-success" />{item}</div>
                      ))}
                    </div>
                  </div>
                </div>
                <Button variant="outline" onClick={() => setStep(0)}>Back to Build</Button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-5">
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Scenario analysis</p>
                  <h2 className="mt-1 text-xl font-semibold">Stress-test {strategyName || "your strategy"}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">Challenge the strategy against volatility spikes, spread expansion, and adverse market regimes.</p>
                </div>
                <div className="grid gap-3 md:grid-cols-3">
                  {[
                    ["Volatility shock", "VIX +80%", "-11.2%", "Contained"],
                    ["Spread expansion", "2.5× normal", "-6.4%", "Contained"],
                    ["Trend reversal", "Rapid regime flip", "-9.1%", "Contained"],
                  ].map(([name, scenario, impact, status]) => (
                    <GlassCard key={name} className="p-5">
                      <div className="flex items-center justify-between"><Gauge className="size-5 text-cyan-400" /><Badge variant="outline" className="border-success/30 text-success">{status}</Badge></div>
                      <h3 className="mt-4 font-semibold">{name}</h3>
                      <p className="mt-1 text-xs text-muted-foreground">{scenario}</p>
                      <p className="num mt-5 text-2xl font-bold">{impact}</p>
                    </GlassCard>
                  ))}
                </div>
                <div className="rounded-xl border border-success/20 bg-success/5 p-4 text-sm text-muted-foreground">
                  <ShieldCheck className="mr-2 inline size-4 text-success" />Stress profile is within the prototype risk guardrails. This is simulated output, not a guarantee of future performance.
                </div>
                <Button onClick={nextStep}><ArrowRight />Continue to Forward Test</Button>
              </div>
            )}

            {step === 3 && (
              <div className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Paper environment</p>
                  <h2 className="mt-1 text-xl font-semibold">Forward Test</h2>
                  <p className="mt-2 text-sm text-muted-foreground">Run the strategy against live market data in a paper environment before publishing it to the marketplace or Arena.</p>
                  <div className="mt-5 space-y-3">
                    {[
                      ["Paper balance", "$100,000"],
                      ["Risk per trade", "1.0%"],
                      ["Max drawdown guard", "10%"],
                      ["Minimum observation", "30 days"],
                    ].map(([label, value]) => (
                      <div key={label} className="flex items-center justify-between rounded-lg border border-border bg-surface/40 px-4 py-3 text-sm">
                        <span className="text-muted-foreground">{label}</span><span className="font-medium">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <GlassCard className="p-5">
                  <Badge variant="outline" className="border-warning/30 text-warning">Paper trading only</Badge>
                  <p className="mt-4 text-sm text-muted-foreground">No real orders are sent from Strategy Lab. Broker execution will be connected after the paper workflow is validated.</p>
                  <Button className="mt-5 w-full" onClick={nextStep}>Start Forward Test <ArrowRight /></Button>
                </GlassCard>
              </div>
            )}

            {step === 4 && (
              <div className="mx-auto max-w-2xl text-center">
                <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-success/10 text-success"><Check className="size-7" /></div>
                <h2 className="mt-5 text-2xl font-semibold">Ready to publish</h2>
                <p className="mt-2 text-sm text-muted-foreground">Your strategy has completed the prototype validation path. Save it now, then connect marketplace subscriptions and Arena eligibility later.</p>
                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  {["Backtest complete", "Stress test complete", "Forward test ready"].map((item) => (
                    <div key={item} className="rounded-xl border border-border bg-surface/50 p-4 text-sm"><Check className="mx-auto mb-2 size-4 text-success" />{item}</div>
                  ))}
                </div>
                <Button className="mt-6" onClick={() => setCompleted((items) => (items.includes(4) ? items : [...items, 4]))}><Save />Save Strategy</Button>
                <p className="mt-3 text-xs text-muted-foreground">Prototype only — publishing does not create a live trading account.</p>
              </div>
            )}
          </div>

          {step < 4 && (
            <div className="flex items-center justify-between border-t border-border bg-surface/30 px-5 py-4">
              <span className="text-xs text-muted-foreground">Step {step + 1} of {steps.length} · {current.label}</span>
              <Button variant="outline" size="sm" onClick={nextStep}>
                Continue <ChevronRight />
              </Button>
            </div>
          )}
        </GlassCard>
      </div>
    </AppShell>
  );
}
