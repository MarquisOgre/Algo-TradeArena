import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Bot, Flame, Loader2, Medal, Store, Swords } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/common/PageHeader";
import { GlassCard } from "@/components/common/GlassCard";
import { StatCard } from "@/components/common/StatCard";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { formatMoney } from "@/components/common/Delta";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Profile — ALPHENTRA" },
      {
        name: "description",
        content: "Your ALPHENTRA profile, strategy activity, competition activity and paper account progress.",
      },
      { property: "og:title", content: "Profile — ALPHENTRA" },
      { property: "og:description", content: "Your ALPHENTRA profile and strategy activity." },
    ],
  }),
  component: ProfilePage,
});

type ProfileRecord = {
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
};

type StrategyRecord = {
  id: string;
  name: string;
  slug: string;
  status: string;
  is_marketplace_listed: boolean;
};

function initials(value: string) {
  const parts = value.trim().split(/\\s+/).filter(Boolean);
  if (!parts.length) return "AL";
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase() ?? "").join("");
}

function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<ProfileRecord | null>(null);
  const [strategies, setStrategies] = useState<StrategyRecord[]>([]);
  const [paperEquity, setPaperEquity] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function loadProfile() {
      setLoading(true);

      const profileResult = await supabase
        .from("profiles")
        .select("display_name, username, avatar_url, bio")
        .eq("id", user.id)
        .maybeSingle();

      const portfolioResult = await supabase
        .from("portfolios")
        .select("equity")
        .eq("profile_id", user.id)
        .eq("portfolio_type", "paper")
        .eq("name", "Main Paper Account")
        .maybeSingle();

      const traderResult = await supabase
        .from("traders")
        .select("id")
        .eq("profile_id", user.id)
        .maybeSingle();

      let strategyRows: StrategyRecord[] = [];

      if (traderResult.data?.id) {
        const strategyResult = await supabase
          .from("strategies")
          .select("id, name, slug, status, is_marketplace_listed")
          .eq("trader_id", traderResult.data.id)
          .order("created_at", { ascending: false });

        if (strategyResult.error) {
          console.error("Failed to load ALPHENTRA strategies:", strategyResult.error);
        } else {
          strategyRows = (strategyResult.data ?? []) as StrategyRecord[];
        }
      }

      if (cancelled) return;

      if (profileResult.error) {
        console.error("Failed to load ALPHENTRA profile:", profileResult.error);
      } else {
        setProfile(profileResult.data as ProfileRecord | null);
      }

      if (portfolioResult.error) {
        console.error("Failed to load ALPHENTRA paper account:", portfolioResult.error);
      } else {
        setPaperEquity(portfolioResult.data?.equity ?? null);
      }

      setStrategies(strategyRows);
      setLoading(false);
    }

    void loadProfile();

    return () => {
      cancelled = true;
    };
  }, [user]);

  if (authLoading || loading) {
    return (
      <AppShell wide>
        <div className="flex min-h-[50vh] items-center justify-center text-muted-foreground">
          <Loader2 className="mr-2 size-4 animate-spin" />
          Loading your profile...
        </div>
      </AppShell>
    );
  }

  if (!user) {
    return (
      <AppShell wide>
        <PageHeader eyebrow="Account" title="Profile" description="Your ALPHENTRA identity and activity." />
        <GlassCard className="mt-6 p-6">
          <h2 className="text-lg font-semibold text-foreground">Sign in required</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in to view and manage your ALPHENTRA profile.
          </p>
          <Button asChild className="mt-4">
            <Link to="/login">Sign In</Link>
          </Button>
        </GlassCard>
      </AppShell>
    );
  }

  const displayName =
    profile?.display_name ||
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email?.split("@")[0] ||
    "ALPHENTRA";
  const handle = profile?.username ? "@" + profile.username : "No handle yet";
  const fallback = initials(displayName);

  return (
    <AppShell wide>
      <PageHeader
        eyebrow="Account"
        title="Profile"
        description="Your ALPHENTRA identity, strategy activity and account progress."
      />

      <GlassCard className="arena-grid mt-6 p-6">
        <div className="flex flex-wrap items-center gap-4">
          <Avatar className="size-16 border border-border">
            <AvatarFallback className="bg-surface-2 text-lg font-bold">{fallback}</AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-bold text-foreground">{displayName}</h2>
            <p className="text-sm text-muted-foreground">
              {handle} · ALPHENTRA member
            </p>
            {profile?.bio && <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{profile.bio}</p>}
          </div>

          <Button asChild variant="outline">
            <Link to="/settings">Edit profile</Link>
          </Button>
        </div>
      </GlassCard>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Paper equity"
          value={paperEquity === null ? "—" : formatMoney(Number(paperEquity))}
          hint="Main Paper Account"
          icon={WalletIcon}
        />
        <StatCard label="AI strategies" value={String(strategies.length)} hint="Your strategies" icon={Bot} />
        <StatCard label="Arena entries" value="—" icon={Swords} hint="Competition tracking coming next" />
        <StatCard label="XP" value="—" icon={Flame} hint="Arena reputation coming next" />
      </div>

      <section className="mt-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-foreground">Your AI strategies</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Strategies saved to your ALPHENTRA account.
            </p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link to="/strategies">
              <Store className="mr-2 size-4" />
              Strategy Marketplace
            </Link>
          </Button>
        </div>

        {strategies.length ? (
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {strategies.map((strategy) => (
              <GlassCard key={strategy.id} className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate font-semibold text-foreground">{strategy.name}</h3>
                    <p className="mt-1 truncate text-xs text-muted-foreground">/{strategy.slug}</p>
                  </div>
                  <span className="rounded-full border border-border bg-surface px-2 py-1 text-[11px] font-medium capitalize text-muted-foreground">
                    {strategy.status}
                  </span>
                </div>
                <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                  <span>{strategy.is_marketplace_listed ? "Marketplace listed" : "Private strategy"}</span>
                  <Link to="/strategies" className="font-semibold text-foreground hover:text-primary">
                    Open →
                  </Link>
                </div>
              </GlassCard>
            ))}
          </div>
        ) : (
          <GlassCard className="mt-4 p-6">
            <h3 className="font-semibold text-foreground">No strategies yet</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Your Strategy Lab and marketplace work will appear here once you create your first persistent strategy.
            </p>
            <Button asChild className="mt-4" variant="outline">
              <Link to="/lab">Open Strategy Lab</Link>
            </Button>
          </GlassCard>
        )}
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-bold text-foreground">Account status</h2>
        <GlassCard className="mt-4 p-5 text-sm text-muted-foreground">
          Your identity, profile settings, notification preferences and paper account are now connected to Supabase.
          Arena rankings, XP and live brokerage/MT5 activity will be connected in their respective backend phases.
        </GlassCard>
      </section>
    </AppShell>
  );
}

function WalletIcon() {
  return <span className="text-sm font-bold">$</span>;
}
