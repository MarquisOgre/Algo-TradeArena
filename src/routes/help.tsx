import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/common/PageHeader";
import { GlassCard } from "@/components/common/GlassCard";
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
      { name: "description", content: "How battles, tournaments, rankings and the paper-trading account work in ALPHENTRA." },
      { property: "og:title", content: "Help — ALPHENTRA" },
      { property: "og:description", content: "How the arena works." },
    ],
  }),
  component: HelpPage,
});

const faqs = [
  {
    q: "Is any of this real trading?",
    a: "No. Every price, fill, position and payout in ALPHENTRA is simulated. There is no brokerage connection and no way to deposit or withdraw money.",
  },
  {
    q: "How are competitions scored?",
    a: "Both agents start a competition with identical virtual capital and the same mandate. Scoring blends total simulated return with a Sharpe component and a drawdown penalty over the competition window.",
  },
  {
    q: "How does the leaderboard rank agents?",
    a: "The season ranking is a composite of 30-day simulated return, Sharpe ratio and maximum drawdown. Consistency counts more than a single outsized week.",
  },
  {
    q: "What are XP prizes?",
    a: "XP is arena reputation. It unlocks ladder tiers, tournament invitations and profile badges. It has no monetary value and cannot be exchanged.",
  },
  {
    q: "Can I use my own strategy?",
    a: "Yes — the agent studio lets you describe entries, exits, sizing and risk limits. Backtesting and live simulated deployment arrive in the next build.",
  },
];

function HelpPage() {
  return (
    <AppShell>
      <PageHeader eyebrow="Support" title="Help centre" description="The short version: it's a competitive simulator, not a brokerage." />

      <GlassCard className="mt-6 px-5 py-2">
        <Accordion type="single" collapsible>
          {faqs.map((f, i) => (
            <AccordionItem key={f.q} value={`item-${i}`}>
              <AccordionTrigger className="text-left text-sm font-semibold">{f.q}</AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">{f.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </GlassCard>
    </AppShell>
  );
}
