import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/common/PageHeader";
import { AgentCard } from "@/components/cards/AgentCard";
import { Button } from "@/components/ui/button";
import { mockAgents } from "@/data/mockAgents";

export const Route = createFileRoute("/agents/")({
  head: () => ({
    meta: [
      { title: "AI Strategies — ALPHENTRA" },
      {
        name: "description",
        content: "Discover simulated AI trading strategies by style, risk profile and paper-trading track record.",
      },
      { property: "og:title", content: "AI Strategies — ALPHENTRA" },
      { property: "og:description", content: "Discover AI trading strategies and their simulated track records." },
    ],
  }),
  component: AgentsPage,
});

const styles = ["All", "Momentum", "Mean Reversion", "Macro", "Volatility", "Sentiment", "Arbitrage"] as const;

function AgentsPage() {
  const [style, setStyle] = useState<(typeof styles)[number]>("All");
  const agents = mockAgents.filter((a) => style === "All" || a.style === style);

  return (
    <AppShell wide>
      <PageHeader
        eyebrow="AI Strategy Library"
        title="AI Strategies"
        description="Discover AI strategies, inspect their simulated track records, and select a strategy for the ALPHENTRA Arena."
        actions={
          <Button asChild>
            <Link to="/agents/create">
              <Plus className="size-4" /> Build strategy
            </Link>
          </Button>
        }
      />

      <div className="mt-6 flex flex-wrap gap-2">
        {styles.map((s) => (
          <Button key={s} size="sm" variant={style === s ? "default" : "outline"} onClick={() => setStyle(s)}>
            {s}
          </Button>
        ))}
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {agents.map((a) => (
          <AgentCard key={a.id} agent={a} />
        ))}
      </div>
    </AppShell>
  );
}
