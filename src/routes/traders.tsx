import { createFileRoute } from "@tanstack/react-router";
import { Users, Trophy, Copy, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { GlassCard } from "@/components/common/GlassCard";

export const Route = createFileRoute("/traders")({ component: TradersPage });

const traders = [
  { name: "NovaQuant", role: "AI Strategist", rank: "Top 2%" },
  { name: "Mira FX", role: "Systematic Trader", rank: "Top 5%" },
  { name: "AlphaForge", role: "Strategy Creator", rank: "Top 8%" },
];

function TradersPage() {
  return <div className="space-y-6"><PageHeader title="Traders" description="Discover strategy creators, competition performers, and traders to follow." /><div className="grid gap-4 md:grid-cols-3">{traders.map((trader) => <GlassCard key={trader.name} className="p-5"><div className="flex items-center justify-between"><div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10"><Users className="h-5 w-5 text-primary" /></div><span className="text-xs text-emerald-400">{trader.rank}</span></div><h3 className="mt-4 font-semibold">{trader.name}</h3><p className="text-sm text-muted-foreground">{trader.role}</p><div className="mt-5 flex gap-2"><button className="rounded-lg border px-3 py-2 text-xs"><Copy className="mr-1 inline h-3.5 w-3.5" />Follow</button><button className="rounded-lg border px-3 py-2 text-xs"><Trophy className="mr-1 inline h-3.5 w-3.5" />Record</button></div></GlassCard>)}</div><GlassCard className="p-5"><div className="flex gap-3"><ShieldCheck className="h-5 w-5 text-cyan-400" /><p className="text-sm text-muted-foreground">Performance data shown here is prototype data. Verified performance, copying, subscriptions, and payouts will require the platform's live trading and compliance infrastructure.</p></div></GlassCard></div>;
}
