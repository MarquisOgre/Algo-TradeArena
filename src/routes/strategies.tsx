import { createFileRoute } from "@tanstack/react-router";
import { Store, TrendingUp, Users, LockKeyhole } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { AppShell } from "@/components/layout/AppShell";
import { GlassCard } from "@/components/common/GlassCard";

export const Route = createFileRoute("/strategies")({ component: StrategiesPage });

const strategies = [
  { name: "Atlas Momentum", type: "Momentum", ret: "+18.4%", followers: "1,248" },
  { name: "Kepler Reversion", type: "Mean Reversion", ret: "+14.7%", followers: "834" },
  { name: "Orion Macro", type: "Macro", ret: "+11.9%", followers: "612" },
];

function StrategiesPage() {
  return <AppShell><div className="space-y-6"><PageHeader title="Strategy Marketplace" description="Discover, test, subscribe to, and follow strategies created by the ALPHENTRA community." /><div className="grid gap-4 md:grid-cols-3">{strategies.map((strategy) => <GlassCard key={strategy.name} className="p-5"><div className="flex items-center justify-between"><Store className="h-5 w-5 text-cyan-400" /><span className="text-xs text-emerald-400">{strategy.ret}</span></div><h3 className="mt-5 font-semibold">{strategy.name}</h3><p className="mt-1 text-sm text-muted-foreground">{strategy.type}</p><div className="mt-5 flex items-center justify-between text-xs text-muted-foreground"><span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />{strategy.followers} followers</span><span className="flex items-center gap-1"><TrendingUp className="h-3.5 w-3.5" />Verified track record</span></div></GlassCard>)}</div><GlassCard className="p-5"><div className="flex gap-3"><LockKeyhole className="h-5 w-5 text-amber-400" /><div><h3 className="font-medium">Marketplace payments</h3><p className="mt-1 text-sm text-muted-foreground">ALPHENTRA Token will be supported for strategy subscriptions and marketplace fees. Payments remain prototype-only until wallet infrastructure and regulatory requirements are finalized.</p></div></div></GlassCard></div></AppShell>;
}
