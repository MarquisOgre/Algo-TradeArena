import { Link } from "@tanstack/react-router";
import { HelpCircle, Settings, UserRound } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

const userOptions = [
  { label: "Profile", to: "/profile", icon: UserRound },
  { label: "Settings", to: "/settings", icon: Settings },
  { label: "Help", to: "/help", icon: HelpCircle },
] as const;

export function UserMenu({ compact = false }: { compact?: boolean }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {compact ? (
          <button
            type="button"
            aria-label="Open user menu"
            className="flex items-center gap-2 rounded-xl border border-border bg-surface px-2 py-1.5 transition-colors hover:border-primary/40 hover:bg-surface-2"
          >
            <span className="hidden text-xs font-semibold text-foreground sm:inline">User</span>
            <Avatar className="size-8 border border-border">
              <AvatarFallback className="bg-surface-2 text-[10px] font-semibold">MO</AvatarFallback>
            </Avatar>
          </button>
        ) : (
          <button
            type="button"
            aria-label="Open user menu"
            className="flex w-full items-center gap-3 rounded-xl px-0 py-0 text-left transition-colors hover:bg-surface-2/60"
          >
            <Avatar className="size-9 border border-border">
              <AvatarFallback className="bg-surface-2 text-xs font-semibold">MO</AvatarFallback>
            </Avatar>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium text-foreground">Marquis Ogre</span>
              <span className="block truncate text-xs text-muted-foreground">Paper account · Tier II</span>
            </span>
          </button>
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent
        side={compact ? "bottom" : "top"}
        align={compact ? "end" : "start"}
        sideOffset={8}
        className={cn("w-52", !compact && "mb-1")}
      >
        <div className="px-2 py-1.5">
          <p className="text-xs font-semibold text-foreground">User</p>
          <p className="text-[11px] text-muted-foreground">Marquis Ogre</p>
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
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
