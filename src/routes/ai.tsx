import { createFileRoute } from "@tanstack/react-router";
import { Sparkles, Send } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/common/PageHeader";
import { GlassCard } from "@/components/common/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/ai")({
  head: () => ({
    meta: [
      { title: "AI Copilot — ALPHENTRA" },
      {
        name: "description",
        content: "Ask ALPHENTRA Copilot about strategies, simulated performance and market structure. Preview conversation only.",
      },
      { property: "og:title", content: "AI Copilot — ALPHENTRA" },
      { property: "og:description", content: "Your AI copilot for strategies and simulated performance." },
    ],
  }),
  component: CopilotPage,
});

const conversation = [
  { role: "user", text: "Why is Atlas ahead of Kepler in the current duel?" },
  {
    role: "assistant",
    text: "Atlas is +6.42% versus Kepler at +3.18%. Almost all of Atlas's edge came from two semiconductor breakout entries early in session two. Kepler's returns are steadier — its realised volatility is roughly a third of Atlas's, so on a Sharpe basis the gap is much smaller than the headline suggests.",
  },
  { role: "user", text: "What would flip the duel?" },
  {
    role: "assistant",
    text: "A two-session pullback in high-beta tech. Atlas holds concentrated momentum exposure and trails a 10-day band, so a sharp reversal forces exits near the lows. Kepler would gain from the same move because it fades extremes against a 60-day mean.",
  },
];

const prompts = [
  "Compare Orion Macro and Vega Sentinel",
  "Explain my portfolio's biggest risk",
  "Which agents fit a low-drawdown mandate?",
];

function CopilotPage() {
  return (
    <AppShell>
      <PageHeader
        eyebrow="Copilot"
        title="AI Copilot"
        description="Explains strategies, competitions and simulated portfolio behaviour in plain language. It never places orders."
      />

      <GlassCard className="mt-6 flex flex-col overflow-hidden">
        <div className="flex items-center gap-3 border-b border-border px-5 py-4">
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary-soft ring-1 ring-primary/40">
            <Sparkles className="size-4 text-primary" />
          </span>
          <div>
            <p className="text-sm font-semibold text-foreground">ALPHENTRA Copilot</p>
            <p className="text-xs text-muted-foreground">Sample conversation · simulated data only</p>
          </div>
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
                onClick={() => toast("Live copilot replies arrive in the next build.")}
                className="rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                {p}
              </button>
            ))}
          </div>
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              toast("Live copilot replies arrive in the next build.");
            }}
          >
            <Input placeholder="Ask about a strategy, a competition or your paper portfolio" />
            <Button type="submit" size="icon" aria-label="Send">
              <Send className="size-4" />
            </Button>
          </form>
        </div>
      </GlassCard>
    </AppShell>
  );
}
