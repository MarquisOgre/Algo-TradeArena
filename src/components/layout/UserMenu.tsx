import { Link } from "@tanstack/react-router";
import { HelpCircle, LogIn, LogOut, Settings, UserRound } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";

const userOptions = [
  { label: "Profile", to: "/profile", icon: UserRound },
  { label: "Settings", to: "/settings", icon: Settings },
  { label: "Help", to: "/help", icon: HelpCircle },
] as const;

function initials(value: string) {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "AL";
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase() ?? "").join("");
}

export function UserMenu({ compact = false }: { compact?: boolean }) {
  const { user, loading, signOut } = useAuth();
  const metadata = user?.user_metadata ?? {};
  const displayName =
    metadata.full_name ||
    metadata.name ||
    user?.email?.split("@")[0] ||
    "ALPHENTRA";
  const fallback = initials(displayName);
  const email = user?.email ?? "";

  async function handleSignOut() {
    const { error } = await signOut();
    if (error) console.error("ALPHENTRA sign out failed:", error);
  }

  if (!user && !loading) {
    return (
      <Link
        to="/login"
        className={cn(
          "font-semibold text-foreground transition-colors hover:text-primary",
          compact
            ? "inline-flex items-center rounded-xl border border-border bg-surface px-3 py-2 text-xs"
            : "block w-full px-3 py-2 text-sm",
        )}
      >
        Sign In
      </Link>
    );
  }

  if (loading) {
    return <span className={compact ? "px-3 py-2 text-xs text-muted-foreground" : "px-3 py-2 text-sm text-muted-foreground"}>...</span>;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {compact ? (
          <button
            type="button"
            aria-label="Open user menu"
            className="flex items-center gap-2 rounded-xl border border-border bg-surface px-2 py-1.5 transition-colors hover:border-primary/40 hover:bg-surface-2"
          >
            <span className="hidden text-xs font-semibold text-foreground sm:inline">{displayName}</span>
            <Avatar className="size-8 border border-border">
              <AvatarFallback className="bg-surface-2 text-[10px] font-semibold">{fallback}</AvatarFallback>
            </Avatar>
          </button>
        ) : (
          <button
            type="button"
            aria-label="Open user menu"
            className="flex w-full items-center gap-3 rounded-xl px-0 py-0 text-left transition-colors hover:bg-surface-2/60"
          >
            <Avatar className="size-9 border border-border">
              <AvatarFallback className="bg-surface-2 text-xs font-semibold">{fallback}</AvatarFallback>
            </Avatar>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium text-foreground">{displayName}</span>
              <span className="block truncate text-xs text-muted-foreground">{email}</span>
            </span>
          </button>
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent
        side={compact ? "bottom" : "top"}
        align={compact ? "end" : "start"}
        sideOffset={8}
        className={cn("w-60", !compact && "mb-1")}
      >
        <div className="px-2 py-1.5">
          <p className="truncate text-xs font-semibold text-foreground">{displayName}</p>
          <p className="truncate text-[11px] text-muted-foreground">{email}</p>
        </div>
        <DropdownMenuSeparator />
        {userOptions.map((item) => {
          const Icon = item.icon;
          return (
            <DropdownMenuItem key={item.to} asChild>
              <Link to={item.to} className="cursor-pointer">
                <Icon className="size-4" />
                {item.label}
              </Link>
            </DropdownMenuItem>
          );
        })}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => void handleSignOut()} className="cursor-pointer">
          <LogOut className="size-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
