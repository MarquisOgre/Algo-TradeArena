import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Bot, Sparkles } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/common/PageHeader";
import { GlassCard } from "@/components/common/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/agents/create")({
  head: () => ({
    meta: [
      { title: "Create an Agent — TRADEARENA" },
      {
        name: "description",
        content: "Design a simulated AI trading agent: pick a style, set risk limits and describe the strategy in plain language.",
      },
      { property: "og:title", content: "Create an Agent — TRADEARENA" },
      { property: "og:description", content: "Design a simulated AI trading agent." },
    ],
  }),
  component: CreateAgentPage,
});

const styles = ["Momentum", "Mean Reversion", "Macro", "Volatility", "Sentiment", "Arbitrage"];
const risks = ["Low", "Medium", "High"];

function CreateAgentPage() {
  const [style, setStyle] = useState("Momentum");
  const [risk, setRisk] = useState("Medium");
  const [maxPosition, setMaxPosition] = useState([12]);

  return (
    <AppShell>
      <PageHeader
        eyebrow="Agent studio"
        title="Create an agent"
        description="Agents trade a simulated account only. Training and live deployment arrive in the next build."
      />

      <div className="mt-6 grid gap-4 xl:grid-cols-[2fr_1fr]">
        <GlassCard className="p-5 sm:p-6">
          <form
            className="space-y-5"
            onSubmit={(e) => {
              e.preventDefault();
              toast.success("Draft saved locally", {
                description: "Agent training is not available in this preview build.",
              });
            }}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Agent name</Label>
                <Input id="name" placeholder="e.g. Helios Breakout" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="handle">Handle</Label>
                <Input id="handle" placeholder="@helios" required />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="thesis">Strategy in plain language</Label>
              <Textarea
                id="thesis"
                rows={5}
                placeholder="Describe entries, exits, position sizing and what should make the agent stand aside."
              />
            </div>

            <div className="space-y-2">
              <Label>Strategy style</Label>
              <div className="flex flex-wrap gap-2">
                {styles.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStyle(s)}
                    className={cn(
                      "rounded-xl border px-3 py-1.5 text-sm transition-colors",
                      style === s
                        ? "border-primary/50 bg-primary-soft text-foreground"
                        : "border-border text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Risk profile</Label>
              <div className="flex gap-2">
                {risks.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRisk(r)}
                    className={cn(
                      "flex-1 rounded-xl border px-3 py-2 text-sm transition-colors",
                      risk === r
                        ? "border-primary/50 bg-primary-soft text-foreground"
                        : "border-border text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Max position size</Label>
                <span className="num text-sm font-semibold text-foreground">{maxPosition[0]}% of equity</span>
              </div>
              <Slider value={maxPosition} onValueChange={setMaxPosition} min={1} max={40} step={1} />
            </div>

            <div className="flex flex-wrap gap-2 border-t border-border pt-5">
              <Button type="submit">Save draft</Button>
              <Button type="button" variant="outline">
                <Sparkles className="size-4" /> Draft with Copilot
              </Button>
            </div>
          </form>
        </GlassCard>

        <div className="space-y-4">
          <GlassCard className="p-5">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl bg-primary-soft ring-1 ring-primary/40">
                <Bot className="size-5 text-primary" />
              </span>
              <div>
                <p className="text-sm font-semibold text-foreground">Preview</p>
                <p className="text-xs text-muted-foreground">
                  {style} · {risk} risk
                </p>
              </div>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              Your agent will start in the Rookie Ladder with 100,000 in virtual capital and a{" "}
              <span className="num font-semibold text-foreground">{maxPosition[0]}%</span> cap per position.
            </p>
          </GlassCard>

          <GlassCard className="p-5">
            <h3 className="text-sm font-semibold text-foreground">Coming next</h3>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>Backtest over historical simulated sessions</li>
              <li>Rule builder with guardrails and kill switches</li>
              <li>Auto-entry into ladders and tournaments</li>
            </ul>
          </GlassCard>
        </div>
      </div>
    </AppShell>
  );
}
