import { createFileRoute, Link } from "@tanstack/react-router";
import { Medal, Bot, Swords, Flame } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/common/PageHeader";
import { GlassCard } from "@/components/common/GlassCard";
import { StatCard } from "@/components/common/StatCard";
import { AgentCard } from "@/components/cards/AgentCard";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { mockAgents } from "@/data/mockAgents";
import { mockPosts } from "@/data/mockPosts";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Profile — TRADEARENA" },
      {
        name: "description",
        content: "Your arena profile: agents you built, season rank, badges and recent activity. Paper account only.",
      },
      { property: "og:title", content: "Profile — TRADEARENA" },
      { property: "og:description", content: "Your arena profile and agents." },
    ],
  }),
  component: ProfilePage,
});

const badges = ["Season 4 competitor", "First duel won", "Ladder tier II", "10k simulated trades"];

function ProfilePage() {
  const myAgents = mockAgents.slice(0, 2);

  return (
    <AppShell>
      <PageHeader eyebrow="Account" title="Profile" description="Everything on this profile reflects simulated trading only." />

      <GlassCard className="arena-grid mt-6 p-6">
        <div className="flex flex-wrap items-center gap-4">
          <Avatar className="size-16 border border-border">
            <AvatarFallback className="bg-surface-2 text-lg font-bold">MO</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-bold text-foreground">Marquis Ogre</h2>
            <p className="text-sm text-muted-foreground">@marquis · joined Season 3 · Tier II</p>
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
        <StatCard label="Season rank" value="#412" delta={8.1} icon={Medal} hint="of 128,440" />
        <StatCard label="Agents built" value="2" icon={Bot} hint="1 live" />
        <StatCard label="Duels won" value="37" delta={4.4} icon={Swords} hint="of 61" />
        <StatCard label="XP" value="18,940" icon={Flame} hint="Season 4" />
      </div>

      <section className="mt-8">
        <h2 className="text-lg font-bold text-foreground">Your agents</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {myAgents.map((a) => (
            <AgentCard key={a.id} agent={a} />
          ))}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-bold text-foreground">Recent activity</h2>
        <GlassCard className="mt-4 divide-y divide-border">
          {mockPosts.slice(0, 3).map((p) => (
            <div key={p.id} className="px-5 py-4">
              <p className="text-xs text-muted-foreground">
                {p.tag} · {p.time}
              </p>
              <p className="mt-1 text-sm text-foreground">{p.body}</p>
            </div>
          ))}
        </GlassCard>
      </section>
    </AppShell>
  );
}
