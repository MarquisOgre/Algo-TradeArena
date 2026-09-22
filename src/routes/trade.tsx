import { useEffect, useMemo, useRef, useState } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Check, ChevronDown, Search, Star } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/common/PageHeader";
import { GlassCard } from "@/components/common/GlassCard";
import { ChartCard } from "@/components/common/ChartCard";
import { Delta } from "@/components/common/Delta";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import type { Market } from "@/data/types";
import { PaperTradingBadge } from "@/components/layout/TopBar";
import { cn } from "@/lib/utils";
import { getMarketCalendarLabel, getMarketSessions } from "@/lib/marketCalendar";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { isQuoteFresh, loadLiveMarketQuotes, loadMarketBoard, loadMarketHistory, requestMarketHistory, subscribeToMarketQuotes, type MarketCandle } from "@/lib/marketData";

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

function CandleChart({
  candles,
  currentPrice,
  onHover,
}: {
  candles: MarketCandle[];
  currentPrice: number;
  onHover: (candle: MarketCandle | null) => void;
}) {
  const visible = candles.slice(-90);
  const lows = visible.map((candle) => candle.low);
  const highs = visible.map((candle) => candle.high);
  const min = Math.min(...lows);
  const max = Math.max(...highs);
  const range = Math.max(max - min, Math.abs(max) * 0.00001, 0.0000001);
  const pad = range * 0.08;
  const yMin = min - pad;
  const yMax = max + pad;
  const chartLeft = 48;
  const chartRight = 970;
  const chartTop = 18;
  const chartBottom = 290;
  const chartHeight = chartBottom - chartTop;
  const step = (chartRight - chartLeft) / Math.max(visible.length, 1);
  const candleWidth = Math.max(3, Math.min(10, step * 0.62));
  const priceY = (price: number) => chartBottom - ((price - yMin) / (yMax - yMin)) * chartHeight;
  const currentY = priceY(currentPrice);
  const gridValues = [0, 0.25, 0.5, 0.75, 1].map((ratio) => yMin + (yMax - yMin) * ratio);

  return (
    <div className="relative h-[320px] w-full overflow-hidden rounded-xl bg-background/40">
      <svg
        viewBox="0 0 1000 320"
        className="h-full w-full"
        preserveAspectRatio="none"
        onMouseLeave={() => onHover(null)}
        onMouseMove={(event) => {
          const rect = event.currentTarget.getBoundingClientRect();
          const x = event.clientX - rect.left;
          const index = Math.max(0, Math.min(visible.length - 1, Math.floor((x / rect.width) * visible.length)));
          onHover(visible[index] ?? null);
        }}
      >
        {gridValues.map((value, index) => {
          const y = priceY(value);
          return (
            <g key={value}>
              <line x1={chartLeft} x2={chartRight} y1={y} y2={y} stroke="currentColor" strokeOpacity="0.08" />
              <text x="6" y={y + 4} fill="currentColor" opacity="0.45" fontSize="10">
                {value.toLocaleString("en-US", { maximumFractionDigits: 5 })}
              </text>
            </g>
          );
        })}

        <line x1={chartLeft} x2={chartRight} y1={currentY} y2={currentY} stroke="currentColor" strokeDasharray="5 5" strokeOpacity="0.35" />
        <text x={chartRight - 68} y={Math.max(12, currentY - 5)} fill="currentColor" opacity="0.75" fontSize="10">
          {currentPrice.toLocaleString("en-US", { maximumFractionDigits: 5 })}
        </text>

        {visible.map((candle, index) => {
          const x = chartLeft + step * index + step / 2;
          const openY = priceY(candle.open);
          const closeY = priceY(candle.close);
          const highY = priceY(candle.high);
          const lowY = priceY(candle.low);
          const up = candle.close >= candle.open;
          const bodyTop = Math.min(openY, closeY);
          const bodyHeight = Math.max(1.5, Math.abs(closeY - openY));

          return (
            <g
              key={candle.candle_time}
              onMouseEnter={() => onHover(candle)}
              className="cursor-crosshair"
            >
              <line x1={x} x2={x} y1={highY} y2={lowY} stroke={up ? "currentColor" : "currentColor"} strokeOpacity="0.8" />
              <rect
                x={x - candleWidth / 2}
                y={bodyTop}
                width={candleWidth}
                height={bodyHeight}
                rx="1"
                fill={up ? "currentColor" : "transparent"}
                stroke="currentColor"
                strokeWidth="1"
                opacity={up ? 0.72 : 0.9}
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function TradePage() {
  const { user } = useAuth();
  const [markets, setMarkets] = useState<Market[]>([]);
  const [symbolId, setSymbolId] = useState<string | null>(null);
  const [side, setSide] = useState<"BUY" | "SELL">("BUY");
  const [liveData, setLiveData] = useState(false);
  const [liveQuotes, setLiveQuotes] = useState<Awaited<ReturnType<typeof loadLiveMarketQuotes>>>(new Map());
  const [chartCandles, setChartCandles] = useState<MarketCandle[]>([]);
  const [chartTimeframe, setChartTimeframe] = useState<"1m" | "5m" | "15m" | "1h" | "4h" | "1d">("1m");
  const [hoveredCandle, setHoveredCandle] = useState<MarketCandle | null>(null);
  const [qty, setQty] = useState("100");
  const [cashBalance, setCashBalance] = useState<number | null>(null);
  const [paperAccountActive, setPaperAccountActive] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [marketPickerOpen, setMarketPickerOpen] = useState(false);
  const [marketSearch, setMarketSearch] = useState("");
  const [marketCategory, setMarketCategory] = useState<"All" | Market["assetClass"]>("All");
  const marketPickerRef = useRef<HTMLDivElement>(null);

  const market = markets.find((m) => m.id === symbolId) ?? markets[0] ?? null;
  const liveQuote = liveQuotes.get(market.id);
  const providerStatus = market.providerStatus ?? "unsupported";
  // Keep the Trade UI stable through short MT5 tick gaps. A quote is usable
  // for display for up to 2 minutes, while actual paper execution still
  // requires a very recent quote.
  const quoteAvailable =
    providerStatus === "live" &&
    liveQuote?.provider === "mt5" &&
    isQuoteFresh(liveQuote, 120_000);
  const executionQuoteFresh = quoteAvailable && isQuoteFresh(liveQuote, 15_000);
  const quantity = Number(qty);

  useEffect(() => {
    let active = true;
    let pollTimer: number | null = null;
    let attempts = 0;

    setHoveredCandle(null);
    setChartCandles([]);

    const loadHistory = async () => {
      try {
        const history = await loadMarketHistory(market.id, chartTimeframe, 120);
        if (!active) return;

        setChartCandles(history);

        // The MT5 bridge services candle requests asynchronously. Poll briefly
        // after requesting history so the chart fills without a page refresh.
        attempts += 1;
        if (history.length < 2 && attempts < 8) {
          pollTimer = window.setTimeout(() => {
            void loadHistory();
          }, 2000);
        }
      } catch {
        if (!active) return;
        setChartCandles([]);
        attempts += 1;
        if (attempts < 4) {
          pollTimer = window.setTimeout(() => {
            void loadHistory();
          }, 2000);
        }
      }
    };

    const requestAndLoad = async () => {
      if (market.providerStatus === "live") {
        try {
          await requestMarketHistory(market.id, chartTimeframe, 120);
        } catch {
          // Existing history can still render if the request queue is not yet
          // available in the current Supabase environment.
        }
      }
      if (active) void loadHistory();
    };

    void requestAndLoad();

    return () => {
      active = false;
      if (pollTimer !== null) window.clearTimeout(pollTimer);
    };
  }, [market.id, market.providerStatus, chartTimeframe]);
  const notional = (Number.isFinite(quantity) ? quantity : 0) * (liveQuote?.price ?? 0);
  const marketClosed = quoteAvailable && liveQuote?.isMarketOpen === false;

  const liveMarkets = useMemo(
    () =>
      markets.filter((item) => {
        const quote = liveQuotes.get(item.id);
        return (
          item.providerStatus === "live" &&
          quote?.provider === "mt5" &&
          isQuoteFresh(quote, 120_000)
        );
      }),
    [markets, liveQuotes],
  );

  const filteredMarkets = useMemo(() => {
    const query = marketSearch.trim().toLowerCase();
    return liveMarkets.filter((item) => {
      const categoryMatch = marketCategory === "All" || item.assetClass === marketCategory;
      const searchMatch =
        !query ||
        item.symbol.toLowerCase().includes(query) ||
        item.name.toLowerCase().includes(query);
      return categoryMatch && searchMatch;
    });
  }, [marketSearch, marketCategory, liveMarkets]);

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
          setLiveData([...nextQuotes.values()].some((quote) => quote.provider === "mt5" && isQuoteFresh(quote, 120_000)));
          const nextLiveMarketIds = new Set(
            nextMarkets
              .filter((item) => {
                const quote = nextQuotes.get(item.id);
                return (
                  item.providerStatus === "live" &&
                  quote?.provider === "mt5" &&
                  isQuoteFresh(quote, 120_000)
                );
              })
              .map((item) => item.id),
          );
          setSymbolId((current) =>
            nextLiveMarketIds.has(current) ? current : nextLiveMarketIds.values().next().value ?? current,
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

  useEffect(() => {
    if (!user) {
      setCashBalance(null);
      return;
    }

    let active = true;

    void supabase
      .from("portfolios")
      .select("cash_balance, account_status")
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
        const active = data?.account_status === "active";
        setPaperAccountActive(active);
        setCashBalance(active && data?.cash_balance != null ? Number(data.cash_balance) : null);
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

    if (!paperAccountActive) {
      toast.info("Activate Paper Trading first", {
        description: "Open Paper Trading and activate your virtual account before placing orders.",
      });
      return;
    }

    if (!Number.isFinite(quantity) || quantity <= 0) {
      toast.error("Enter a valid quantity", {
        description: "Quantity must be greater than zero.",
      });
      return;
    }

    // Keep the order button visually stable, but never execute a paper order
    // from an expired quote.
    if (!executionQuoteFresh || !liveQuote || liveQuote.provider !== "mt5") {
      toast.info("Waiting for a fresh MT5 quote", {
        description: "The order ticket is ready; execution will resume automatically when the latest MT5 bid/ask arrives.",
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
      p_execution_price: side === "BUY" ? liveQuote?.ask ?? 0 : liveQuote?.bid ?? 0,
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
      description: `${quantity} @ ${(side === "BUY" ? liveQuote?.ask ?? 0 : liveQuote?.bid ?? 0).toFixed(5)} · Paper account equity ${Number(result.equity ?? 0).toLocaleString("en-US", { maximumFractionDigits: 2 })}`,
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
              {liveData ? "MT5 live quotes" : "Waiting for MT5"}
            </span>
            <PaperTradingBadge />
          </div>
        }
      />

      <div className="mt-6 grid gap-4 xl:grid-cols-[1fr_380px]">
        <ChartCard
          title={`${market.symbol} · ${market.name}`}
          subtitle={quoteAvailable && liveQuote?.provider === "mt5" ? `MetaTrader 5 · ${market.providerSymbol ?? market.symbol}` : providerStatus === "no_quote" ? "MT5 instrument available · waiting for quote" : "MT5 instrument unavailable"}
          actions={
            <div className="flex items-center gap-2">
              <span className={cn(
                "rounded-full border px-2 py-1 text-[10px] font-bold uppercase tracking-wide",
                quoteAvailable && liveQuote?.provider === "mt5"
                  ? "border-success/30 bg-success/10 text-success"
                  : "border-border bg-muted text-muted-foreground",
              )}>
                {quoteAvailable && liveQuote?.provider === "mt5"
                  ? liveQuote.isMarketOpen === false
                    ? "● MT5 Closed"
                    : "● MT5 Live"
                  : "No live quote"}
              </span>
              <Delta value={market.changePct} showIcon={false} size="md" />
            </div>
          }
        >
          <div className="flex flex-wrap items-center gap-2">
            <p className="num text-3xl font-bold text-foreground">
              {quoteAvailable && liveQuote ? liveQuote.price.toLocaleString("en-US", { minimumFractionDigits: market.assetClass === "FX" ? 4 : 2 }) : "—"}
            </p>
            <span className="rounded-full bg-primary-soft px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-primary">{market.assetClass}</span>
            {liveQuote?.quoteTime && (
              <span className="text-[10px] text-muted-foreground">
                {quoteAvailable ? "Updated " : "Last quote "}{new Date(liveQuote.quoteTime).toLocaleTimeString()}
              </span>
            )}
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-b border-border/70 pb-2">
            <div className="flex items-center gap-1">
              {(["1m", "5m", "15m", "1h", "4h", "1d"] as const).map((timeframe) => (
                <button
                  key={timeframe}
                  type="button"
                  onClick={() => setChartTimeframe(timeframe)}
                  className={cn(
                    "rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-wide transition",
                    chartTimeframe === timeframe
                      ? "bg-primary/15 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  {timeframe}
                </button>
              ))}
            </div>
            {hoveredCandle && (
              <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                <span>{new Date(hoveredCandle.candle_time).toLocaleString()}</span>
                <span>O {hoveredCandle.open.toFixed(5)}</span>
                <span>H {hoveredCandle.high.toFixed(5)}</span>
                <span>L {hoveredCandle.low.toFixed(5)}</span>
                <span>C {hoveredCandle.close.toFixed(5)}</span>
              </div>
            )}
          </div>
          <div className="mt-1">
            {chartCandles.length >= 2 ? (
              <CandleChart
                candles={chartCandles}
                currentPrice={quoteAvailable && liveQuote ? liveQuote.price : 0}
                onHover={setHoveredCandle}
              />
            ) : (
              <div className="flex h-[320px] items-center justify-center text-xs text-muted-foreground">
                Waiting for {market.symbol} {chartTimeframe} candle data...
              </div>
            )}
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
                        No live MT5 markets match your search.
                      </div>
                    ) : (
                      filteredMarkets.map((item) => {
                        const quote = liveQuotes.get(item.id);
                        const live = Boolean(
                          quote?.provider === "mt5" && isQuoteFresh(quote, 120_000),
                        );
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
                                <span
                                  className={cn(
                                    "text-[9px] font-bold uppercase tracking-wide",
                                    live ? "text-success" : status === "no_quote" ? "text-warning" : "text-muted-foreground",
                                  )}
                                >
                                  Live
                                </span>
                              </div>
                              <p className="truncate text-[11px] text-muted-foreground">{item.name}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="num text-xs text-muted-foreground">
                                {live && item.price > 0
                                  ? item.price.toLocaleString("en-US", { maximumFractionDigits: item.assetClass === "FX" ? 5 : 2 })
                                  : "—"}
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

          <div className={cn(
            "mt-4 rounded-xl border p-3 text-xs",
            quoteAvailable
              ? "border-success/20 bg-success/5 text-success"
              : providerStatus === "no_quote"
                ? "border-warning/20 bg-warning/5 text-warning"
                : "border-border bg-muted/40 text-muted-foreground",
          )}>
            <div className="font-semibold">
              {quoteAvailable
                ? "MT5 LIVE"
                : providerStatus === "no_quote"
                  ? "MT5 instrument available · No current quote"
                  : "MT5 instrument unavailable for this market"}
            </div>
            <div className="mt-1 opacity-80">
              {quoteAvailable
                ? "Price, bid and ask are being received from MetaTrader 5."
                : providerStatus === "no_quote"
                  ? "Alphentra will not substitute a simulated price."
                  : "This market needs another supported data provider before it can be traded."}
            </div>
          </div>

          <dl className="mt-4 space-y-2 border-t border-border pt-4 text-sm">
            {quoteAvailable && liveQuote?.provider === "mt5" && liveQuote.bid != null && liveQuote.ask != null && (
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
              <dd className="num text-foreground">
                {quoteAvailable && liveQuote ? (side === "BUY" ? liveQuote.ask ?? liveQuote.price : liveQuote.bid ?? liveQuote.price).toFixed(market.assetClass === "FX" ? 5 : 2) : "—"}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Notional</dt>
              <dd className="num font-semibold text-foreground">
                ${notional.toLocaleString("en-US", { maximumFractionDigits: 2 })}
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

          {!quoteAvailable && (
            <div className="mt-4 rounded-xl border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
              {providerStatus === "no_quote"
                ? "Trading is paused until MT5 provides a current quote for this instrument."
                : "Trading is unavailable because this market has no supported MT5 quote."}
            </div>
          )}

          {marketClosed && (
            <div className="mt-4 rounded-xl border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
              MetaTrader 5 is currently reporting this instrument as closed.
            </div>
          )}

          {!user && (
            <div className="mt-4 rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs text-muted-foreground">
              Sign in to access Paper Trading and activate your $100,000 virtual account.
            </div>
          )}

          {!paperAccountActive && user && (
            <div className="mt-4 rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs text-muted-foreground">
              Paper Trading is not activated yet. <Link to="/portfolio" className="font-semibold text-primary hover:underline">Activate your Paper Trading Account</Link> to receive $100,000 virtual USD.
            </div>
          )}

          <Button
            className="mt-4 w-full"
            disabled={submitting || !user || !paperAccountActive}
            onClick={() => void submitOrder()}
          >
            {submitting ? "Executing…" : `${side} ${market.symbol}`}
          </Button>

          <p className="mt-3 text-center text-[11px] text-muted-foreground">
            {user
              ? "Execution is atomic: order, fill, position, cash and P&L update together."
              : "Activate Paper Trading to place a database-backed paper order."}
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
