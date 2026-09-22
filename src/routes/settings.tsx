import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/common/PageHeader";
import { GlassCard } from "@/components/common/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — ALPHENTRA" },
      { name: "description", content: "Manage your ALPHENTRA profile, notifications and paper-trading preferences." },
      { property: "og:title", content: "Settings — ALPHENTRA" },
      { property: "og:description", content: "Profile, notification and paper-trading preferences." },
    ],
  }),
  component: SettingsPage,
});

const notificationFields = [
  { id: "trade_notifications", label: "Trade activity", hint: "Order and execution updates for your paper trading activity." },
  { id: "copy_trading_notifications", label: "Copy Trader", hint: "Updates about copied strategies, allocations and copy-trading events." },
  { id: "strategy_notifications", label: "Strategy activity", hint: "Updates about strategy builds, backtests and published strategies." },
  { id: "competition_notifications", label: "Arena results", hint: "Notify me when one of my strategies finishes a competition." },
  { id: "payment_notifications", label: "Payments", hint: "Payment orders, invoices, refunds and revenue-related updates." },
  { id: "wallet_notifications", label: "Wallet", hint: "Wallet activity and future ALPH transaction updates." },
  { id: "security_notifications", label: "Security", hint: "Important account, sign-in and security notifications." },
  { id: "marketing_notifications", label: "Product updates", hint: "Occasional ALPHENTRA announcements and product news." },
] as const;

type NotificationField = (typeof notificationFields)[number]["id"];
type NotificationState = Record<NotificationField, boolean>;

const defaultNotifications: NotificationState = {
  trade_notifications: true,
  copy_trading_notifications: true,
  strategy_notifications: true,
  competition_notifications: true,
  payment_notifications: true,
  wallet_notifications: true,
  security_notifications: true,
  marketing_notifications: false,
};

