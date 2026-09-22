import { createFileRoute, Link } from "@tanstack/react-router";
import { Radio, ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/common/PageHeader";
import { GlassCard } from "@/components/common/GlassCard";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/live")({
  head: () => ({
    meta: [
      { title: "Live Trading — ALPHENTRA" },
      {
        name: "description",
        content: "ALPHENTRA live trading is kept completely separate from Paper Trading and uses a connected MT5 account.",
      },
    ],
  }),
  component: LiveTradingPage,
});

function LiveTradingPage() {
  return (
    <AppShell wide>
      <PageHeader
        eyebrow="Live Trading"
        title="Live Trading Account"
        description="A completely separate trading environment for connected MetaTrader 5 accounts. Paper funds, paper positions and paper P&L never appear here."
      />

      <GlassCard className="mt-6 overflow-hidden">
        <div className="grid gap-6 p-6 md:grid-cols-[auto_1fr] md:items-center md:p-8">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Radio className="size-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-foreground">Connect a Live MT5 Account</h2>
              <span className="rounded-full border border-border px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Live</span>
            </div>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Live Trading will use your connected broker/MetaTrader 5 account. It does not receive the $100,000 Paper Trading allocation and it does not share the Paper Trading wallet, positions, orders or P&L.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Button variant="outline" asChild><Link to="/profile">MT5 connection settings</Link></Button>
              <Button asChild><Link to="/portfolio">Go to Paper Trading</Link></Button>
            </div>
          </div>
        </div>

        <div className="grid gap-3 border-t border-border bg-muted/20 p-5 md:grid-cols-3">
          {[
            ["Account", "Broker / MT5"],
            ["Capital", "Broker funded"],
            ["Execution", "Live broker"],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl border border-border bg-background/50 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
              <p className="mt-1 text-sm font-bold text-foreground">{value}</p>
            </div>
          ))}
        </div>
      </GlassCard>

      <div className="mt-4 flex items-start gap-3 rounded-xl border border-border bg-muted/30 p-4 text-xs text-muted-foreground">
        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
        <p>ALPHENTRA keeps Paper Trading and Live Trading as separate account domains. A future live-order workflow will require an explicit MT5 connection and broker authorization.</p>
      </div>
    </AppShell>
  );
}
