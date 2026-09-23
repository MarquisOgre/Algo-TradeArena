import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowRight,
  Check,
  ChevronRight,
  FlaskConical,
  LineChart,
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
import { saveStrategy } from "@/data/strategies";
import { StrategyRuleBuilder, type StrategyRuleDefinition } from "@/components/strategy/StrategyRuleBuilder";
import { BacktestResults } from "@/components/strategy/BacktestResults";
import { validateStrategyDefinition } from "@/lib/strategy/condition-engine";\nimport { supabase } from "@/lib/supabase";\nimport type { BacktestResult } from "@/lib/strategy/backtest-engine-v2";\nimport { runStrategyStressTest, type StressTestResult } from "@/lib/strategy/stress-test";\nimport { runForwardTestCycle, startForwardTest } from "@/lib/strategy/forward-test";

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



function StrategyLabPage() {
  const [step, setStep] = useState(0);
  const [strategyName, setStrategyName] = useState("Momentum Alpha");
  const [prompt, setPrompt] = useState(
    "Build a momentum strategy for major FX pairs using trend confirmation, volatility-aware position sizing, and a strict 1% risk limit per trade.",
  );
  const [completed, setCompleted] = useState<number[]>([]);
  const [savedStrategyId, setSavedStrategyId] = useState<string | null>(null);\n  const [backtestRunId, setBacktestRunId] = useState<string | null>(null);\n  const [backtestResult, setBacktestResult] = useState<BacktestResult | null>(null);\n  const [stressResult, setStressResult] = useState<StressTestResult | null>(null);\n  const [backtestMarketId, setBacktestMarketId] = useState<string | null>(null);\n  const [backtestTimeframe, setBacktestTimeframe] = useState<"5m" | "15m" | "1h" | "4h" | "1d">("5m");\n  const [stressRunning, setStressRunning] = useState(false);\n  const [forwardTestId, setForwardTestId] = useState<string | null>(null);\n  const [forwardRunning, setForwardRunning] = useState(false);\n  const [forwardEvent, setForwardEvent] = useState<{ signal: string; action: string; price: number } | null>(null);\n  const [aiRunning, setAiRunning] = useState(false);\n  const [aiError, setAiError] = useState<string | null>(null);
  const [rules, setRules] = useState<StrategyRuleDefinition>({
    entryOperator: "AND",
    entry: [
      { indicator: "EMA", period: 20, comparator: "gt", value: "EMA(50)" },
      { indicator: "PRICE", comparator: "crosses_above", value: "HIGH(20)" },
    ],
    exitOperator: "OR",
    exit: [
      { indicator: "PRICE", comparator: "lt", value: "EMA(20)" },
    ],
    stopLossPct: 1,
    takeProfitPct: 2,
    trailingStopPct: 0,
    riskPerTradePct: 1,
    positionSizing: "risk_percent",
  });

  const current = steps[step];
  const ruleValidation = validateStrategyDefinition(rules);

  async function generateWithAI() {
    setAiRunning(true);
    setAiError(null);
    try {
      const { data, error } = await supabase.functions.invoke("ai-strategy-builder", { body: { prompt } });
      if (error) throw error;
      const generated = data?.definition as StrategyRuleDefinition | undefined;
      if (!generated) throw new Error("AI returned no strategy definition.");
      const validation = validateStrategyDefinition(generated);
      if (!validation.valid) throw new Error(validation.errors.join(" "));
      setRules(generated);
      setCompleted((items) => items.filter((item) => item !== 0));
    } catch (error) {
      setAiError(error instanceof Error ? error.message : "AI strategy generation failed.");
    } finally {
      setAiRunning(false);
    }
  }

  const progress = useMemo(() => Math.round((step / (steps.length - 1)) * 100), [step]);
  const canEnterStep = (index: number) => {
    if (index === 0) return true;
    if (index === 1) return ruleValidation.valid;
    if (index === 2) return Boolean(backtestResult);
    if (index === 3) return Boolean(stressResult);
    return Boolean(forwardTestId && forwardEvent);
  };

  function nextStep() {
    if (step === 0 && !ruleValidation.valid) return;
    setCompleted((items) => (items.includes(step) ? items : [...items, step]));
    setStep((value) => Math.min(value + 1, steps.length - 1));
  }

  function saveCurrentStrategy() {
    const saved = saveStrategy({
      name: strategyName,
      description: "Strategy created in ALPHENTRA Strategy Lab.",
      specification: prompt,
      style: "Momentum",
      markets: ["Forex"],
      riskLimit: 1,
      status: "Draft",
      definition: rules,
    });
    setSavedStrategyId(saved.id);
    setCompleted((items) => (items.includes(4) ? items : [...items, 4]));
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
              MT5 Strategy Lab
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
                    onClick={() => { if (canEnterStep(index)) setStep(index); }}\n                    disabled={!canEnterStep(index)}
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

                  <StrategyRuleBuilder value={rules} onChange={setRules} />
                  <div className="flex flex-wrap gap-2">
                    <Button onClick={async () => { await generateWithAI(); }} disabled={aiRunning || !prompt.trim()}><Sparkles />{aiRunning ? "Generating with AI…" : "Generate with AI"}</Button>\n                    <Button onClick={nextStep} disabled={!ruleValidation.valid}><ArrowRight />Use Current Rules</Button>
                    {aiError && <div className="w-full rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-xs text-destructive">{aiError}</div>}\n                    {!ruleValidation.valid && (
                      <div className="w-full rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-xs text-destructive">
                        {ruleValidation.errors.map((error) => <p key={error}>{error}</p>)}
                      </div>
                    )}
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
                        The AI Strategy Builder converts your natural-language idea into validated, backtestable rules. It does not promise profitability; generated strategies must still pass backtest, stress, and paper forward gates.
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
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Historical simulation</p>
                  <h2 className="mt-1 text-xl font-semibold">{strategyName || "Untitled Strategy"}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">Select an instrument from the live MT5 universe and run the current rule set against stored MT5 historical candles.</p>
                </div>
                <BacktestResults definition={rules} strategyName={strategyName} onBacktestComplete={(id, result, marketId, timeframe) => { setBacktestRunId(id); setBacktestResult(result); setBacktestMarketId(marketId); setBacktestTimeframe(timeframe); setStressResult(null); setCompleted((items) => items.includes(1) ? items : [...items, 1]); }} />
                <Button variant="outline" onClick={() => setStep(0)}>Back to Build</Button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-5">
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Scenario analysis</p>
                  <h2 className="mt-1 text-xl font-semibold">Stress-test {strategyName || "your strategy"}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">Run deterministic cost, slippage, volatility, and adverse-drift scenarios against the same MT5 history used by the backtest.</p>
                </div>
                {!backtestResult || !backtestMarketId ? (
                  <div className="rounded-xl border border-warning/20 bg-warning/5 p-4 text-sm text-muted-foreground">Run a completed MT5 backtest first. Stress testing uses that run's instrument and timeframe.</div>
                ) : (
                  <>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline">{backtestTimeframe}</Badge>
                      <span className="text-xs text-muted-foreground">Baseline return {backtestResult.netReturnPct.toFixed(2)}% · DD {backtestResult.maxDrawdownPct.toFixed(2)}%</span>
                      <Button className="ml-auto" disabled={stressRunning} onClick={async () => {
                        setStressRunning(true);
                        try {
                          const result = await runStrategyStressTest({ definition: { entry: { operator: rules.entryOperator, conditions: rules.entry }, exit: { operator: rules.exitOperator, conditions: rules.exit }, stopLossPct: rules.stopLossPct, takeProfitPct: rules.takeProfitPct, trailingStopPct: rules.trailingStopPct, riskPerTradePct: rules.riskPerTradePct, positionSizing: rules.positionSizing }, marketId: backtestMarketId, timeframe: backtestTimeframe, initialCapital: backtestResult.initialCapital, maxBars: Math.min(240, Math.max(30, backtestResult.equityCurve.length)) });
                          setStressResult(result);
                          setCompleted((items) => items.includes(2) ? items : [...items, 2]);
                        } catch (error) {
                          setStressResult(null);
                          console.error(error);
                        } finally { setStressRunning(false); }
                      }}>{stressRunning ? "Running Stress Tests…" : "Run Real Stress Test"} <ArrowRight /></Button>
                    </div>
                    {stressResult && (
                      <div className="grid gap-3 md:grid-cols-2">
                        {stressResult.scenarios.map((scenario) => (
                          <GlassCard key={scenario.id} className="p-5">
                            <div className="flex items-center justify-between"><Gauge className="size-5 text-primary" /><Badge variant="outline">{scenario.result.trades.length} trades</Badge></div>
                            <h3 className="mt-4 font-semibold">{scenario.name}</h3>
                            <p className="mt-1 text-xs text-muted-foreground">{scenario.description}</p>
                            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                              <div><span className="text-muted-foreground">Return</span><p className="num font-semibold">{scenario.result.netReturnPct.toFixed(2)}%</p></div>
                              <div><span className="text-muted-foreground">Max DD</span><p className="num font-semibold">{scenario.result.maxDrawdownPct.toFixed(2)}%</p></div>
                            </div>
                          </GlassCard>
                        ))}
                      </div>
                    )}
                    {stressResult && <div className="rounded-xl border border-border bg-surface/40 p-4 text-sm text-muted-foreground"><ShieldCheck className="mr-2 inline size-4 text-success" />Stress results are scenario diagnostics, not a guarantee of future performance.</div>}
                  </>
                )}
                <Button onClick={nextStep} disabled={!stressResult}><ArrowRight />Continue to Forward Test</Button>
              </div>
            )}

            {step === 3 && (
              <div className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Paper environment</p>
                  <h2 className="mt-1 text-xl font-semibold">Forward Test</h2>
                  <p className="mt-2 text-sm text-muted-foreground">This stage uses the authenticated ALPHENTRA paper execution engine only. No MT5/live broker order is sent from Strategy Lab.</p>
                  <div className="mt-5 space-y-3">
                    {[
                      ["Backtest run", backtestRunId ? backtestRunId.slice(0, 8) + "…" : "Required"],
                      ["Observation status", forwardTestId ? "Active" : "Not started"],
                      ["Execution", "Paper only"],
                      ["Market data", "MT5 live universe"],
                    ].map(([label, value]) => (
                      <div key={label} className="flex items-center justify-between rounded-lg border border-border bg-surface/40 px-4 py-3 text-sm">
                        <span className="text-muted-foreground">{label}</span><span className="font-medium">{value}</span>
                      </div>
                    ))}
                  </div>
                  {forwardEvent && <div className="mt-4 rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm"><span className="font-semibold">{forwardEvent.signal}</span> · {forwardEvent.action} · {forwardEvent.price.toFixed(5)}</div>}
                </div>
                <GlassCard className="p-5">
                  <Badge variant="outline" className="border-warning/30 text-warning">Paper trading only</Badge>
                  <p className="mt-4 text-sm text-muted-foreground">Start a forward-test session from the completed backtest, then run a cycle against the current MT5 quote and paper portfolio.</p>
                  {!forwardTestId ? (
                    <Button className="mt-5 w-full" disabled={!backtestRunId} onClick={async () => {
                      if (!backtestRunId) return;
                      try {
                        const started = await startForwardTest({
                          backtestId: backtestRunId,
                          definition: { entry: { operator: rules.entryOperator, conditions: rules.entry }, exit: { operator: rules.exitOperator, conditions: rules.exit }, stopLossPct: rules.stopLossPct, takeProfitPct: rules.takeProfitPct, trailingStopPct: rules.trailingStopPct, riskPerTradePct: rules.riskPerTradePct, positionSizing: rules.positionSizing },
                        });
                        setForwardTestId(started.id);
                      } catch (error) {
                        console.error(error);
                      }
                    }}>Start Paper Forward Test <ArrowRight /></Button>
                  ) : (
                    <>
                      <Button className="mt-5 w-full" disabled={forwardRunning} onClick={async () => {
                        if (!forwardTestId || !backtestMarketId) return;
                        setForwardRunning(true);
                        try {
                          const event = await runForwardTestCycle({
                            forwardTestId, marketId: backtestMarketId, timeframe: backtestTimeframe,
                            definition: { entry: { operator: rules.entryOperator, conditions: rules.entry }, exit: { operator: rules.exitOperator, conditions: rules.exit }, stopLossPct: rules.stopLossPct, takeProfitPct: rules.takeProfitPct, trailingStopPct: rules.trailingStopPct, riskPerTradePct: rules.riskPerTradePct, positionSizing: rules.positionSizing },
                          });
                          setForwardEvent({ signal: event.signal, action: event.action, price: event.price });
                          setCompleted((items) => items.includes(3) ? items : [...items, 3]);
                        } catch (error) {
                          console.error(error);
                        } finally { setForwardRunning(false); }
                      }}>{forwardRunning ? "Running Paper Cycle…" : "Run Forward Cycle"} <ArrowRight /></Button>
                      <p className="mt-3 text-center text-xs text-muted-foreground">A production publish gate should observe this session for the required period before enabling publication.</p>
                    </>
                  )}
                </GlassCard>
                <div className="lg:col-span-2"><Button onClick={nextStep} disabled={!forwardTestId}><ArrowRight />Continue to Publish Gates</Button></div>
              </div>
            )}

            {step === 4 && (
              <div className="mx-auto max-w-3xl">
                <div className="text-center">
                  <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary"><ShieldCheck className="size-7" /></div>
                  <h2 className="mt-5 text-2xl font-semibold">Publish Gates</h2>
                  <p className="mt-2 text-sm text-muted-foreground">Publication is intentionally blocked until every validation gate is evidenced by real data. A backtest alone is not treated as production validation.</p>
                </div>
                <div className="mt-7 space-y-3">
                  {[
                    ["Historical backtest", Boolean(backtestResult), backtestResult ? `${backtestResult.trades.length} trades · DD ${backtestResult.maxDrawdownPct.toFixed(2)}%` : "Run a real MT5 backtest"],
                    ["Stress testing", Boolean(stressResult), stressResult ? `${stressResult.scenarios.length} scenarios completed` : "Run all stress scenarios"],
                    ["Paper forward session", Boolean(forwardTestId), forwardTestId ? "Session active" : "Start paper forward testing"],
                    ["Forward observations", Boolean(forwardEvent), forwardEvent ? "At least one paper cycle recorded" : "No paper cycle recorded"],
                    ["Minimum observation period", false, "Required observation window has not elapsed"],
                  ].map(([label, ready, detail]) => (
                    <div key={label as string} className="flex items-center gap-3 rounded-xl border border-border bg-surface/50 p-4">
                      {ready ? <Check className="size-5 text-success" /> : <ShieldCheck className="size-5 text-warning" />}
                      <div className="min-w-0 flex-1"><p className="font-medium">{label}</p><p className="text-xs text-muted-foreground">{detail}</p></div>
                      <Badge variant="outline" className={ready ? "border-success/30 text-success" : "border-warning/30 text-warning"}>{ready ? "Passed" : "Pending"}</Badge>
                    </div>
                  ))}
                </div>
                <div className="mt-5 rounded-xl border border-warning/20 bg-warning/5 p-4 text-sm text-muted-foreground">
                  <ShieldCheck className="mr-2 inline size-4 text-warning" />
                  This strategy remains a draft. ALPHENTRA will not mark it production-ready or marketplace-publishable until the required forward observation period is completed.
                </div>
                <div className="mt-6 flex justify-center">
                  <Button disabled><Save /> Publish Strategy — Locked</Button>
                </div>
                {backtestRunId && <p className="mt-3 text-center text-xs text-muted-foreground">Backtest run: {backtestRunId}</p>}
              </div>
            )}


