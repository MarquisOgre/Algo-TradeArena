import { useEffect, useMemo, useRef, useState } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Check, ChevronDown, RefreshCw, Search, Star } from "lucide-react";
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
import type { Market } from "@/data/types";
import { PaperTradingBadge } from "@/components/layout/TopBar";
import { cn } from "@/lib/utils";
import { getMarketCalendarLabel, getMarketSessions } from "@/lib/marketCalendar";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { isQuoteFresh, loadLiveMarketQuotes, loadMarketBoard, subscribeToMarketQuotes } from "@/lib/marketData";

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
  const [liveQuotes, setLiveQuotes] = useState<Awaited<ReturnType<typeof loadLiveMarketQuotes>>>(new Map());
  const [qty, setQty] = useState("100");
  const [cashBalance, setCashBalance] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [marketPickerOpen, setMarketPickerOpen] = useState(false);
  const [marketSearch, setMarketSearch] = useState("");
  const [marketCategory, setMarketCategory] = useState<"All" | Market["assetClass"]>("All");
  const marketPickerRef = useRef<HTMLDivElement>(null);
  const [mt5Account, setMt5Account] = useState<{
    brokerName: string;
    server: string;
    environment: string;
    status: string;
    balance: number;
    equity: number;
    margin: number;
    freeMargin: number;
    currency: string;
    lastSync: string | null;
  } | null>(null);
  const [mt5Positions, setMt5Positions] = useState<Array<{
    symbol: string;
    side: string;
    volume: number;
    open_price: number;
    current_price: number | null;
    profit: number;
    stop_loss: number | null;
    take_profit: number | null;
    mt5_ticket: number;
  }>>([]);
  const [mt5AccountLoading, setMt5AccountLoading] = useState(false);

  const market = markets.find((m) => m.id === symbolId) ?? markets[0]!;
  const liveQuote = liveQuotes.get(market.id);
  const quoteIsFresh = isQuoteFresh(liveQuote, 15_000);
  const quantity = Number(qty);
  const notional = (Number.isFinite(quantity) ? quantity : 0) * market.price;
  const forexOpen = getMarketSessions().find((session) => session.group === "forex")?.open ?? true;
  const marketClosed = market.assetClass === "FX" && !forexOpen;

  const filteredMarkets = useMemo(() => {
    const query = marketSearch.trim().toLowerCase();
    return markets.filter((item) => {
      const categoryMatch = marketCategory === "All" || item.assetClass === marketCategory;
      const searchMatch =
        !query ||
        item.symbol.toLowerCase().includes(query) ||
        item.name.toLowerCase().includes(query);
      return categoryMatch && searchMatch;
    });
  }, [marketSearch, marketCategory, markets]);

  useEffect(() => {
    if (!marketPickerOpen) return;
    const handlePointerDown = (event: MouseEvent) => {
      if (!marketPickerRef.current?.contains(event.target as Node)) {
        setMarketPickerOpen(false);
      }
    };
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [marketPickerOpen]);

  useEffect(() => {
    let active = true;

    const refresh = () => {
      void Promise.all([loadMarketBoard(), loadLiveMarketQuotes()])
        .then(([nextMarkets, nextQuotes]) => {
          if (!active) return;
          setMarkets(nextMarkets);
          setLiveQuotes(nextQuotes);
          setLiveData([...nextQuotes.values()].some((quote) => quote.provider === "mt5" && isQuoteFresh(quote, 15_000)));
          setSymbolId((current) =>
            nextMarkets.some((item) => item.id === current) ? current : nextMarkets[0]?.id ?? current,
          );
        })
        .catch((error) => {
          console.error("Failed to load market data:", error);
        });
    };

    refresh();
    const unsubscribe = subscribeToMarketQuotes(refresh);

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const refreshMt5Account = async () => {
    if (!user) {
      setMt5Account(null);
      setMt5Positions([]);
      return;
    }

    setMt5AccountLoading(true);
    try {
      const { data: broker, error: brokerError } = await supabase
        .from("broker_accounts")
        .select("id, broker_name, environment, status")
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (brokerError) throw brokerError;
      if (!broker) {
        setMt5Account(null);
        setMt5Positions([]);
        return;
      }

      const { data: account, error: accountError } = await supabase
        .from("mt5_accounts")
        .select("id, server_name, balance, equity, margin, free_margin, currency, last_account_sync_at")
        .eq("broker_account_id", broker.id)
        .maybeSingle();

      if (accountError) throw accountError;
      if (!account) {
        setMt5Account(null);
        setMt5Positions([]);
        return;
      }

      setMt5Account({
        brokerName: broker.broker_name,
        server: account.server_name ?? "—",
        environment: broker.environment,
        status: broker.status,
        balance: Number(account.balance ?? 0),
        equity: Number(account.equity ?? 0),
        margin: Number(account.margin ?? 0),
        freeMargin: Number(account.free_margin ?? 0),
        currency: account.currency ?? "USD",
        lastSync: account.last_account_sync_at,
      });

      const { data: positions, error: positionsError } = await supabase
        .from("mt5_positions")
        .select("symbol, side, volume, open_price, current_price, profit, stop_loss, take_profit, mt5_ticket")
        .eq("mt5_account_id", account.id)
        .eq("is_open", true)
        .order("opened_at", { ascending: false });

      if (positionsError) throw positionsError;
      setMt5Positions((positions ?? []).map((position) => ({
        symbol: position.symbol,
        side: position.side,
        volume: Number(position.volume ?? 0),
        open_price: Number(position.open_price ?? 0),
        current_price: position.current_price == null ? null : Number(position.current_price),
        profit: Number(position.profit ?? 0),
        stop_loss: position.stop_loss == null ? null : Number(position.stop_loss),
        take_profit: position.take_profit == null ? null : Number(position.take_profit),
        mt5_ticket: Number(position.mt5_ticket),
      })));
    } catch (error) {
      console.error("Failed to load MT5 account:", error);
    } finally {
      setMt5AccountLoading(false);
    }
  };

  useEffect(() => {
    void refreshMt5Account();
    const timer = window.setInterval(() => void refreshMt5Account(), 5000);
    return () => window.clearInterval(timer);
  }, [user]);

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

      {mt5Account && (
        <GlassCard className="mb-4 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-success" />
                <span className="text-sm font-bold text-foreground">MT5 Account</span>
                <span className="rounded-full border border-border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-muted-foreground">
                  {mt5Account.environment}
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{mt5Account.brokerName} · {mt5Account.server}</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => void refreshMt5Account()} disabled={mt5AccountLoading}>
              <RefreshCw className={cn("mr-2 size-3.5", mt5AccountLoading && "animate-spin")} />
              Refresh
            </Button>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-4">
            {[
              ["Balance", mt5Account.balance],
              ["Equity", mt5Account.equity],
              ["Margin", mt5Account.margin],
              ["Free Margin", mt5Account.freeMargin],
            ].map(([label, value]) => (
              <div key={String(label)} className="rounded-xl bg-muted/40 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
                <p className="num mt-1 font-semibold text-foreground">{mt5Account.currency} {Number(value).toLocaleString("en-US", { maximumFractionDigits: 2 })}</p>
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>{mt5Account.status === "connected" ? "● Connected" : "● Registered"}</span>
            <span>{mt5Account.lastSync ? "Last sync " + new Date(mt5Account.lastSync).toLocaleTimeString() : "Waiting for sync"}</span>
          </div>
        </GlassCard>
      )}

      <div className="mb-4">
        <GlassCard className="p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-foreground">MT5 Open Positions</h2>
              <p className="mt-1 text-xs text-muted-foreground">Read-only view of positions synchronized from MetaTrader 5.</p>
            </div>
            <span className="rounded-full border border-border px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
              {mt5Positions.length} {mt5Positions.length === 1 ? "position" : "positions"}
            </span>
          </div>
          {mt5Positions.length === 0 ? (
            <div className="mt-4 rounded-xl border border-dashed border-border p-5 text-center text-xs text-muted-foreground">
              No open MT5 positions.
            </div>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-xs">
                <thead className="border-b border-border text-[10px] uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="pb-2">Symbol</th><th className="pb-2">Side</th><th className="pb-2">Volume</th><th className="pb-2">Open</th><th className="pb-2">Current</th><th className="pb-2">SL / TP</th><th className="pb-2 text-right">P&L</th>
                  </tr>
                </thead>
                <tbody>
                  {mt5Positions.map((position) => (
                    <tr key={position.mt5_ticket} className="border-b border-border/60 last:border-0">
                      <td className="py-3 font-semibold text-foreground">{position.symbol}</td>
                      <td className={cn("py-3 font-semibold uppercase", position.side === "long" ? "text-success" : "text-danger")}>{position.side}</td>
                      <td className="num py-3 text-muted-foreground">{position.volume}</td>
                      <td className="num py-3 text-muted-foreground">{position.open_price.toLocaleString("en-US", { maximumFractionDigits: 8 })}</td>
                      <td className="num py-3 text-muted-foreground">{position.current_price == null ? "—" : position.current_price.toLocaleString("en-US", { maximumFractionDigits: 8 })}</td>
                      <td className="num py-3 text-muted-foreground">{position.stop_loss ?? "—"} / {position.take_profit ?? "—"}</td>
                      <td className={cn("num py-3 text-right font-semibold", position.profit >= 0 ? "text-success" : "text-danger")}>{position.profit >= 0 ? "+" : ""}{position.profit.toLocaleString("en-US", { maximumFractionDigits: 2 })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </GlassCard>
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-[1fr_380px]">
        <ChartCard
          title={`${market.symbol} · ${market.name}`}
          subtitle={quoteIsFresh && liveQuote?.provider === "mt5" ? "MetaTrader 5 live quote" : "Simulated last 30 sessions"}
          actions={
            <div className="flex items-center gap-2">
              <span className={cn(
                "rounded-full border px-2 py-1 text-[10px] font-bold uppercase tracking-wide",
                quoteIsFresh && liveQuote?.provider === "mt5"
                  ? "border-success/30 bg-success/10 text-success"
                  : "border-border bg-muted text-muted-foreground",
              )}>
                {quoteIsFresh && liveQuote?.provider === "mt5" ? "● MT5 Live" : "No live quote"}
              </span>
              <Delta value={market.changePct} showIcon={false} size="md" />
            </div>
          }
        >
          <div className="flex flex-wrap items-center gap-2">
            <p className="num text-3xl font-bold text-foreground">
              {market.price.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </p>
            <span className="rounded-full bg-primary-soft px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-primary">{market.assetClass}</span>
            {liveQuote?.quoteTime && (
              <span className="text-[10px] text-muted-foreground">
                {quoteIsFresh ? "Updated " : "Last quote "}{new Date(liveQuote.quoteTime).toLocaleTimeString()}
              </span>
            )}
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
            <div ref={marketPickerRef} className="relative">
              <button
                type="button"
                aria-expanded={marketPickerOpen}
                onClick={() => setMarketPickerOpen((open) => !open)}
                className="flex h-11 w-full items-center justify-between rounded-xl border border-border bg-surface px-3 text-left text-sm text-foreground transition hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-ring/25"
              >
                <span className="min-w-0">
                  <span className="block truncate font-semibold">{market.symbol}</span>
                  <span className="block truncate text-[11px] text-muted-foreground">{market.name}</span>
                </span>
                <ChevronDown className={cn("ml-2 size-4 shrink-0 text-muted-foreground transition-transform", marketPickerOpen && "rotate-180")} />
              </button>

              {marketPickerOpen && (
                <div className="absolute inset-x-0 top-[calc(100%+8px)] z-50 overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl">
                  <div className="border-b border-border p-3">
                    <div className="relative">
                      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        autoFocus
                        value={marketSearch}
                        onChange={(event) => setMarketSearch(event.target.value)}
                        placeholder="Search symbol or market..."
                        className="h-10 pl-9"
                      />
                    </div>
                    <div className="mt-2 flex gap-1.5 overflow-x-auto pb-1">
                      {(["All", "FX", "Crypto", "Equity", "ETF", "Metals"] as const).map((category) => (
                        <button
                          key={category}
                          type="button"
                          onClick={() => setMarketCategory(category === "All" ? "All" : category)}
                          className={cn(
                            "shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide",
                            marketCategory === category
                              ? "border-primary/40 bg-primary/10 text-primary"
                              : "border-border text-muted-foreground hover:text-foreground",
                          )}
                        >
                          {category}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="max-h-72 overflow-y-auto p-2">
                    {filteredMarkets.length === 0 ? (
                      <div className="px-3 py-8 text-center text-xs text-muted-foreground">
                        No markets match your search.
                      </div>
                    ) : (
                      filteredMarkets.map((item) => {
                        const quote = liveQuotes.get(item.id);
                        const live = quote?.provider === "mt5" && isQuoteFresh(quote, 15_000);
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => {
                              setSymbolId(item.id);
                              setMarketPickerOpen(false);
                              setMarketSearch("");
                            }}
                            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-muted/60"
                          >
                            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                              {live ? <span className="size-1.5 rounded-full bg-success" /> : <Star className="size-3.5 opacity-40" />}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="num font-semibold text-foreground">{item.symbol}</span>
                                {live && <span className="text-[9px] font-bold uppercase tracking-wide text-success">Live</span>}
                              </div>
                              <p className="truncate text-[11px] text-muted-foreground">{item.name}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="num text-xs text-muted-foreground">
                                {item.price > 0 ? item.price.toLocaleString("en-US", { maximumFractionDigits: item.assetClass === "FX" ? 5 : 2 }) : "—"}
                              </span>
                              {item.id === symbolId && <Check className="size-4 text-primary" />}
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
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
            {quoteIsFresh && liveQuote?.provider === "mt5" && liveQuote.bid != null && liveQuote.ask != null && (
              <>
                <div className="grid grid-cols-2 gap-2 rounded-xl bg-muted/40 p-2">
                  <div>
                    <dt className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Bid</dt>
                    <dd className="num mt-1 font-semibold text-foreground">{liveQuote.bid.toLocaleString("en-US", { minimumFractionDigits: 4, maximumFractionDigits: 8 })}</dd>
                  </div>
                  <div className="text-right">
                    <dt className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Ask</dt>
                    <dd className="num mt-1 font-semibold text-foreground">{liveQuote.ask.toLocaleString("en-US", { minimumFractionDigits: 4, maximumFractionDigits: 8 })}</dd>
                  </div>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Spread</dt>
                  <dd className="num text-foreground">{liveQuote.spread == null ? "—" : liveQuote.spread.toLocaleString("en-US", { maximumFractionDigits: 8 })}</dd>
                </div>
              </>
            )}
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
