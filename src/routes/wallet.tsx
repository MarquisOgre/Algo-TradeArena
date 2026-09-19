import { createFileRoute } from "@tanstack/react-router";
import { Coins, ArrowDownLeft, ArrowUpRight, Trophy, LockKeyhole, Gift, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { GlassCard } from "@/components/ui/GlassCard";

export const Route = createFileRoute("/wallet")({ component: WalletPage });

const transactions = [
  ["Competition reward", "+250 ALPH", "Completed", "Today"],
  ["Strategy subscription", "-40 ALPH", "Completed", "Yesterday"],
  ["Arena entry", "-100 ALPH", "Completed", "Sep 17"],
];

function WalletPage() {
  return <div className="space-y-6">
    <PageHeader title="ALPHENTRA Wallet" description="Manage your platform balance, rewards, competition activity, and future token utility." />

    <div className="grid gap-4 lg:grid-cols-3">
      <GlassCard className="lg:col-span-2 p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">ALPHENTRA Balance</p>
            <p className="mt-2 text-4xl font-semibold tracking-tight">1,250.00 <span className="text-lg text-muted-foreground">ALPH</span></p>
            <p className="mt-2 text-xs text-amber-400">Prototype balance · no real funds</p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10"><Coins className="h-6 w-6 text-primary" /></div>
        </div>
        <div className="mt-6 flex flex-wrap gap-2">
          <button className="rounded-lg bg-primary px-4 py-2 text-sm font-medium"><ArrowDownLeft className="mr-2 inline h-4 w-4" />Add ALPH</button>
          <button className="rounded-lg border px-4 py-2 text-sm font-medium"><ArrowUpRight className="mr-2 inline h-4 w-4" />Send</button>
        </div>
      </GlassCard>

      <GlassCard className="p-6">
        <div className="flex items-center gap-3"><Trophy className="h-5 w-5 text-amber-400" /><h3 className="font-semibold">Competition Credits</h3></div>
        <p className="mt-4 text-3xl font-semibold">1,150 <span className="text-sm text-muted-foreground">ALPH</span></p>
        <p className="mt-2 text-sm text-muted-foreground">Available for ALPHENTRA Arena entries.</p>
      </GlassCard>
    </div>

    <div className="grid gap-4 md:grid-cols-3">
      {[
        [Trophy, "Competition", "Entry fees are designed to use ALPHENTRA only. Eligible rewards are paid in ALPHENTRA."],
        [Gift, "Rewards", "Earn platform-defined rewards from eligible competitions and future ecosystem programs."],
        [LockKeyhole, "Staking", "Future ALPHENTRA staking will use a transparent, published reward mechanism."],
      ].map(([Icon, title, text]) => <GlassCard key={title as string} className="p-5"><Icon className="h-5 w-5 text-cyan-400" /><h3 className="mt-4 font-semibold">{title as string}</h3><p className="mt-2 text-sm text-muted-foreground">{text as string}</p></GlassCard>)}
    </div>

    <GlassCard className="p-6">
      <h2 className="font-semibold">Recent activity</h2>
      <div className="mt-4 divide-y divide-border/50">
        {transactions.map(([name, amount, status, date]) => <div key={name + date} className="flex items-center justify-between py-4 text-sm"><div><p className="font-medium">{name}</p><p className="text-xs text-muted-foreground">{date}</p></div><div className="text-right"><p className={amount.startsWith("+") ? "text-emerald-400" : "text-foreground"}>{amount}</p><p className="text-xs text-muted-foreground">{status}</p></div></div>)}
      </div>
    </GlassCard>

    <GlassCard className="p-5">
      <div className="flex gap-3"><ShieldCheck className="h-5 w-5 text-cyan-400" /><p className="text-sm text-muted-foreground">Wallet, token balances, staking, competition entry, and rewards shown here are prototype product flows. Real token issuance, custody, transfers, and regulated financial functionality will be added only after the required infrastructure and regulatory review.</p></div>
    </GlassCard>
  </div>;
}
