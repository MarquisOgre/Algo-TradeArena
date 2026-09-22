import { Link } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border bg-background/70">
      <div className="mx-auto w-full max-w-[1400px] px-4 py-5 text-xs text-muted-foreground sm:px-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-2">
            <span className="font-semibold tracking-wide text-foreground">ALPHENTRA</span>
            <span>· Build. Test. Compete. Trade.</span>
          </div>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <Link to="/help" className="transition-colors hover:text-foreground">Help Center</Link>
            <Link to="/about" className="transition-colors hover:text-foreground">About</Link>
            <Link to="/contact" className="transition-colors hover:text-foreground">Contact</Link>
            <Link to="/risk-disclosure" className="transition-colors hover:text-foreground">Risk Disclosure</Link>
            <Link to="/terms" className="transition-colors hover:text-foreground">Terms &amp; Conditions</Link>
            <Link to="/privacy" className="transition-colors hover:text-foreground">Privacy Policy</Link>
            <Link to="/settings" className="transition-colors hover:text-foreground">Settings</Link>
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="size-3.5" /> Paper trading · Prototype
            </span>
          </div>
        </div>

        <div className="mt-4 border-t border-border/70 pt-3 text-center">
          <p>
            © 2026 ALPHENTRA. All rights reserved. · Developed by{" "}
            <span className="font-medium text-foreground">Dexorzo Creations</span>.
          </p>
        </div>
      </div>
    </footer>
  );
}
