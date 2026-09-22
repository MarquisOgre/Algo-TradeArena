import { FormEvent, useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { GlassCard } from "@/components/common/GlassCard";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/auth/reset-password")({
  head: () => ({
    meta: [
      { title: "Change Password — ALPHENTRA" },
      {
        name: "description",
        content: "Set a new password for your ALPHENTRA account.",
      },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [invalid, setInvalid] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    let recoveryDetected = false;

    const handleRecovery = (session: Awaited<ReturnType<typeof supabase.auth.getSession>>["data"]["session"]) => {
      if (!active || !session || recoveryDetected) return;
      recoveryDetected = true;
      setReady(true);
      setInvalid(false);
    };

    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        handleRecovery(session);
      }
    });

    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const hashType = hashParams.get("type");
    const hashError = hashParams.get("error_description");

    if (hashError) {
      setInvalid(true);
    } else if (hashType === "recovery") {
      void supabase.auth.getSession().then(({ data: sessionData, error }) => {
        if (!active) return;
        if (error || !sessionData.session) {
          setInvalid(true);
          return;
        }
        handleRecovery(sessionData.session);
      });
    } else {
      void supabase.auth.getSession().then(({ data: sessionData }) => {
        if (!active) return;
        if (sessionData.session) {
          setInvalid(true);
        } else {
          setInvalid(true);
        }
      });
    }

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setSubmitting(true);

    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;

      await supabase.auth.signOut({ scope: "local" });
      toast.success("Password changed successfully. You can now sign in.");
      await navigate({ to: "/login" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to change your password.";
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
        <div className="flex justify-center">
          <Logo />
        </div>

        {!ready && !invalid && (
          <div className="text-center">
            <Loader2 className="mx-auto mt-8 size-10 animate-spin text-primary" />
            <h1 className="mt-6 text-2xl font-bold tracking-tight text-foreground">
              Preparing Password Reset
            </h1>
            <p className="mt-3 text-sm text-muted-foreground">
              Please wait while we securely prepare your password reset.
            </p>
          </div>
        )}

        {invalid && (
          <div className="text-center">
            <h1 className="mt-6 text-2xl font-bold tracking-tight text-foreground">
              Reset Link Invalid or Expired
            </h1>
            <p className="mt-3 text-sm text-muted-foreground">
              Please request a new password reset link and try again.
            </p>
            <Button className="mt-6 w-full" onClick={() => void navigate({ to: "/login", search: { mode: "forgot" } })}>
              Request a New Reset Link
            </Button>
          </div>
        )}

        {ready && (
          <>
            <h1 className="mt-6 text-2xl font-bold tracking-tight text-foreground">
              Change your password
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Enter a new password for your ALPHENTRA account.
            </p>

            <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="new-password">New password</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="At least 6 characters"
                  autoComplete="new-password"
                  minLength={6}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-new-password">Confirm new password</Label>
                <Input
                  id="confirm-new-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Re-enter your new password"
                  autoComplete="new-password"
                  minLength={6}
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting && <Loader2 className="size-4 animate-spin" />}
                Change Password
              </Button>
            </form>
          </>
        )}
      </GlassCard>
    </div>
  );
}
