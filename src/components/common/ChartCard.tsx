import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { GlassCard } from "./GlassCard";

export function ChartCard({
  title,
  subtitle,
  actions,
  children,
  className,
  bodyClassName,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <GlassCard className={cn("flex flex-col overflow-hidden", className)}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          {subtitle && <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        {actions}
      </div>
      <div className={cn("p-4 sm:p-5", bodyClassName)}>{children}</div>
    </GlassCard>
  );
}
