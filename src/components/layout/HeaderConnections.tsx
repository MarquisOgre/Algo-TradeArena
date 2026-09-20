import { useState } from "react";
import { BadgeCheck, ChevronDown, ExternalLink, WalletCards } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";

const wallets = [
  { name: "MetaMask", description: "Connect with MetaMask" },
  { name: "WalletConnect", description: "Scan QR or choose a supported wallet" },
  { name: "Coinbase Wallet", description: "Connect Coinbase Wallet" },
  { name: "Trust Wallet", description: "Connect Trust Wallet" },
];

export function HeaderConnections() {
  const { user } = useAuth();
  const [walletOpen, setWalletOpen] = useState(false);
  const [mt5Open, setMt5Open] = useState(false);
  const [walletConnected, setWalletConnected] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState("MetaMask");

  const [brokerName, setBrokerName] = useState("");
  const [accountName, setAccountName] = useState("");
  const [accountIdentifier, setAccountIdentifier] = useState("");
  const [serverName, setServerName] = useState("");
  const [environment, setEnvironment] = useState<"demo" | "live">("demo");
  const [mt5Saving, setMt5Saving] = useState(false);
  const [mt5Error, setMt5Error] = useState("");
  const [registeredIds, setRegisteredIds] = useState<{
    broker_account_id: string;
    mt5_account_id: string;
  } | null>(null);

  const resetMt5Status = () => {
    setMt5Error("");
    setRegisteredIds(null);
  };

  const registerMt5 = async () => {
    resetMt5Status();

    if (!user) {
      setMt5Error("Please sign in to Alphentra before connecting MT5.");
      return;
    }

    if (!brokerName.trim() || !accountName.trim() || !accountIdentifier.trim() || !serverName.trim()) {
      setMt5Error("Please complete all MT5 account fields.");
      return;
    }

    setMt5Saving(true);

    const { data, error } = await supabase.rpc("register_mt5_account", {
      p_broker_name: brokerName.trim(),
      p_account_name: accountName.trim(),
      p_account_identifier: accountIdentifier.trim(),
      p_server_name: serverName.trim(),
      p_environment: environment,
    });

    setMt5Saving(false);

    if (error) {
      setMt5Error(error.message);
      return;
    }

    const row = Array.isArray(data) ? data[0] : data;
    if (!row?.broker_account_id || !row?.mt5_account_id) {
      setMt5Error("MT5 registration completed without account identifiers.");
      return;
    }

    setRegisteredIds({
      broker_account_id: row.broker_account_id,
      mt5_account_id: row.mt5_account_id,
    });
  };

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
        onClick={() => {
          resetMt5Status();
          setMt5Open(true);
        }}
      >
        <span className="grid size-4 place-items-center rounded bg-primary/15 text-[9px] font-bold text-primary">MT5</span>
        Connect MT5
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
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Connect MetaTrader 5</DialogTitle>
            <DialogDescription>
              Register your MT5 account with Alphentra. Your MT5 password is never requested or stored here.
            </DialogDescription>
          </DialogHeader>

          {!user ? (
            <div className="rounded-xl border border-border bg-surface p-4 text-sm text-muted-foreground">
              Please sign in to Alphentra before connecting a MetaTrader 5 account.
            </div>
          ) : registeredIds ? (
            <div className="space-y-4">
              <div className="rounded-2xl border border-success/25 bg-success/5 p-5">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <BadgeCheck className="size-4 text-success" />
                  MT5 account registered
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Your Alphentra account is now ready for the MT5 bridge.
                </p>
              </div>

              <div className="space-y-2 rounded-xl border border-border bg-surface p-4 font-mono text-xs">
                <div>
                  <span className="text-muted-foreground">BROKER_ACCOUNT_ID=</span>
                  <span>{registeredIds.broker_account_id}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">MT5_ACCOUNT_ID=</span>
                  <span>{registeredIds.mt5_account_id}</span>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-surface/60 p-3 text-xs text-muted-foreground">
                Keep these IDs available for the local MT5 bridge. Do not put your MT5 password or gateway secret in this screen.
              </div>

              <Button className="w-full" onClick={() => setMt5Open(false)}>
                Done
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="mt5-broker">Broker / Company</Label>
                  <Input
                    id="mt5-broker"
                    value={brokerName}
                    onChange={(event) => setBrokerName(event.target.value)}
                    placeholder="e.g. MetaQuotes Ltd."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mt5-account-name">Account Name</Label>
                  <Input
                    id="mt5-account-name"
                    value={accountName}
                    onChange={(event) => setAccountName(event.target.value)}
                    placeholder="e.g. My MT5 Demo"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mt5-login">MT5 Login</Label>
                  <Input
                    id="mt5-login"
                    value={accountIdentifier}
                    onChange={(event) => setAccountIdentifier(event.target.value)}
                    placeholder="MT5 account login"
                    inputMode="numeric"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mt5-server">Server</Label>
                  <Input
                    id="mt5-server"
                    value={serverName}
                    onChange={(event) => setServerName(event.target.value)}
                    placeholder="e.g. MetaQuotes-Demo"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Environment</Label>
                <div className="grid grid-cols-2 gap-2">
                  {(["demo", "live"] as const).map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setEnvironment(value)}
                      className={`rounded-xl border p-3 text-left text-sm transition-colors ${
                        environment === value
                          ? "border-primary bg-primary/10 text-foreground"
                          : "border-border bg-surface text-muted-foreground hover:border-primary/40"
                      }`}
                    >
                      <span className="font-medium">{value === "demo" ? "Demo" : "Live"}</span>
                      <span className="mt-1 block text-xs text-muted-foreground">
                        {value === "demo" ? "Recommended for initial setup" : "Use only when intentionally enabling live connectivity"}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {mt5Error && (
                <div className="rounded-xl border border-destructive/25 bg-destructive/5 p-3 text-sm text-destructive">
                  {mt5Error}
                </div>
              )}

              <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-muted-foreground">
                <strong className="text-foreground">Security:</strong> Alphentra stores connection metadata only. Your MT5 password stays in the local bridge configuration and is never sent to Alphentra.
              </div>

              <Button className="w-full" onClick={() => void registerMt5()} disabled={mt5Saving}>
                {mt5Saving ? "Registering MT5..." : "Register MT5 Account"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
