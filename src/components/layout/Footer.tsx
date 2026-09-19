import { Link } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border bg-background/70">
      <div className="mx-auto flex max-w-[1400px] flex-col gap-3 px-4 py-6 text-xs text-muted-foreground sm:px-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <span className="font-semibold tracking-wide text-foreground">ALPHENTRA</span>
          <span>· Build. Test. Compete. Trade.</span>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <Link to="/help" className="transition-colors hover:text-foreground">Help</Link>
          <Link to="/settings" className="transition-colors hover:text-foreground">Settings</Link>
          <span className="flex items-center gap-1.5"><ShieldCheck className="size-3.5" /> Paper trading · Prototype</span>
        </div>
      </div>
    </footer>
  );
}
