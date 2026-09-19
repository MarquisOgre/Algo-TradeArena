import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/common/PageHeader";
import { GlassCard } from "@/components/common/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";

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

const toggles = [
  { id: "duels", label: "Arena results", hint: "Notify me when one of my strategies finishes a competition." },
  { id: "rank", label: "Rank changes", hint: "Alert me when my season rank moves by 25 places or more." },
  { id: "drawdown", label: "Risk alerts", hint: "Warn me when a simulated strategy breaches its configured drawdown threshold." },
  { id: "digest", label: "Weekly digest", hint: "A weekly summary of strategy, Arena and marketplace activity." },
];

function SettingsPage() {
  return (
    <AppShell>
      <PageHeader eyebrow="System" title="Settings" description="Manage your profile, notifications and paper-trading preferences. Changes are stored in this browser during the prototype." />

      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        <GlassCard className="p-5 sm:p-6">
          <h2 className="text-sm font-semibold text-foreground">Profile</h2>
          <form
            className="mt-4 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              toast.success("Profile changes saved in this browser.");
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="display">Display name</Label>
              <Input id="display" defaultValue="Marquis Ogre" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="handle">Handle</Label>
              <Input id="handle" defaultValue="@marquis" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" defaultValue="marquisogre@gmail.com" />
            </div>
            <Button type="submit">Save profile</Button>
          </form>
        </GlassCard>

        <GlassCard className="p-5 sm:p-6">
          <h2 className="text-sm font-semibold text-foreground">Notifications</h2>
          <div className="mt-4 space-y-4">
            {toggles.map((t, i) => (
              <div key={t.id}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <Label htmlFor={t.id}>{t.label}</Label>
                    <p className="mt-1 text-xs text-muted-foreground">{t.hint}</p>
                  </div>
                  <Switch id={t.id} defaultChecked={i < 2} />
                </div>
                {i < toggles.length - 1 && <Separator className="mt-4" />}
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="p-5 sm:p-6 xl:col-span-2">
          <h2 className="text-sm font-semibold text-foreground">Paper trading environment</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            ALPHENTRA is a simulation in this build. There is no brokerage connection, no real-money funding and no withdrawal flow. Resetting restores the virtual account to 100,000.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => toast("Paper account reset is not connected in this prototype.")}>
              Reset paper account
            </Button>
            <Button variant="ghost" onClick={() => toast("Broker connections arrive after the backend integration.")}>
              Broker connections · Soon
            </Button>
          </div>
        </GlassCard>
      </div>
    </AppShell>
  );
}
