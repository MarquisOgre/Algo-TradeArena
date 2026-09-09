import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

export function formatPct(value: number, digits = 2) {
  return `${value > 0 ? "+" : ""}${value.toFixed(digits)}%`;
}

export function formatMoney(value: number, digits = 2) {
  return `${value < 0 ? "-" : ""}$${Math.abs(value).toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })}`;
}

export function toneClass(value: number) {
  if (value > 0) return "text-success";
  if (value < 0) return "text-danger";
  return "text-muted-foreground";
}

export function Delta({
  value,
  suffix = "%",
  className,
  showIcon = true,
  size = "sm",
}: {
  value: number;
  suffix?: string;
  className?: string;
  showIcon?: boolean;
  size?: "sm" | "md" | "lg";
}) {
  const Icon = value > 0 ? ArrowUpRight : value < 0 ? ArrowDownRight : Minus;
  return (
    <span
      className={cn(
        "num inline-flex items-center gap-1 font-semibold",
        size === "sm" && "text-sm",
        size === "md" && "text-base",
        size === "lg" && "text-2xl",
        toneClass(value),
        className,
      )}
    >
      {showIcon && <Icon className={cn(size === "lg" ? "size-5" : "size-4")} />}
      {value > 0 ? "+" : ""}
      {value.toFixed(2)}
      {suffix}
    </span>
  );
}

export function DeltaPill({ value, label }: { value: number; label?: string }) {
  return (
    <span
      className={cn(
        "num inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold",
        value > 0
          ? "bg-success/12 text-success"
          : value < 0
            ? "bg-danger/12 text-danger"
            : "bg-muted text-muted-foreground",
      )}
    >
      {label ?? formatPct(value)}
    </span>
  );
}
