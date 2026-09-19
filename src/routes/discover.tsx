import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart, MessageCircle, TrendingUp } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/common/PageHeader";
import { GlassCard } from "@/components/common/GlassCard";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { mockPosts } from "@/data/mockPosts";
import { mockAgents } from "@/data/mockAgents";
import { Delta } from "@/components/common/Delta";

export const Route = createFileRoute("/discover")({
  head: () => ({
    meta: [
      { title: "Discover — ALPHENTRA" },
      {
        name: "description",
        content: "Build logs, post-mortems and strategy notes from creators building AI trading strategies.",
      },
      { property: "og:title", content: "Discover — ALPHENTRA" },
      { property: "og:description", content: "Notes and build logs from AI strategy creators." },
    ],
  }),
  component: DiscoverPage,
});

function DiscoverPage() {
  const trending = [...mockAgents].sort((a, b) => b.roi30d - a.roi30d).slice(0, 4);

  return (
    <AppShell wide>
      <PageHeader
        eyebrow="Community & Discovery"
        title="Discover"
        description="Follow strategy creators, read build notes, and discover AI strategies using simulated results."
      />

      <div className="mt-6 grid gap-4 xl:grid-cols-[2fr_1fr]">
        <div className="space-y-4">
          {mockPosts.map((p) => (
            <GlassCard key={p.id} className="p-5">
              <div className="flex items-start gap-3">
                <Avatar className="size-10 border border-border">
                  <AvatarFallback className="bg-surface-2 text-xs font-semibold">
                    {p.author.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="font-semibold text-foreground">{p.author}</span>
                    <span className="text-muted-foreground">{p.handle}</span>
                    <span className="text-muted-foreground">· {p.time}</span>
                    <span className="rounded-full bg-primary-soft px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                      {p.tag}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-foreground">{p.body}</p>
                  <div className="mt-3 flex items-center gap-5 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Heart className="size-3.5" /> <span className="num">{p.likes}</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <MessageCircle className="size-3.5" /> <span className="num">{p.comments}</span>
                    </span>
                    {p.agentId && (
                      <Link
                        to="/agents/$id"
                        params={{ id: p.agentId }}
                        className="font-semibold text-primary hover:underline"
                      >
                        View AI strategy
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>

        <GlassCard className="h-fit p-5">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <TrendingUp className="size-4 text-primary" /> Trending strategies
          </h3>
          <ul className="mt-3 divide-y divide-border">
            {trending.map((a) => (
              <li key={a.id}>
                <Link
                  to="/agents/$id"
                  params={{ id: a.id }}
                  className="flex items-center gap-3 py-3 transition-colors hover:text-primary"
                >
                  <span className="num text-xs font-bold text-muted-foreground">#{a.rank}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{a.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{a.style}</p>
                  </div>
                  <Delta value={a.roi30d} showIcon={false} className="text-xs" />
                </Link>
              </li>
            ))}
          </ul>
        </GlassCard>
      </div>
    </AppShell>
  );
}
