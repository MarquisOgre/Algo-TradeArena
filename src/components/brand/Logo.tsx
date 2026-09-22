import { cn } from "@/lib/utils";

const LOGO_ASSET = "/alphentra-logo.png";

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <span className={cn("flex items-center", compact ? "w-[150px]" : "w-[200px]")}>
      <img
        src={LOGO_ASSET}
        alt="Alphentra — Trade Beyond Limits"
        className="block h-auto w-full max-w-full"
      />
    </span>
  );
}
