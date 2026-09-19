import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Bell, Menu, Search, ShieldCheck } from "lucide-react";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { SidebarContentInner } from "./Sidebar";
import { Logo } from "@/components/brand/Logo";
import { getMarketCalendarLabel, getMarketSessions } from "@/lib/marketCalendar";

export function PaperTradingBadge({ compact = false }: { compact?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-warning/35 bg-warning/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-warning">
      <ShieldCheck className="size-3.5" />
      {compact ? "Paper" : "Paper Trading"}
    </span>
  );
}

function MarketStatus() {
  const sessions = getMarketSessions();
  const forexOpen = sessions.find((session) => session.group === "forex")?.open ?? false;
  const label = getMarketCalendarLabel();

  return (
    <span className="hidden items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 text-xs text-muted-foreground xl:inline-flex">
      <span className="relative flex size-2">
        <span className={`relative inline-flex size-2 rounded-full ${forexOpen ? "bg-success" : "bg-muted-foreground"}`} />
      </span>
      <span className="text-foreground">{label}</span>
    </span>
  );
}

export function TopBar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur-xl">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open navigation">
              <Menu className="size-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 border-sidebar-border bg-sidebar p-0">
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <div className="flex h-full flex-col">
              <SidebarContentInner onNavigate={() => setOpen(false)} />
            </div>
          </SheetContent>
        </Sheet>

        <Link to="/" className="lg:hidden">
          <Logo compact />
        </Link>

        <div className="relative hidden max-w-md flex-1 md:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            placeholder="Search strategies, markets, competitions"
            className="h-10 w-full rounded-xl border border-border bg-surface pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-ring/25"
          />
        </div>

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <MarketStatus />
          <PaperTradingBadge />
          <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
            <Bell className="size-[18px]" />
            <span className="absolute right-2 top-2 size-2 rounded-full bg-danger ring-2 ring-background" />
          </Button>
          <Link
            to="/profile"
            aria-label="User profile"
            className="flex items-center gap-2 rounded-xl border border-border bg-surface px-2 py-1.5 transition-colors hover:border-primary/40 hover:bg-surface-2"
          >
            <span className="hidden text-xs font-semibold text-foreground sm:inline">User</span>
            <Avatar className="size-8 border border-border">
              <AvatarFallback className="bg-surface-2 text-[10px] font-semibold">MO</AvatarFallback>
            </Avatar>
          </Link>
        </div>
      </div>
    </header>
  );
}
