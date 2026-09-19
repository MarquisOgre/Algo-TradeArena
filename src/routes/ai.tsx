import { createFileRoute } from "@tanstack/react-router";
import { Sparkles, Send, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/common/PageHeader";
import { GlassCard } from "@/components/common/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/ai")({
  head: () => ({
    meta: [
      { title: "AI Copilot — ALPHENTRA" },
      {
        name: "description",
        content: "Ask ALPHENTRA Copilot about strategies, competitions and simulated portfolio behaviour.",
      },
      { property: "og:title", content: "AI Copilot — ALPHENTRA" },
      { property: "og:description", content: "Your AI copilot for strategies and simulated performance." },
    ],
  }),
  component: CopilotPage,
});

const conversation = [
  { role: "user", text: "Why is Atlas Momentum ahead of Kepler Reversion in this competition?" },
  {
    role: "assistant",
    text: "In this simulated example, Atlas Momentum is +6.42% versus Kepler Reversion at +3.18%. Atlas's edge came from two semiconductor breakout entries early in session two. Kepler's path is steadier, so its risk-adjusted gap is smaller than the headline return suggests.",
  },
  { role: "user", text: "What would change the result?" },
  {
    role: "assistant",
    text: "A sustained pullback in high-beta tech could reduce Atlas's momentum advantage. Kepler's mean-reversion rules are designed to benefit from larger moves back toward its reference mean. This is scenario analysis, not a forecast.",
  },
];

const prompts = [
  "Compare two strategies",
  "Explain my portfolio risk",
  "Review a strategy drawdown",
];

function CopilotPage() {
  return (
    <AppShell>
      <PageHeader
        eyebrow="AI"
        title="AI Copilot"
        description="Ask questions about strategies, competitions, markets and your paper portfolio. Responses in this preview use simulated data."
      />

      <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_300px]">
        <GlassCard className="flex flex-col overflow-hidden">
          <div className="flex items-center gap-3 border-b border-border px-5 py-4">
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary-soft ring-1 ring-primary/40">
              <Sparkles className="size-4 text-primary" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground">ALPHENTRA Copilot</p>
              <p className="text-xs text-muted-foreground">Preview conversation · simulated data only</p>
            </div>
            <Badge variant="outline">Prototype</Badge>
          </div>

          <div className="space-y-4 p-5">
            {conversation.map((m, i) => (
              <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "max-w-[85%] rounded-2xl px-4 py-3 text-sm",
                    m.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "border border-border bg-surface-2 text-foreground",
                  )}
                >
                  {m.text}
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-border p-4">
            <div className="mb-3 flex flex-wrap gap-2">
              {prompts.map((p) => (
                <button
                  key={p}
                  onClick={() => toast("This prompt is ready for the live Copilot build.")}
                  className="rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                >
                  {p}
                </button>
              ))}
            </div>
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                toast("Live Copilot replies are not connected in this prototype.");
              }}
            >
              <Input placeholder="Ask about a strategy, competition or paper portfolio" />
              <Button type="submit" size="icon" aria-label="Send">
                <Send className="size-4" />
              </Button>
            </form>
          </div>
        </GlassCard>

        <GlassCard className="h-fit p-5">
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-4 text-success" />
            <p className="text-sm font-semibold text-foreground">Copilot guardrails</p>
          </div>
          <ul className="mt-4 space-y-3 text-xs leading-5 text-muted-foreground">
            <li>• Explains simulated results and strategy logic.</li>
            <li>• Does not place orders or connect to a broker.</li>
            <li>• Does not guarantee returns or predict outcomes.</li>
            <li>• Live AI responses will require a connected AI service.</li>
          </ul>
        </GlassCard>
      </div>
    </AppShell>
  );
}
