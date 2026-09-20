import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowDownLeft, ArrowUpRight, Coins, Copy, Gift, LockKeyhole, Send, ShieldCheck, Trophy, WalletCards } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/common/PageHeader";
import { GlassCard } from "@/components/common/GlassCard";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export const Route = createFileRoute("/wallet")({
  head: () => ({
    meta: [
      { title: "ALPHENTRA Wallet — ALPHENTRA" },
      { name: "description", content: "Manage your prototype ALPH balance, rewards, strategy payments, and future token utility." },
    ],
  }),
  component: WalletPage,
});

const transactions = [
  { name: "Competition reward", amount: "+250 ALPH", date: "Today" },
  { name: "Strategy subscription", amount: "-40 ALPH", date: "Yesterday" },
  { name: "Arena entry", amount: "-100 ALPH", date: "Sep 17" },
];

function WalletPage() {
  const [buyOpen, setBuyOpen] = useState(false);
  const [comingSoon, setComingSoon] = useState<"sell" | "send" | "receive" | null>(null);

  return (
    <AppShell wide>
      <div className="space-y-6">
        <PageHeader
          eyebrow="ALPHENTRA Economy"
          title="ALPHENTRA Wallet"
          description="Your ALPH economy hub for prototype balances, rewards, strategy payments, and future token utility."
          actions={<Button asChild variant="outline"><Link to="/tournaments"><Trophy /> View Competitions</Link></Button>}
        />

        <div className="grid gap-4 lg:grid-cols-[1.5fr_0.75fr]">
          <GlassCard className="border-primary/20 p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">Prototype</Badge>
                  <Badge variant="outline">No real funds</Badge>
                </div>
                <p className="mt-5 text-sm text-muted-foreground">Available ALPH</p>
                <p className="mt-1 text-4xl font-semibold tracking-tight num">1,250.00 <span className="text-lg text-muted-foreground">ALPH</span></p>
              </div>
              <div className="grid size-12 place-items-center rounded-xl bg-primary/10 text-primary"><Coins className="size-6" /></div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <WalletAction icon={<ArrowDownLeft />} label="Buy ALPH" onClick={() => setBuyOpen(true)} primary />
              <WalletAction icon={<ArrowUpRight />} label="Sell ALPH" onClick={() => setComingSoon("sell")} />
              <WalletAction icon={<Send />} label="Send ALPH" onClick={() => setComingSoon("send")} />
              <WalletAction icon={<WalletCards />} label="Receive ALPH" onClick={() => setComingSoon("receive")} />
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <div className="flex items-center gap-3"><Trophy className="size-5 text-primary" /><h3 className="font-semibold">Competition Credits</h3></div>
            <p className="mt-4 text-3xl font-semibold num">1,150 <span className="text-sm text-muted-foreground">ALPH</span></p>
            <p className="mt-2 text-sm text-muted-foreground">Prototype allocation reserved for Arena and competition flows.</p>
          </GlassCard>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <UtilityCard icon={<Trophy />} title="Competition" text="Arena entry and eligible competition rewards are designed around ALPH." />
          <UtilityCard icon={<Gift />} title="Strategy Payments" text="Strategy subscriptions and marketplace fees are planned in ALPH." />
          <UtilityCard icon={<LockKeyhole />} title="Future Utility" text="Future staking and premium features require published mechanics and final review." />
        </div>

        <GlassCard className="p-6">
          <div className="flex items-center justify-between"><h2 className="font-semibold">Recent activity</h2><Button asChild variant="ghost" size="sm"><Link to="/copy"><Copy /> Copy Trading</Link></Button></div>
          <div className="mt-4 divide-y divide-border/50">
            {transactions.map((transaction) => (
              <div key={transaction.name + transaction.date} className="flex items-center justify-between py-4 text-sm">
                <div><p className="font-medium">{transaction.name}</p><p className="text-xs text-muted-foreground">{transaction.date}</p></div>
                <p className={transaction.amount.startsWith("+") ? "font-medium text-success" : "font-medium"}>{transaction.amount}</p>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="p-5">
          <div className="flex gap-3"><ShieldCheck className="size-5 shrink-0 text-cyan-400" /><p className="text-sm text-muted-foreground">Wallet balances and ALPH transactions shown here are prototype product flows. Real token issuance, custody, buying, selling, transfers, and regulated financial functionality require the appropriate infrastructure, providers, and regulatory review.</p></div>
        </GlassCard>
      </div>

      <Dialog open={buyOpen} onOpenChange={setBuyOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Buy ALPH</DialogTitle>
            <DialogDescription>Prototype purchase flow. No real payment or token transfer is performed.</DialogDescription>
          </DialogHeader>
          <div className="rounded-2xl border border-border bg-surface p-5">
            <div className="flex items-center justify-between text-sm"><span className="text-muted-foreground">You pay</span><span className="font-medium">₹10,000</span></div>
            <div className="mt-3 flex items-center justify-between text-sm"><span className="text-muted-foreground">Indicative ALPH</span><span className="font-medium">10,000 ALPH</span></div>
            <div className="mt-3 flex items-center justify-between text-sm"><span className="text-muted-foreground">Fees</span><span>Prototype</span></div>
          </div>
          <Button onClick={() => setBuyOpen(false)}>Continue Prototype Flow</Button>
          <p className="text-xs text-muted-foreground">A live ALPH purchase requires appropriate payment, custody, market-access, consumer-protection, and regulatory infrastructure.</p>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(comingSoon)} onOpenChange={(open) => !open && setComingSoon(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{comingSoon === "sell" ? "Sell ALPH" : comingSoon === "send" ? "Send ALPH" : "Receive ALPH"}</DialogTitle>
            <DialogDescription>This wallet capability is planned for a future production phase.</DialogDescription>
          </DialogHeader>
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-muted-foreground">
            <Badge variant="outline">Coming Soon</Badge>
            <p className="mt-3">
              {comingSoon === "sell" && "Selling ALPH will require supported market access, wallet/custody infrastructure, and the appropriate regulatory framework."}
              {comingSoon === "send" && "Sending ALPH will require secure wallet infrastructure, network selection, transaction signing, and transfer monitoring."}
              {comingSoon === "receive" && "Receiving ALPH will provide a supported wallet address and QR flow once wallet infrastructure is ready."}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

function WalletAction({ icon, label, onClick, primary = false }: { icon: React.ReactNode; label: string; onClick: () => void; primary?: boolean }) {
  return <Button variant={primary ? "default" : "outline"} className="h-auto min-h-16 flex-col gap-1 py-3" onClick={onClick}>{icon}<span className="text-xs">{label}</span></Button>;
}

function UtilityCard({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return <GlassCard className="p-5"><span className="text-primary">{icon}</span><h3 className="mt-4 font-semibold">{title}</h3><p className="mt-2 text-sm text-muted-foreground">{text}</p></GlassCard>;
}
