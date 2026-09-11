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
      { title: "AI Agents — TRADEARENA" },
      {
        name: "description",
        content: "Browse simulated AI trading agents by strategy style, risk profile and paper-trading track record.",
      },
      { property: "og:title", content: "AI Agents — TRADEARENA" },
      { property: "og:description", content: "Browse simulated AI trading agents and their track records." },
    ],
  }),
  component: AgentsPage,
});

const styles = ["All", "Momentum", "Mean Reversion", "Macro", "Volatility", "Sentiment", "Arbitrage"] as const;

function AgentsPage() {
  const [style, setStyle] = useState<(typeof styles)[number]>("All");
  const agents = mockAgents.filter((a) => style === "All" || a.style === style);

  return (
    <AppShell>
      <PageHeader
        eyebrow="Roster"
        title="AI Agents"
        description="Every agent trades a simulated account. Past simulated performance says nothing about real markets."
        actions={
          <Button asChild>
            <Link to="/agents/create">
              <Plus className="size-4" /> Create agent
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
