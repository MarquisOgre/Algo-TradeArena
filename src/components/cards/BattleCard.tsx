import { Link } from "@tanstack/react-router";
import { Eye, Swords, Timer } from "lucide-react";
import type { Battle } from "@/data/types";
import { GlassCard } from "@/components/common/GlassCard";
import { Sparkline } from "@/components/common/Sparkline";
import { cn } from "@/lib/utils";

function Side({ side, leading }: { side: Battle["left"]; leading: boolean }) {
  return (
    <div className={cn("rounded-xl border p-3", leading ? "border-primary/40 bg-primary-soft" : "border-border bg-surface-2/50")}>
      <p className="truncate text-sm font-semibold text-foreground">{side.name}</p>
      <p
        className={cn(
          "num mt-1 text-xl font-bold",
          side.pnlPct > 0 ? "text-success" : side.pnlPct < 0 ? "text-danger" : "text-muted-foreground",
        )}
      >
        {side.pnlPct > 0 ? "+" : ""}
        {side.pnlPct.toFixed(2)}%
      </p>
      <Sparkline data={side.equity} height={34} tone={side.pnlPct >= 0 ? "up" : "down"} />
    </div>
  );
}

export function BattleCard({ battle }: { battle: Battle }) {
  const statusTone =
    battle.status === "Live"
      ? "bg-danger/15 text-danger"
      : battle.status === "Upcoming"
        ? "bg-primary-soft text-primary"
        : "bg-muted text-muted-foreground";

  return (
    <Link to="/battle/$id" params={{ id: battle.id }} className="block">
      <GlassCard interactive className="h-full p-5">
        <div className="flex items-center justify-between gap-3">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em]",
              statusTone,
            )}
          >
            {battle.status === "Live" && <span className="size-1.5 animate-pulse rounded-full bg-danger" />}
            {battle.status}
          </span>
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Eye className="size-3.5" />
            <span className="num">{battle.spectators.toLocaleString()}</span>
          </span>
        </div>

        <p className="mt-3 text-sm font-semibold text-foreground">{battle.title}</p>
        <p className="text-xs text-muted-foreground">
          {battle.format} · {battle.market}
        </p>

        <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <Side side={battle.left} leading={battle.left.pnlPct >= battle.right.pnlPct} />
          <span className="flex size-8 items-center justify-center rounded-full border border-border bg-background">
            <Swords className="size-3.5 text-muted-foreground" />
          </span>
          <Side side={battle.right} leading={battle.right.pnlPct > battle.left.pnlPct} />
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Timer className="size-3.5" />
            {battle.startsIn ?? battle.duration}
          </span>
          <span className="num font-semibold text-foreground">{battle.prizePool}</span>
        </div>
      </GlassCard>
    </Link>
  );
}
