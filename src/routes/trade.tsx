import { useEffect, useState } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/common/PageHeader";
import { GlassCard } from "@/components/common/GlassCard";
import { ChartCard } from "@/components/common/ChartCard";
import { Sparkline } from "@/components/common/Sparkline";
import { Delta } from "@/components/common/Delta";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { mockMarkets } from "@/data/mockMarkets";
import { PaperTradingBadge } from "@/components/layout/TopBar";
import { cn } from "@/lib/utils";
import { getMarketCalendarLabel, getMarketSessions } from "@/lib/marketCalendar";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { loadMarketBoard } from "@/lib/marketData";

export const Route = createFileRoute("/trade")({
  head: () => ({
    meta: [
      { title: "Paper Trade — ALPHENTRA" },
      {
        name: "description",
        content: "Place database-backed paper trades inside your ALPHENTRA paper account.",
      },
      { property: "og:title", content: "Paper Trade — ALPHENTRA" },
      { property: "og:description", content: "Place paper trades in ALPHENTRA." },
    ],
  }),
  component: TradePage,
});

function TradePage() {
  const { user } = useAuth();
  const [markets, setMarkets] = useState(mockMarkets);
  const [symbolId, setSymbolId] = useState(mockMarkets[0]!.id);
  const [side, setSide] = useState<"BUY" | "SELL">("BUY");
  const [liveData, setLiveData] = useState(false);
  const [qty, setQty] = useState("100");
  const [cashBalance, setCashBalance] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const market = markets.find((m) => m.id === symbolId) ?? markets[0]!;
  const quantity = Number(qty);
  const notional = (Number.isFinite(quantity) ? quantity : 0) * market.price;
  const forexOpen = getMarketSessions().find((session) => session.group === "forex")?.open ?? true;
  const marketClosed = market.assetClass === "FX" && !forexOpen;

  useEffect(() => {
    let active = true;

    void loadMarketBoard()
      .then((nextMarkets) => {
        if (!active) return;
        setMarkets(nextMarkets);
        setLiveData(nextMarkets.some((item, index) => item.price !== mockMarkets[index]?.price));
      })
      .catch((error) => {
        console.error("Failed to load market data:", error);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!user) {
      setCashBalance(null);
      return;
    }

    let active = true;

    void supabase
      .from("portfolios")
      .select("cash_balance")
      .eq("name", "Main Paper Account")
      .eq("portfolio_type", "paper")
      .eq("is_active", true)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!active) return;
        if (error) {
          console.error("Failed to load paper buying power:", error);
          return;
        }
        setCashBalance(data?.cash_balance == null ? null : Number(data.cash_balance));
      });

    return () => {
      active = false;
    };
  }, [user]);

  const submitOrder = async () => {
    if (!user) {
      toast.error("Sign in required", {
        description: "Sign in to place a paper order.",
      });
      return;
    }

    if (!Number.isFinite(quantity) || quantity <= 0) {
      toast.error("Enter a valid quantity", {
        description: "Quantity must be greater than zero.",
      });
      return;
    }

    if (side === "BUY" && cashBalance !== null && notional > cashBalance) {
      toast.error("Insufficient paper buying power", {
        description: `Available $${cashBalance.toLocaleString("en-US", { maximumFractionDigits: 2 })} · Required $${notional.toLocaleString("en-US", { maximumFractionDigits: 2 })}`,
      });
      return;
    }

    setSubmitting(true);

    const { data, error } = await supabase.rpc("execute_paper_market_order", {
      p_market_symbol: market.symbol,
      p_side: side.toLowerCase(),
      p_quantity: quantity,
      p_execution_price: market.price,
      p_client_order_id: crypto.randomUUID(),
    });

    setSubmitting(false);

    if (error) {
      console.error("Paper order failed:", error);
      toast.error("Order rejected", {
        description: error.message,
      });
      return;
    }

    const result = (data ?? {}) as {
      status?: string;
      quantity?: number;
      price?: number;
      cash_balance?: number;
      equity?: number;
      realized_pnl?: number;
    };

    setCashBalance(result.cash_balance == null ? cashBalance : Number(result.cash_balance));

    toast.success(`${side} ${market.symbol} filled`, {
      description: `${quantity} @ ${market.price.toFixed(2)} · Paper account equity $${Number(result.equity ?? 0).toLocaleString("en-US", { maximumFractionDigits: 2 })}`,
    });
  };

  return (
    <AppShell>
      <PageHeader
        eyebrow="Order ticket"
        title="Paper trade"
        description="Orders are now persisted to your ALPHENTRA paper account. Fills remain simulated and never route to a broker or exchange."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <span className="hidden text-xs text-muted-foreground sm:inline">{getMarketCalendarLabel()}</span>
            <span className="rounded-full border border-border px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              {liveData ? "Live quotes" : "Simulated fallback"}
            </span>
            <PaperTradingBadge />
          </div>
        }
      />

      <div className="mt-6 grid gap-4 xl:grid-cols-[1fr_380px]">
        <ChartCard
          title={`${market.symbol} · ${market.name}`}
          subtitle="Simulated last 30 sessions"
          actions={<Delta value={market.changePct} showIcon={false} size="md" />}
        >
          <div className="flex flex-wrap items-center gap-2">
            <p className="num text-3xl font-bold text-foreground">
              {market.price.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </p>
            <span className="rounded-full bg-primary-soft px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-primary">{market.assetClass}</span>
          </div>
          <div className="mt-2">
            <Sparkline data={market.spark} height={180} />
          </div>
        </ChartCard>

        <GlassCard className="h-fit p-5">
          <div className="grid grid-cols-2 gap-2">
            {(["BUY", "SELL"] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSide(s)}
                className={cn(
                  "rounded-xl border py-2.5 text-sm font-bold transition-colors",
                  side === s
                    ? s === "BUY"
                      ? "border-success/50 bg-success/12 text-success"
                      : "border-danger/50 bg-danger/12 text-danger"
                    : "border-border text-muted-foreground hover:text-foreground",
                )}
              >
                {s}
              </button>
            ))}
          </div>

          <div className="mt-4 space-y-2">
            <Label htmlFor="symbol">Instrument</Label>
            <select
              id="symbol"
              value={symbolId}
              onChange={(e) => setSymbolId(e.target.value)}
              className="h-10 w-full rounded-xl border border-border bg-surface px-3 text-sm text-foreground focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-ring/25"
            >
              {markets.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.symbol} — {m.name}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-4 space-y-2">
            <Label htmlFor="qty">Quantity</Label>
            <Input
              id="qty"
              inputMode="decimal"
              min="0"
              step="any"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
            />
          </div>

          <dl className="mt-4 space-y-2 border-t border-border pt-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Est. price</dt>
              <dd className="num text-foreground">{market.price.toFixed(2)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Notional</dt>
              <dd className="num font-semibold text-foreground">
                $${notional.toLocaleString("en-US", { maximumFractionDigits: 2 })}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Commission</dt>
              <dd className="num text-foreground">$0.00</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Paper cash</dt>
              <dd className="num text-foreground">
                {cashBalance == null ? "—" : `$${cashBalance.toLocaleString("en-US", { maximumFractionDigits: 2 })}`}
              </dd>
            </div>
          </dl>

          {marketClosed && (
            <div className="mt-4 rounded-xl border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
              Forex is closed on weekends in the prototype market calendar.
            </div>
          )}

          {!user && (
            <div className="mt-4 rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs text-muted-foreground">
              Sign in to access your $100,000 paper account and place orders.
            </div>
          )}

          <Button
            className="mt-4 w-full"
            disabled={marketClosed || submitting || !user}
            onClick={() => void submitOrder()}
          >
            {submitting ? "Executing…" : `${side} ${market.symbol}`}
          </Button>

          <p className="mt-3 text-center text-[11px] text-muted-foreground">
            {user
              ? "Execution is atomic: order, fill, position, cash and P&L update together."
              : "Sign in to place a database-backed paper order."}
          </p>

          {user && (
            <Button asChild variant="outline" className="mt-2 w-full">
              <Link to="/portfolio">View portfolio & trade history</Link>
            </Button>
          )}
        </GlassCard>
      </div>
    </AppShell>
  );
}
