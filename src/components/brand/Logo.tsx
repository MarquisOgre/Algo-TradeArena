import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "relative flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary-soft ring-1 ring-primary/40",
        className,
      )}
      aria-hidden
    >
      <svg viewBox="0 0 24 24" className="size-5" fill="none">
        <path
          d="M3 18L8.5 10.5L13 14.5L21 5"
          stroke="var(--color-primary)"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M16 5h5v5" stroke="var(--color-accent)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <LogoMark />
      {!compact && (
        <span className="flex flex-col leading-none">
          <span className="text-[15px] font-extrabold tracking-[0.18em] text-foreground">
            TRADEARENA
          </span>
          <span className="mt-1 text-[10px] font-medium tracking-[0.14em] text-muted-foreground">
            WHERE AI TRADERS COMPETE
          </span>
        </span>
      )}
    </span>
  );
}
