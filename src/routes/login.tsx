import { FormEvent, useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { GlassCard } from "@/components/common/GlassCard";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/login")({
  validateSearch: (search) => ({
    mode: search.mode === "forgot" ? "forgot" : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Sign in — ALPHENTRA" },
      {
        name: "description",
        content: "Sign in to your ALPHENTRA account.",
      },
      { property: "og:title", content: "Sign in — ALPHENTRA" },
      { property: "og:description", content: "Sign in to your ALPHENTRA account." },
    ],
  }),
  component: LoginPage,
});

type Mode = "signin" | "signup" | "forgot" | "reset";

function LoginPage() {
  const navigate = useNavigate();
  const { mode: requestedMode } = Route.useSearch();
  const { user, loading: authLoading, passwordRecovery } = useAuth();
  const [mode, setMode] = useState<Mode>(requestedMode === "forgot" ? "forgot" : "signin");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (passwordRecovery) {
      setMode("reset");
    } else if (requestedMode === "forgot") {
      setMode("forgot");
    }
  }, [passwordRecovery, requestedMode]);

  if (!authLoading && user && !passwordRecovery && mode !== "reset" && mode !== "forgot") {
    void navigate({ to: "/app" });
    return null;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);

    try {
      if (mode === "reset") {
        if (password.length < 6) throw new Error("Password must be at least 6 characters.");
        if (password !== confirmPassword) throw new Error("Passwords do not match.");

        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;

        toast.success("Password changed successfully.");
        await navigate({ to: "/app" });
      } else if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { data: { full_name: displayName.trim() } },
        });

        if (error) throw error;

        if (data.session) {
          toast.success("Welcome to ALPHENTRA.");
          await navigate({ to: "/app" });
        } else {
          toast.success("Account created. Check your email to confirm your account.");
          setMode("signin");
        }
      } else if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: window.location.origin + "/login",
        });

        if (error) throw error;
        toast.success("If an account exists for that email, a password reset link has been sent.");
        setMode("signin");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) throw error;

        toast.success("Welcome back to ALPHENTRA.");
        await navigate({ to: "/app" });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Authentication failed.";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  const title =
    mode === "signup"
      ? "Create your ALPHENTRA account"
      : mode === "forgot"
        ? "Reset your password"
        : mode === "reset"
          ? "Change your password"
          : "Enter the arena";

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-10">
      <div className="arena-grid absolute inset-0 opacity-60" />
      <div className="pointer-events-none absolute -left-32 top-10 size-80 rounded-full bg-primary/12 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-0 size-80 rounded-full bg-accent/10 blur-3xl" />

      <GlassCard className="relative w-full max-w-md p-7">
        <div className="flex justify-center">
          <Logo />
        </div>
        <h1 className="mt-6 text-2xl font-bold tracking-tight text-foreground">{title}</h1>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
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

          {mode !== "reset" && (
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
          )}

          {mode !== "forgot" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="password">Password</Label>
                {mode === "signin" && (
                  <button
                    type="button"
                    onClick={() => setMode("forgot")}
                    className="text-xs font-medium text-primary hover:underline"
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
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
              {mode === "reset" && (
                <div className="mt-3 space-y-2">
                  <Label htmlFor="confirm-password">Confirm new password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    placeholder="Re-enter your new password"
                    autoComplete="new-password"
                    minLength={6}
                    required
                  />
                </div>
              )}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting && <Loader2 className="size-4 animate-spin" />}
            {mode === "signin" ? "Sign in" : mode === "signup" ? "Create account" : mode === "reset" ? "Change Password" : "Send reset link"}
          </Button>
        </form>

        <div className="mt-5 flex items-center justify-center gap-2 text-sm">
          {mode === "signin" && (
            <>
              <span className="text-muted-foreground">New to ALPHENTRA?</span>
              <button
                type="button"
                onClick={() => setMode("signup")}
                className="font-medium text-primary hover:underline"
              >
                Create Account
              </button>
            </>
          )}

          {mode === "signup" && (
            <>
              <span className="text-muted-foreground">Already have an account?</span>
              <button
                type="button"
                onClick={() => setMode("signin")}
                className="font-medium text-primary hover:underline"
              >
                Sign In
              </button>
            </>
          )}

          {mode === "forgot" && (
            <button
              type="button"
              onClick={() => setMode("signin")}
              className="font-medium text-primary hover:underline"
            >
              Back to Sign In
            </button>
          )}
        </div>
      </GlassCard>
    </div>
  );
}
