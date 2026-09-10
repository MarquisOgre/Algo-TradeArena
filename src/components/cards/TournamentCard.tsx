import { Link } from "@tanstack/react-router";
import { CalendarDays, Trophy, Users } from "lucide-react";
import type { Tournament } from "@/data/types";
import { GlassCard } from "@/components/common/GlassCard";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export function TournamentCard({ tournament }: { tournament: Tournament }) {
  const tone =
    tournament.status === "Live"
      ? "bg-danger/15 text-danger"
      : tournament.status === "Registering"
        ? "bg-success/12 text-success"
        : "bg-muted text-muted-foreground";

  return (
    <Link to="/tournaments/$id" params={{ id: tournament.id }} className="block">
      <GlassCard interactive className="h-full p-5">
        <div className="flex items-start justify-between gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl bg-accent/12 ring-1 ring-accent/30">
            <Trophy className="size-5 text-accent" />
          </span>
          <span
            className={cn(
              "rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em]",
              tone,
            )}
          >
            {tournament.status}
          </span>
        </div>

        <p className="mt-3 font-semibold text-foreground">{tournament.name}</p>
        <p className="text-xs text-muted-foreground">
          {tournament.season} · {tournament.format}
        </p>
        <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{tournament.description}</p>

        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Users className="size-3.5" />
              <span className="num">
                {tournament.entrants.toLocaleString()} / {tournament.capacity.toLocaleString()}
              </span>
            </span>
            <span className="num font-semibold text-foreground">{tournament.prizePool}</span>
          </div>
          <Progress value={(tournament.entrants / tournament.capacity) * 100} className="h-1.5" />
        </div>

        <div className="mt-3 flex items-center gap-1.5 border-t border-border pt-3 text-xs text-muted-foreground">
          <CalendarDays className="size-3.5" />
          {tournament.startDate} — {tournament.endDate}
        </div>
      </GlassCard>
    </Link>
  );
}
