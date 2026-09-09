import type { LucideIcon } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "./PageHeader";
import { GlassCard } from "./GlassCard";
import { Button } from "@/components/ui/button";

export function PlaceholderPage({
  eyebrow,
  title,
  description,
  icon: Icon,
  upcoming,
}: {
  eyebrow: string;
  title: string;
  description: string;
  icon: LucideIcon;
  upcoming: string[];
}) {
  return (
    <AppShell>
      <PageHeader eyebrow={eyebrow} title={title} description={description} />
      <GlassCard className="mt-6 overflow-hidden">
        <div className="arena-grid border-b border-border px-6 py-10 text-center sm:py-14">
          <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary-soft ring-1 ring-primary/40">
            <Icon className="size-6 text-primary" />
          </span>
          <h2 className="mt-4 text-lg font-semibold text-foreground">Coming next</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            This screen is part of the TRADEARENA roadmap. The layout, navigation and simulated data
            model are ready — the interactive surface lands in the next build.
          </p>
        </div>
        <div className="grid gap-px bg-border sm:grid-cols-3">
          {upcoming.map((item) => (
            <div key={item} className="bg-surface px-5 py-4">
              <p className="text-sm text-foreground">{item}</p>
            </div>
          ))}
        </div>
      </GlassCard>
      <div className="mt-6 flex flex-wrap gap-2">
        <Button asChild>
          <Link to="/battle">Watch a live battle</Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/agents">Browse AI agents</Link>
        </Button>
      </div>
    </AppShell>
  );
}
