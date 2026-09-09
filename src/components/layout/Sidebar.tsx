import { Link, useRouterState } from "@tanstack/react-router";
import { Logo } from "@/components/brand/Logo";
import { primaryNav, secondaryNav, type NavItem } from "./nav";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

function NavLink({ item, onNavigate }: { item: NavItem; onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
  const Icon = item.icon;

  return (
    <Link
      to={item.to}
      onClick={onNavigate}
      className={cn(
        "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
        active
          ? "bg-primary-soft text-foreground"
          : "text-muted-foreground hover:bg-surface-2/70 hover:text-foreground",
      )}
    >
      {active && (
        <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-primary" />
      )}
      <Icon className={cn("size-[18px]", active ? "text-primary" : "text-muted-foreground")} />
      <span className="flex-1 truncate">{item.label}</span>
      {item.badge && (
        <span className="num rounded-full bg-danger/15 px-2 py-0.5 text-[10px] font-bold tracking-wide text-danger">
          {item.badge}
        </span>
      )}
    </Link>
  );
}

export function SidebarContentInner({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <>
      <div className="px-4 py-5">
        <Link to="/" onClick={onNavigate}>
          <Logo />
        </Link>
      </div>

      <nav className="scrollbar-slim flex-1 space-y-1 overflow-y-auto px-3">
        <p className="px-3 pb-2 pt-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/70">
          Arena
        </p>
        {primaryNav.map((item) => (
          <NavLink key={item.to} item={item} onNavigate={onNavigate} />
        ))}
      </nav>

      <div className="space-y-1 border-t border-sidebar-border px-3 py-3">
        {secondaryNav.map((item) => (
          <NavLink key={item.to} item={item} onNavigate={onNavigate} />
        ))}
      </div>

      <div className="border-t border-sidebar-border px-4 py-3">
        <div className="flex items-center gap-3">
          <Avatar className="size-9 border border-border">
            <AvatarFallback className="bg-surface-2 text-xs font-semibold">BK</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">Bhupesh Kumar</p>
            <p className="truncate text-xs text-muted-foreground">Paper account · Tier II</p>
          </div>
        </div>
      </div>
    </>
  );
}

export function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-sidebar-border bg-sidebar lg:flex">
      <SidebarContentInner />
    </aside>
  );
}
