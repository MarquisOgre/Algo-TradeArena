import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, CheckCircle2, ChevronRight, ShieldCheck, WalletCards } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/common/GlassCard";

export const Route = createFileRoute("/connect-wallet")({
  head: () => ({
    meta: [
      { title: "Connect Wallet — ALPHENTRA" },
      {
        name: "description",
        content: "Connect a supported wallet to access future on-chain Alphentra features.",
      },
    ],
  }),
  component: ConnectWalletPage,
});

const wallets = [
  {
    name: "MetaMask",
    description: "Connect with the MetaMask browser wallet.",
    status: "Planned",
  },
  {
    name: "WalletConnect",
    description: "Connect using a compatible mobile or desktop wallet.",
    status: "Planned",
  },
  {
    name: "Coinbase Wallet",
    description: "Connect with Coinbase Wallet.",
    status: "Planned",
  },
  {
    name: "Binance Web3 Wallet",
    description: "Connect with Binance Web3 Wallet.",
    status: "Planned",
  },
];

function ConnectWalletPage() {
  return (
    <AppShell wide>
      <div className="mx-auto max-w-4xl space-y-6">
        <Button asChild variant="ghost" className="-ml-3">
          <Link to="/"><ArrowLeft /> Back to Alphentra</Link>
        </Button>

        <GlassCard className="overflow-hidden border-primary/20 p-6 sm:p-8">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary">
              <WalletCards className="size-7" />
            </div>
            <p className="mt-5 text-sm font-medium uppercase tracking-[0.2em] text-primary">
              Wallet Connection
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
              Connect your wallet
            </h1>
            <p className="mt-3 text-muted-foreground">
              Choose a wallet provider to prepare for Alphentra's future on-chain
              features. This is currently a prototype flow and does not request
              signatures, funds, or wallet credentials.
            </p>
          </div>

          <div className="mx-auto mt-8 grid max-w-2xl gap-3">
            {wallets.map((wallet) => (
              <div
                key={wallet.name}
                className="flex items-center gap-4 rounded-2xl border border-border bg-surface/50 p-4"
              >
                <div className="grid size-11 shrink-0 place-items-center rounded-xl border border-border bg-background text-primary">
                  <WalletCards className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-semibold">{wallet.name}</h2>
                    <span className="rounded-full border border-border px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                      {wallet.status}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{wallet.description}</p>
                </div>
                <Button variant="outline" disabled>
                  Connect
                  <ChevronRight />
                </Button>
              </div>
            ))}
          </div>

          <div className="mx-auto mt-8 flex max-w-2xl gap-3 rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-4">
            <ShieldCheck className="mt-0.5 size-5 shrink-0 text-cyan-400" />
            <div className="text-sm text-muted-foreground">
              <p className="font-medium text-foreground">Prototype safety</p>
              <p className="mt-1">
                No wallet provider is connected yet. Never enter a seed phrase or
                private key into Alphentra.
              </p>
            </div>
          </div>

          <div className="mx-auto mt-6 flex max-w-2xl flex-col gap-3 sm:flex-row sm:justify-center">
            <Button asChild variant="outline">
              <Link to="/login">Sign In</Link>
            </Button>
            <Button asChild>
              <Link to="/app">
                Continue to Platform
                <ChevronRight />
              </Link>
            </Button>
          </div>
        </GlassCard>
      </div>
    </AppShell>
  );
}
