import { createFileRoute, Link } from "@tanstack/react-router";
import { Medal, Bot, Swords, Flame, Store } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/common/PageHeader";
import { GlassCard } from "@/components/common/GlassCard";
import { StatCard } from "@/components/common/StatCard";
import { AgentCard } from "@/components/cards/AgentCard";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { mockAgents } from "@/data/mockAgents";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Profile — ALPHENTRA" },
      {
        name: "description",
        content: "Your ALPHENTRA profile, AI strategies, competition activity and simulated account progress.",
      },
      { property: "og:title", content: "Profile — ALPHENTRA" },
      { property: "og:description", content: "Your ALPHENTRA profile and strategy activity." },
    ],
  }),
  component: ProfilePage,
});

const badges = ["ALPHENTRA competitor", "First competition won", "Ladder tier II", "10k simulated trades"];

function ProfilePage() {
  const myAgents = mockAgents.slice(0, 2);

  return (
    <AppShell wide>
      <PageHeader eyebrow="Account" title="Profile" description="Your public-facing ALPHENTRA identity, strategy activity and competition progress." />

      <GlassCard className="arena-grid mt-6 p-6">
        <div className="flex flex-wrap items-center gap-4">
          <Avatar className="size-16 border border-border">
            <AvatarFallback className="bg-surface-2 text-lg font-bold">MO</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-bold text-foreground">Marquis Ogre</h2>
            <p className="text-sm text-muted-foreground">@marquis · Season 3 · Tier II</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {badges.map((b) => (
                <span key={b} className="rounded-full border border-border bg-surface px-2.5 py-1 text-xs text-muted-foreground">
                  {b}
                </span>
              ))}
            </div>
          </div>
          <Button asChild variant="outline">
            <Link to="/settings">Edit profile</Link>
          </Button>
        </div>
      </GlassCard>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Season rank" value="#412" delta={8.1} icon={Medal} hint="of 128,440 · simulated" />
        <StatCard label="AI strategies" value="2" icon={Bot} hint="1 published" />
        <StatCard label="Arena entries" value="37" delta={4.4} icon={Swords} hint="of 61 · simulated" />
        <StatCard label="XP" value="18,940" icon={Flame} hint="Arena reputation" />
      </div>

      <section className="mt-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-foreground">Your AI strategies</h2>
            <p className="mt-1 text-sm text-muted-foreground">Build and publish strategies from Strategy Lab.</p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link to="/strategies"><Store className="mr-2 size-4" />Strategy Marketplace</Link>
          </Button>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {myAgents.map((a) => (
            <AgentCard key={a.id} agent={a} />
          ))}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-bold text-foreground">Profile notes</h2>
        <GlassCard className="mt-4 p-5 text-sm text-muted-foreground">
          Strategy results, ranks, XP and competition history shown in this preview are simulated. Your profile does not represent a live brokerage account or verified trading track record.
        </GlassCard>
      </section>
    </AppShell>
  );
}
