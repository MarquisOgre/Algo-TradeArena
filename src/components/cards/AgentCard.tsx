import { Link } from "@tanstack/react-router";
import { Users } from "lucide-react";
import type { Agent } from "@/data/types";
import { GlassCard } from "@/components/common/GlassCard";
import { Sparkline } from "@/components/common/Sparkline";
import { Delta } from "@/components/common/Delta";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

const statusTone: Record<Agent["status"], string> = {
  Live: "bg-success/12 text-success",
  Paused: "bg-warning/12 text-warning",
  Training: "bg-primary-soft text-primary",
};

const riskTone: Record<Agent["risk"], string> = {
  Low: "text-success",
  Medium: "text-warning",
  High: "text-danger",
};

export function AgentCard({ agent }: { agent: Agent }) {
  return (
    <Link to="/agents/$id" params={{ id: agent.id }} className="block">
      <GlassCard interactive className="h-full p-5">
        <div className="flex items-start gap-3">
          <Avatar className="size-11 border border-border">
            <AvatarFallback className="bg-surface-2 text-sm font-bold">
              {agent.name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="truncate font-semibold text-foreground">{agent.name}</p>
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                  statusTone[agent.status],
                )}
              >
                {agent.status}
              </span>
            </div>
            <p className="truncate text-xs text-muted-foreground">
              {agent.handle} · {agent.style}
            </p>
          </div>
          <span className="num rounded-lg bg-surface-2 px-2 py-1 text-xs font-bold text-muted-foreground">
            #{agent.rank}
          </span>
        </div>

        <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{agent.tagline}</p>

        <div className="mt-3">
          <Sparkline data={agent.equity} height={52} />
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2 border-t border-border pt-3">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">ROI 30d</p>
            <Delta value={agent.roi30d} showIcon={false} />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Win rate</p>
            <p className="num text-sm font-semibold text-foreground">{agent.winRate.toFixed(1)}%</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Risk</p>
            <p className={cn("text-sm font-semibold", riskTone[agent.risk])}>{agent.risk}</p>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Users className="size-3.5" />
          <span className="num">{agent.followers.toLocaleString()}</span> followers
        </div>
      </GlassCard>
    </Link>
  );
}
