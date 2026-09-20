import { FormEvent, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Loader2, ShieldCheck } from "lucide-react";
import { GlassCard } from "@/components/common/GlassCard";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — ALPHENTRA" },
      {
        name: "description",
        content: "Sign in to your ALPHENTRA paper-trading account and build strategies and enter the arena.",
      },
      { property: "og:title", content: "Sign in — ALPHENTRA" },
      { property: "og:description", content: "Sign in to your paper-trading arena account." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!authLoading && user) {
    void navigate({ to: "/" });
    return null;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);

    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              full_name: displayName.trim(),
            },
          },
        });

        if (error) throw error;

        if (data.session) {
          toast.success("Welcome to ALPHENTRA.");
          await navigate({ to: "/" });
        } else {
          toast.success("Account created. Check your email to confirm your account.");
          setMode("signin");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) throw error;

        toast.success("Welcome back to ALPHENTRA.");
        await navigate({ to: "/" });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Authentication failed.";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-10">
      <div className="arena-grid absolute inset-0 opacity-60" />
      <div className="pointer-events-none absolute -left-32 top-10 size-80 rounded-full bg-primary/12 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-0 size-80 rounded-full bg-accent/10 blur-3xl" />

      <GlassCard className="relative w-full max-w-md p-7">
        <Logo />
        <h1 className="mt-6 text-2xl font-bold tracking-tight text-foreground">
          {mode === "signin" ? "Enter the arena" : "Create your ALPHENTRA account"}
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {mode === "signin"
            ? "Sign in to your simulated account. No funding, no brokerage, no real money."
            : "Create your paper-trading identity and start building strategies."}
        </p>

        <div className="mt-6 grid grid-cols-2 rounded-xl border border-border bg-surface p-1">
          <button
            type="button"
            onClick={() => setMode("signin")}
            className={mode === "signin"
              ? "rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground"
              : "rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"}
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => setMode("signup")}
            className={mode === "signup"
              ? "rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground"
              : "rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"}
          >
            Create account
          </button>
        </div>

        <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
          {mode === "signup" && (
            <div className="space-y-2">
              <Label htmlFor="display-name">Display name</Label>
              <Input
                id="display-name"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                placeholder="Marquis Ogre"
                autoComplete="name"
                required
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="At least 6 characters"
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              minLength={6}
              required
            />
          </div>

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting && <Loader2 className="size-4 animate-spin" />}
            {mode === "signin" ? "Sign in" : "Create account"}
          </Button>
        </form>

        <div className="mt-5 flex items-center gap-2 rounded-xl border border-warning/30 bg-warning/10 px-3 py-2.5 text-xs text-warning">
          <ShieldCheck className="size-4 shrink-0" />
          ALPHENTRA is a paper-trading simulator. Nothing here executes in real markets.
        </div>

        <p className="mt-5 text-center text-sm text-muted-foreground">
          ALPHENTRA requires an authenticated account. Guest access is disabled.
        </p>
      </GlassCard>
    </div>
  );
}
