import { createFileRoute } from "@tanstack/react-router";
import { Coins, ArrowDownLeft, ArrowUpRight, Trophy, LockKeyhole, Gift, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { GlassCard } from "@/components/common/GlassCard";

export const Route = createFileRoute("/wallet")({ component: WalletPage });

const walletCards = [
  { icon: Trophy, title: "Competition", text: "Entry fees are designed to use ALPHENTRA only. Eligible rewards are paid in ALPHENTRA." },
  { icon: Gift, title: "Rewards", text: "Earn platform-defined rewards from eligible competitions and future ecosystem programs." },
  { icon: LockKeyhole, title: "Staking", text: "Future ALPHENTRA staking will use a transparent, published reward mechanism." },
];

const transactions = [
  { name: "Competition reward", amount: "+250 ALPH", status: "Completed", date: "Today" },
  { name: "Strategy subscription", amount: "-40 ALPH", status: "Completed", date: "Yesterday" },
  { name: "Arena entry", amount: "-100 ALPH", status: "Completed", date: "Sep 17" },
];

function WalletPage() {
  return <div className="space-y-6">
    <PageHeader title="ALPHENTRA Wallet" description="Manage your platform balance, rewards, competition activity, and future token utility." />
    <div className="grid gap-4 lg:grid-cols-3">
      <GlassCard className="lg:col-span-2 p-6"><div className="flex items-start justify-between"><div><p className="text-sm text-muted-foreground">ALPHENTRA Balance</p><p className="mt-2 text-4xl font-semibold tracking-tight">1,250.00 <span className="text-lg text-muted-foreground">ALPH</span></p><p className="mt-2 text-xs text-amber-400">Prototype balance · no real funds</p></div><div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10"><Coins className="h-6 w-6 text-primary" /></div></div><div className="mt-6 flex flex-wrap gap-2"><button className="rounded-lg bg-primary px-4 py-2 text-sm font-medium"><ArrowDownLeft className="mr-2 inline h-4 w-4" />Add ALPH</button><button className="rounded-lg border px-4 py-2 text-sm font-medium"><ArrowUpRight className="mr-2 inline h-4 w-4" />Send</button></div></GlassCard>
      <GlassCard className="p-6"><div className="flex items-center gap-3"><Trophy className="h-5 w-5 text-amber-400" /><h3 className="font-semibold">Competition Credits</h3></div><p className="mt-4 text-3xl font-semibold">1,150 <span className="text-sm text-muted-foreground">ALPH</span></p><p className="mt-2 text-sm text-muted-foreground">Available for ALPHENTRA Arena entries.</p></GlassCard>
    </div>
    <div className="grid gap-4 md:grid-cols-3">{walletCards.map((card) => { const Icon = card.icon; return <GlassCard key={card.title} className="p-5"><Icon className="h-5 w-5 text-cyan-400" /><h3 className="mt-4 font-semibold">{card.title}</h3><p className="mt-2 text-sm text-muted-foreground">{card.text}</p></GlassCard>; })}</div>
    <GlassCard className="p-6"><h2 className="font-semibold">Recent activity</h2><div className="mt-4 divide-y divide-border/50">{transactions.map((transaction) => <div key={transaction.name + transaction.date} className="flex items-center justify-between py-4 text-sm"><div><p className="font-medium">{transaction.name}</p><p className="text-xs text-muted-foreground">{transaction.date}</p></div><div className="text-right"><p className={transaction.amount.startsWith("+") ? "text-emerald-400" : "text-foreground"}>{transaction.amount}</p><p className="text-xs text-muted-foreground">{transaction.status}</p></div></div>)}</div></GlassCard>
    <GlassCard className="p-5"><div className="flex gap-3"><ShieldCheck className="h-5 w-5 text-cyan-400" /><p className="text-sm text-muted-foreground">Wallet, token balances, staking, competition entry, and rewards shown here are prototype product flows. Real token issuance, custody, transfers, and regulated financial functionality will be added only after the required infrastructure and regulatory review.</p></div></GlassCard>
  </div>;
}
