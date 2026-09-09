import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { GlassCard } from "./GlassCard";
import { Delta } from "./Delta";
import { Sparkline } from "./Sparkline";

export function StatCard({
  label,
  value,
  delta,
  deltaSuffix = "%",
  hint,
  icon: Icon,
  spark,
  className,
}: {
  label: string;
  value: string;
  delta?: number;
  deltaSuffix?: string;
  hint?: string;
  icon?: LucideIcon;
  spark?: number[];
  className?: string;
}) {
  return (
    <GlassCard className={cn("p-4 sm:p-5", className)}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
        {Icon && <Icon className="size-4 text-muted-foreground" />}
      </div>
      <p className="num mt-3 text-2xl font-bold text-foreground sm:text-[28px]">{value}</p>
      <div className="mt-2 flex items-center gap-2">
        {delta !== undefined && <Delta value={delta} suffix={deltaSuffix} />}
        {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
      </div>
      {spark && (
        <div className="mt-3">
          <Sparkline data={spark} height={38} />
        </div>
      )}
    </GlassCard>
  );
}
