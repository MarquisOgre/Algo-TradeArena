import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { GlassCard } from "@/components/common/GlassCard";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/auth/confirm")({
  head: () => ({
    meta: [
      { title: "Email Confirmed — ALPHENTRA" },
      {
        name: "description",
        content: "Confirm your ALPHENTRA email address.",
      },
    ],
  }),
  component: ConfirmEmailPage,
});

type ConfirmationState = "processing" | "success" | "error";

function ConfirmEmailPage() {
  const navigate = useNavigate();
  const [state, setState] = useState<ConfirmationState>("processing");
  const [message, setMessage] = useState("Confirming your email address…");

  useEffect(() => {
    let active = true;
    let handled = false;

    const finish = async (session: Session | null) => {
      if (!active || handled) return;
      handled = true;

      if (!session) {
        setState("error");
        setMessage("We couldn't confirm this email address. The confirmation link may be expired or invalid.");
        return;
      }

      const { error } = await supabase.auth.signOut({ scope: "local" });
      if (!active) return;

      if (error) {
        console.error("Failed to end confirmation session:", error);
      }

      setState("success");
      setMessage("Your email address has been confirmed successfully.");
    };

    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "INITIAL_SESSION" || event === "SIGNED_IN") {
        void finish(session);
      }
    });

    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const errorDescription = hashParams.get("error_description");

    if (errorDescription) {
      setState("error");
      setMessage(errorDescription.replace(/\+/g, " "));
      handled = true;
    } else {
      void supabase.auth.getSession().then(({ data: sessionData, error }) => {
        if (error) {
          setState("error");
          setMessage(error.message);
          handled = true;
          return;
        }

        if (sessionData.session) {
          void finish(sessionData.session);
        } else {
          window.setTimeout(() => {
            if (!active || handled) return;
            setState("error");
            setMessage("We couldn't confirm this email address. Please request a new confirmation email.");
            handled = true;
          }, 2500);
        }
      });
    }

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-10">
      <div className="arena-grid absolute inset-0 opacity-60" />
      <div className="pointer-events-none absolute -left-32 top-10 size-80 rounded-full bg-primary/12 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-0 size-80 rounded-full bg-accent/10 blur-3xl" />

      <GlassCard className="relative w-full max-w-md p-7 text-center">
        <div className="flex justify-center">
          <Logo />
        </div>

        {state === "processing" && (
          <>
            <Loader2 className="mx-auto mt-8 size-12 animate-spin text-primary" />
            <h1 className="mt-6 text-2xl font-bold tracking-tight text-foreground">
              Confirming your email
            </h1>
            <p className="mt-3 text-sm text-muted-foreground">{message}</p>
          </>
        )}

        {state === "success" && (
          <>
            <CheckCircle2 className="mx-auto mt-8 size-14 text-primary" />
            <h1 className="mt-6 text-2xl font-bold tracking-tight text-foreground">
              Email Confirmed Successfully
            </h1>
            <p className="mt-3 text-sm text-muted-foreground">{message}</p>
            <Button className="mt-6 w-full" onClick={() => void navigate({ to: "/login" })}>
              Continue to Sign In
            </Button>
          </>
        )}

        {state === "error" && (
          <>
            <XCircle className="mx-auto mt-8 size-14 text-destructive" />
            <h1 className="mt-6 text-2xl font-bold tracking-tight text-foreground">
              Email Confirmation Failed
            </h1>
            <p className="mt-3 text-sm text-muted-foreground">{message}</p>
            <Button className="mt-6 w-full" onClick={() => void navigate({ to: "/login" })}>
              Back to Sign In
            </Button>
          </>
        )}
      </GlassCard>
    </div>
  );
}
