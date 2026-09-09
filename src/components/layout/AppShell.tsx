import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { MobileNavigation } from "./MobileNavigation";
import { cn } from "@/lib/utils";

export function AppShell({
  children,
  className,
  wide = false,
}: {
  children: ReactNode;
  className?: string;
  wide?: boolean;
}) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="lg:pl-64">
        <TopBar />
        <main
          className={cn(
            "mx-auto w-full px-4 pb-28 pt-6 sm:px-6 lg:pb-12",
            wide ? "max-w-[1600px]" : "max-w-[1400px]",
            className,
          )}
        >
          {children}
        </main>
      </div>

      <Link
        to="/ai"
        aria-label="Open AI Copilot"
        className="glow-primary fixed bottom-20 right-4 z-40 flex size-13 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform hover:scale-105 lg:bottom-8 lg:right-8"
      >
        <Sparkles className="size-5" />
      </Link>

      <MobileNavigation />
    </div>
  );
}
