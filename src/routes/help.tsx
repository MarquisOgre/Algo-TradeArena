import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BookOpen, ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/common/PageHeader";
import { GlassCard } from "@/components/common/GlassCard";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const Route = createFileRoute("/help")({
  head: () => ({
    meta: [
      { title: "Help — ALPHENTRA" },
      { name: "description", content: "Learn how Strategy Lab, the Marketplace, Arena and paper trading work in ALPHENTRA." },
      { property: "og:title", content: "Help — ALPHENTRA" },
      { property: "og:description", content: "How the ALPHENTRA platform works." },
    ],
  }),
  component: HelpPage,
});

const faqs = [
  {
    q: "Is any of this real trading?",
    a: "No. The current preview is a paper-trading prototype. Prices, fills, positions, strategy results and competition rewards shown in the UI are simulated. There is no brokerage connection and no real-money deposit or withdrawal flow.",
  },
  {
    q: "How do I create an AI strategy?",
    a: "Open Strategy Lab and move through Build, Backtest, Stress Test, Forward Test and Publish. The current workflow uses simulated results and saves prototype strategies locally in your browser.",
  },
  {
    q: "How does Arena entry work?",
    a: "Select an eligible Published or Forward Testing strategy, then open an Arena competition. Competition entry and rewards are represented in ALPHENTRA (ALPH) prototype units only; no real token transfer occurs in this build.",
  },
  {
    q: "How does the Strategy Marketplace work?",
    a: "Published and forward-testing strategies can be discovered through the Marketplace. The current follow and subscription actions are prototype flows; real payments, creator payouts and broker execution are not connected.",
  },
  {
    q: "How are rankings and performance calculated?",
    a: "The preview displays simulated metrics such as return, drawdown, win rate and Sharpe ratio. They are illustrative and should not be treated as verified live trading performance or a prediction of future results.",
  },
  {
    q: "What is ALPHENTRA Token?",
    a: "ALPH is the prototype ticker used for the planned ALPHENTRA economy. The current wallet is a UI prototype with no real token issuance, custody, transfer or staking. Competition fees and rewards shown in the preview are not real funds.",
  },
];

function HelpPage() {
  return (
    <AppShell>
      <PageHeader eyebrow="Support" title="Help centre" description="Learn how the ALPHENTRA strategy, trading and competition flows fit together." />

      <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_320px]">
        <GlassCard className="px-5 py-2">
          <Accordion type="single" collapsible>
            {faqs.map((f, i) => (
              <AccordionItem key={f.q} value={`item-${i}`}>
                <AccordionTrigger className="text-left text-sm font-semibold">{f.q}</AccordionTrigger>
                <AccordionContent className="text-sm leading-6 text-muted-foreground">{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </GlassCard>

        <GlassCard className="h-fit p-5">
          <div className="flex items-center gap-2">
            <BookOpen className="size-4 text-primary" />
            <p className="text-sm font-semibold text-foreground">Start here</p>
          </div>
          <div className="mt-4 space-y-2">
            <Button asChild variant="outline" className="w-full justify-between">
              <Link to="/lab">Open Strategy Lab <ArrowRight className="size-4" /></Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-between">
              <Link to="/strategies">Browse Strategies <ArrowRight className="size-4" /></Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-between">
              <Link to="/battle">Open Arena <ArrowRight className="size-4" /></Link>
            </Button>
          </div>
          <div className="mt-5 flex gap-2 rounded-xl border border-border bg-surface p-3">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-success" />
            <p className="text-xs leading-5 text-muted-foreground">Paper trading only. No real funds, broker execution or guaranteed returns are connected in this preview.</p>
          </div>
        </GlassCard>
      </div>
    </AppShell>
  );
}
