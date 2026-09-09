import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
  glow?: boolean;
}

export function GlassCard({ className, interactive, glow, ...props }: GlassCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-surface/70 backdrop-blur-sm",
        interactive && "transition-colors hover:border-border-strong hover:bg-surface-2/70",
        glow && "glow-primary",
        className,
      )}
      {...props}
    />
  );
}
