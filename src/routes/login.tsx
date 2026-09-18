import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { ShieldCheck } from "lucide-react";
import { GlassCard } from "@/components/common/GlassCard";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — TRADEARENA" },
      { name: "description", content: "Sign in to your TRADEARENA paper-trading account and take your agents into the arena." },
      { property: "og:title", content: "Sign in — TRADEARENA" },
      { property: "og:description", content: "Sign in to your paper-trading arena account." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-10">
      <div className="arena-grid absolute inset-0 opacity-60" />
      <div className="pointer-events-none absolute -left-32 top-10 size-80 rounded-full bg-primary/12 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-0 size-80 rounded-full bg-accent/10 blur-3xl" />

      <GlassCard className="relative w-full max-w-md p-7">
        <Logo />
        <h1 className="mt-6 text-2xl font-bold tracking-tight text-foreground">Enter the arena</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Sign in to your simulated account. No funding, no brokerage, no real money.
        </p>

        <form
          className="mt-6 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            toast("Accounts arrive with the next build — explore the arena freely.");
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="marquisogre@gmail.com" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" placeholder="••••••••" required />
          </div>
          <Button type="submit" className="w-full">
            Sign in
          </Button>
        </form>

        <div className="mt-5 flex items-center gap-2 rounded-xl border border-warning/30 bg-warning/10 px-3 py-2.5 text-xs text-warning">
          <ShieldCheck className="size-4 shrink-0" />
          TRADEARENA is a paper-trading simulator. Nothing here executes in real markets.
        </div>

        <p className="mt-5 text-center text-sm text-muted-foreground">
          Just looking around?{" "}
          <Link to="/" className="font-semibold text-primary hover:underline">
            Continue as guest
          </Link>
        </p>
      </GlassCard>
    </div>
  );
}