function SettingsPage() {
  const { user, loading: authLoading } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [handle, setHandle] = useState("");
  const [notifications, setNotifications] = useState<NotificationState>(defaultNotifications);
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingNotifications, setSavingNotifications] = useState(false);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function loadSettings() {
      setLoading(true);

      const [profileResult, preferencesResult] = await Promise.all([
        supabase
          .from("profiles")
          .select("display_name, username")
          .eq("id", user.id)
          .maybeSingle(),
        supabase
          .from("notification_preferences")
          .select(
            "trade_notifications, copy_trading_notifications, strategy_notifications, competition_notifications, payment_notifications, wallet_notifications, security_notifications, marketing_notifications",
          )
          .eq("profile_id", user.id)
          .maybeSingle(),
      ]);

      if (cancelled) return;

      if (profileResult.error) {
        console.error("Failed to load ALPHENTRA profile:", profileResult.error);
        toast.error("Could not load your profile.");
      } else {
        setDisplayName(
          profileResult.data?.display_name ??
            user.user_metadata?.full_name ??
            user.user_metadata?.name ??
            "",
        );
        setHandle(profileResult.data?.username ?? "");
      }

      if (preferencesResult.error) {
        console.error("Failed to load notification preferences:", preferencesResult.error);
      } else if (preferencesResult.data) {
        setNotifications({
          trade_notifications: preferencesResult.data.trade_notifications,
          copy_trading_notifications: preferencesResult.data.copy_trading_notifications,
          strategy_notifications: preferencesResult.data.strategy_notifications,
          competition_notifications: preferencesResult.data.competition_notifications,
          payment_notifications: preferencesResult.data.payment_notifications,
          wallet_notifications: preferencesResult.data.wallet_notifications,
          security_notifications: preferencesResult.data.security_notifications,
          marketing_notifications: preferencesResult.data.marketing_notifications,
        });
      }

      setLoading(false);
    }

    void loadSettings();

    return () => {
      cancelled = true;
    };
  }, [user]);

  async function saveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) return;

    const nextDisplayName = displayName.trim();
    const nextHandle = handle.trim().replace(/^@+/, "").toLowerCase();

    if (nextHandle && !/^[a-z0-9_]{3,30}$/.test(nextHandle)) {
      toast.error("Handle must be 3–30 characters using letters, numbers or underscores.");
      return;
    }

    setSavingProfile(true);

    const [profileResult, authResult] = await Promise.all([
      supabase
        .from("profiles")
        .update({
          display_name: nextDisplayName || null,
          username: nextHandle || null,
        })
        .eq("id", user.id),
      supabase.auth.updateUser({
        data: {
          full_name: nextDisplayName || null,
          name: nextDisplayName || null,
        },
      }),
    ]);

    setSavingProfile(false);

    if (profileResult.error) {
      toast.error(profileResult.error.message);
      return;
    }

    if (authResult.error) {
      toast.error(`Profile saved, but account display name could not be synced: ${authResult.error.message}`);
      return;
    }

    setHandle(nextHandle);
    toast.success("Profile saved.");
  }

  async function changePassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user?.email) return;

    if (newPassword.length < 6) {
      toast.error("New password must be at least 6 characters.");
      return;
    }

    if (newPassword !== confirmNewPassword) {
      toast.error("New passwords do not match.");
      return;
    }

    setChangingPassword(true);

    try {
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: oldPassword,
      });

      if (verifyError) {
        toast.error("Old password is incorrect.");
        return;
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) throw updateError;

      setOldPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      setShowPasswordReset(false);
      toast.success("Changed Password Successfully");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Password change failed.";
      toast.error(message);
    } finally {
      setChangingPassword(false);
    }
  }

  async function saveNotifications() {
    if (!user) return;

    setSavingNotifications(true);

    const { error } = await supabase
      .from("notification_preferences")
      .upsert(
        {
          profile_id: user.id,
          in_app_enabled: true,
          email_enabled: true,
          push_enabled: true,
          ...notifications,
        },
        { onConflict: "profile_id" },
      );

    setSavingNotifications(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Notification preferences saved.");
  }

  if (authLoading || loading) {
    return (
      <AppShell>
        <div className="flex min-h-[50vh] items-center justify-center text-muted-foreground">
          <Loader2 className="mr-2 size-4 animate-spin" />
          Loading your settings...
        </div>
      </AppShell>
    );
  }

  if (!user) {
    return (
      <AppShell>
        <PageHeader eyebrow="System" title="Settings" description="Manage your ALPHENTRA account preferences." />
        <GlassCard className="mt-6 p-6">
          <h2 className="text-lg font-semibold text-foreground">Sign in required</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in to manage your profile and notification preferences.
          </p>
          <Button asChild className="mt-4">
            <Link to="/login">Sign In</Link>
          </Button>
        </GlassCard>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHeader
        eyebrow="System"
        title="Settings"
        description="Your profile and notification preferences are now stored in ALPHENTRA."
      />

      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        <GlassCard className="p-5 sm:p-6">
          <h2 className="text-sm font-semibold text-foreground">Profile</h2>
          <p className="mt-1 text-xs text-muted-foreground">This information is stored in your ALPHENTRA account.</p>

          <form className="mt-5 space-y-4" onSubmit={saveProfile}>
            <div className="space-y-2">
              <Label htmlFor="display">Display name</Label>
              <Input
                id="display"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                placeholder="Your display name"
                autoComplete="name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="handle">Handle</Label>
              <Input
                id="handle"
                value={handle ? "@" + handle : ""}
                onChange={(event) => setHandle(event.target.value.replace(/^@+/, ""))}
                placeholder="@yourhandle"
                autoComplete="nickname"
              />
              <p className="text-xs text-muted-foreground">3–30 characters: letters, numbers and underscores.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={user.email ?? ""} readOnly disabled />
              <p className="text-xs text-muted-foreground">Email changes will use the secure Supabase confirmation flow.</p>
            </div>

            <Button type="submit" disabled={savingProfile}>
              {savingProfile && <Loader2 className="size-4 animate-spin" />}
              {savingProfile ? "Saving..." : "Save profile"}
            </Button>
          </form>
        </GlassCard>

        <GlassCard className="p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Notifications</h2>
              <p className="mt-1 text-xs text-muted-foreground">Choose which ALPHENTRA events you want to receive.</p>
            </div>
            <ShieldCheck className="size-5 text-muted-foreground" />
          </div>

          <div className="mt-5 space-y-4">
            {notificationFields.map((field, index) => (
              <div key={field.id}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <Label htmlFor={field.id}>{field.label}</Label>
                    <p className="mt-1 text-xs text-muted-foreground">{field.hint}</p>
                  </div>
                  <Switch
                    id={field.id}
                    checked={notifications[field.id]}
                    onCheckedChange={(checked) =>
                      setNotifications((current) => ({ ...current, [field.id]: checked }))
                    }
                  />
                </div>
                {index < notificationFields.length - 1 && <Separator className="mt-4" />}
              </div>
            ))}
          </div>

          <Button className="mt-5" onClick={() => void saveNotifications()} disabled={savingNotifications}>
            {savingNotifications && <Loader2 className="size-4 animate-spin" />}
            {savingNotifications ? "Saving..." : "Save notifications"}
          </Button>
        </GlassCard>

        <GlassCard className="p-5 sm:p-6 xl:col-span-2">
          <h2 className="text-sm font-semibold text-foreground">Paper trading environment</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Your account now has a persistent ALPHENTRA paper portfolio backed by Supabase. Real brokerage,
            exchange, MT5 and withdrawal execution are still separate integrations and remain disabled.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link to="/portfolio">Open paper portfolio</Link>
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowPasswordReset((current) => !current)}
            >
              {showPasswordReset ? "Cancel Password Change" : "Reset Password"}
            </Button>
          </div>

          {showPasswordReset && (
            <form className="mt-6 max-w-xl space-y-4 border-t border-border pt-6" onSubmit={changePassword}>
              <div>
                <h3 className="text-sm font-semibold text-foreground">Change Password</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Verify your old password, then choose a new password for your ALPHENTRA account.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="old-password">Old Password</Label>
                <Input
                  id="old-password"
                  type="password"
                  value={oldPassword}
                  onChange={(event) => setOldPassword(event.target.value)}
                  autoComplete="current-password"
                  placeholder="Enter your current password"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  autoComplete="new-password"
                  placeholder="At least 6 characters"
                  minLength={6}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-new-password">Confirm New Password</Label>
                <Input
                  id="confirm-new-password"
                  type="password"
                  value={confirmNewPassword}
                  onChange={(event) => setConfirmNewPassword(event.target.value)}
                  autoComplete="new-password"
                  placeholder="Re-enter your new password"
                  minLength={6}
                  required
                />
              </div>

              <Button type="submit" disabled={changingPassword}>
                {changingPassword && <Loader2 className="size-4 animate-spin" />}
                {changingPassword ? "Changing Password..." : "Save"}
              </Button>
            </form>
          )}
        </GlassCard>
      </div>
    </AppShell>
  );
}
