import { useState } from "react";
import { BadgeCheck, ChevronDown, Copy, ExternalLink, WalletCards } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

const wallets = [
  { name: "MetaMask", description: "Connect with MetaMask" },
  { name: "WalletConnect", description: "Scan QR or choose a supported wallet" },
  { name: "Coinbase Wallet", description: "Connect Coinbase Wallet" },
  { name: "Trust Wallet", description: "Connect Trust Wallet" },
];

export function HeaderConnections() {
  const [walletOpen, setWalletOpen] = useState(false);
  const [mt5Open, setMt5Open] = useState(false);
  const [walletConnected, setWalletConnected] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState("MetaMask");

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="hidden border-primary/25 bg-primary/5 sm:inline-flex"
        onClick={() => setWalletOpen(true)}
      >
        <WalletCards className="size-4" />
        {walletConnected ? "Wallet Connected" : "Connect Wallet"}
      </Button>

      <Button
        variant="outline"
        size="sm"
        className="hidden border-border bg-surface md:inline-flex"
        onClick={() => setMt5Open(true)}
      >
        <span className="grid size-4 place-items-center rounded bg-primary/15 text-[9px] font-bold text-primary">MT5</span>
        {mt5Open ? "Connect MT5" : "Connect MT5"}
      </Button>

      <Dialog open={walletOpen} onOpenChange={setWalletOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Connect Crypto Wallet</DialogTitle>
            <DialogDescription>
              Connect a supported self-custody wallet for future ALPH ecosystem functionality. Wallet connection is simulated in this prototype.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            {wallets.map((wallet) => (
              <button
                key={wallet.name}
                type="button"
                onClick={() => {
                  setSelectedWallet(wallet.name);
                  setWalletConnected(true);
                  setWalletOpen(false);
                }}
                className="flex w-full items-center gap-3 rounded-xl border border-border bg-surface p-4 text-left transition-colors hover:border-primary/40 hover:bg-surface-2"
              >
                <div className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
                  <WalletCards className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{wallet.name}</p>
                  <p className="text-xs text-muted-foreground">{wallet.description}</p>
                </div>
                <ChevronDown className="size-4 -rotate-90 text-muted-foreground" />
              </button>
            ))}
          </div>

          {walletConnected && (
            <div className="flex items-center gap-2 rounded-xl border border-success/25 bg-success/5 p-3 text-sm">
              <BadgeCheck className="size-4 text-success" />
              <span>Prototype connection ready with {selectedWallet}.</span>
            </div>
          )}

          <div className="flex items-start gap-2 rounded-xl border border-border bg-surface/60 p-3 text-xs text-muted-foreground">
            <ExternalLink className="mt-0.5 size-3.5 shrink-0" />
            <span>Wallet connection does not transfer funds or authorize transactions in the current prototype.</span>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={mt5Open} onOpenChange={setMt5Open}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Connect MetaTrader 5</DialogTitle>
            <DialogDescription>
              MT5 connectivity will support future broker-linked trading and copy trading. This prototype does not connect to a broker.
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-2xl border border-border bg-surface p-5">
            <div className="flex items-center gap-3">
              <div className="grid size-11 place-items-center rounded-xl bg-primary/10 font-bold text-primary">MT5</div>
              <div>
                <p className="font-semibold">MetaTrader 5</p>
                <p className="text-xs text-muted-foreground">Broker account connection</p>
              </div>
              <Badge variant="outline" className="ml-auto">Coming Soon</Badge>
            </div>
            <div className="mt-5 grid gap-2 text-sm text-muted-foreground">
              <p>• Broker account linking</p>
              <p>• Account and equity sync</p>
              <p>• Order execution</p>
              <p>• Live copy trading</p>
            </div>
          </div>

          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-muted-foreground">
            Paper trading remains the only active trading environment.
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
