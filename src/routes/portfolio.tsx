import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Wallet, RefreshCw } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/common/PageHeader";
import { GlassCard } from "@/components/common/GlassCard";
import { ChartCard } from "@/components/common/ChartCard";
import { StatCard } from "@/components/common/StatCard";
import { DataTable, type Column } from "@/components/common/DataTable";
import { Delta, formatMoney } from "@/components/common/Delta";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { refreshPaperPortfolioMarks } from "@/lib/marketData";

export const Route = createFileRoute("/portfolio")({
  head: () => ({
    meta: [
      { title: "Paper Portfolio — ALPHENTRA" },
      { name: "description", content: "Your database-backed ALPHENTRA paper portfolio, positions and trade history." },
      { property: "og:title", content: "Paper Portfolio — ALPHENTRA" },
      { property: "og:description", content: "ALPHENTRA paper portfolio and trading activity." },
    ],
  }),
  component: PortfolioPage,
});

type Portfolio = {
  id: string;
  initial_cash: number | string;
  cash_balance: number | string;
  equity: number | string;
  realized_pnl: number | string;
  unrealized_pnl: number | string;
};

type DbPosition = {
  id: string;
  market_id: string;
  side: "long" | "short";
  quantity: number | string;
  average_entry_price: number | string;
  current_price: number | string | null;
  market_value: number | string;
  realized_pnl: number | string;
  unrealized_pnl: number | string;
  total_fees: number | string;
  is_open: boolean;
  market?: { symbol?: string; name?: string; asset_class?: string } | null;
};

type DbExecution = {
  id: string;
  execution_time: string;
  side: "buy" | "sell";
  quantity: number | string;
  price: number | string;
  gross_value: number | string;
  fee: number | string;
  execution_source: string;
  market?: { symbol?: string; name?: string } | null;
};

type DbSnapshot = {
  id: number;
  snapshot_time: string;
  equity: number | string;
  cash_balance: number | string;
};

const pieColors = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
];

function num(value: number | string | null | undefined) {
  return Number(value ?? 0);
}

function PortfolioPage() {
  const { user, loading: authLoading } = useAuth();
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [positions, setPositions] = useState<DbPosition[]>([]);
  const [executions, setExecutions] = useState<DbExecution[]>([]);
  const [snapshots, setSnapshots] = useState<DbSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadPortfolio = async (silent = false) => {
    if (!user) {
      setPortfolio(null);
      setPositions([]);
      setExecutions([]);
      setSnapshots([]);
      setLoading(false);
      return;
    }

    if (silent) setRefreshing(true);
    else setLoading(true);

    try {
      await refreshPaperPortfolioMarks();
    } catch (error) {
      console.error("Failed to refresh live paper marks:", error);
    }

    const { data: account, error: accountError } = await supabase
      .from("portfolios")
      .select("id, initial_cash, cash_balance, equity, realized_pnl, unrealized_pnl")
      .eq("name", "Main Paper Account")
      .eq("portfolio_type", "paper")
      .eq("is_active", true)
      .maybeSingle();

    if (accountError) {
      console.error("Failed to load paper portfolio:", accountError);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    if (!account) {
      setPortfolio(null);
      setPositions([]);
      setExecutions([]);
      setSnapshots([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    const [positionsResult, executionsResult, snapshotsResult] = await Promise.all([
      supabase
        .from("positions")
        .select("id, market_id, side, quantity, average_entry_price, current_price, market_value, realized_pnl, unrealized_pnl, total_fees, is_open, market:markets(symbol, name, asset_class)")
        .eq("portfolio_id", account.id)
        .eq("is_open", true)
        .order("market_value", { ascending: false }),
      supabase
        .from("executions")
        .select("id, execution_time, side, quantity, price, gross_value, fee, execution_source, market:markets(symbol, name)")
        .eq("portfolio_id", account.id)
        .order("execution_time", { ascending: false })
        .limit(100),
      supabase
        .from("portfolio_snapshots")
        .select("id, snapshot_time, equity, cash_balance")
        .eq("portfolio_id", account.id)
        .order("snapshot_time", { ascending: true })
        .limit(60),
    ]);

    if (positionsResult.error) console.error("Failed to load positions:", positionsResult.error);
    if (executionsResult.error) console.error("Failed to load executions:", executionsResult.error);
    if (snapshotsResult.error) console.error("Failed to load portfolio snapshots:", snapshotsResult.error);

    setPortfolio(account as Portfolio);
    setPositions((positionsResult.data ?? []) as DbPosition[]);
    setExecutions((executionsResult.data ?? []) as DbExecution[]);
    setSnapshots((snapshotsResult.data ?? []) as DbSnapshot[]);
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    if (!authLoading) void loadPortfolio();
  }, [authLoading, user]);

  const account = portfolio
    ? {
        initialCash: num(portfolio.initial_cash),
        cash: num(portfolio.cash_balance),
        equity: num(portfolio.equity),
      }
    : null;

  const totalPnl = account ? account.equity - account.initialCash : 0;
  const totalPnlPct = account && account.initialCash > 0 ? (totalPnl / account.initialCash) * 100 : 0;

  const allocation = useMemo(() => {
    const positionAllocation = positions
      .map((position) => ({ name: position.market?.symbol ?? "Unknown", value: num(position.market_value) }))
      .filter((item) => item.value > 0);

    if (!account || account.equity <= 0) return positionAllocation;

    const cash = Math.max(0, account.cash);
    return [
      ...positionAllocation,
      ...(cash > 0 ? [{ name: "Cash", value: cash }] : []),
    ].filter((item) => item.value > 0 && item.value <= account.equity + 0.01);
  }, [positions, account]);

  const allocationTotal = allocation.reduce((sum, item) => sum + item.value, 0);
  const allocationRows = allocation.map((item) => ({
    name: item.name,
    value: allocationTotal > 0 ? (item.value / allocationTotal) * 100 : 0,
  }));

  const equityCurve = snapshots.map((snapshot, index) => ({
    day: new Date(snapshot.snapshot_time).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    value: num(snapshot.equity),
    index,
  }));

  const positionRows = positions.map((position) => {
    const quantity = num(position.quantity);
    const average = num(position.average_entry_price);
    const last = num(position.current_price ?? position.average_entry_price);
    const pnl = num(position.unrealized_pnl);
    const cost = quantity * average;
    return {
      ...position,
      symbol: position.market?.symbol ?? "—",
      name: position.market?.name ?? "Unknown instrument",
      quantity,
      average,
      last,
      pnl,
      pnlPct: cost > 0 ? (pnl / cost) * 100 : 0,
      weight: account && account.equity > 0 ? (num(position.market_value) / account.equity) * 100 : 0,
    };
  });

  const positionColumns: Column<(typeof positionRows)[number]>[] = [
    {
      key: "symbol",
      header: "Position",
      cell: (p) => (
        <div>
          <p className="num text-sm font-bold text-foreground">{p.symbol}</p>
          <p className="text-xs text-muted-foreground">{p.name}</p>
        </div>
      ),
    },
    { key: "quantity", header: "Qty", align: "right", cell: (p) => <span className="num">{p.quantity.toLocaleString()}</span> },
    { key: "average", header: "Avg price", align: "right", cell: (p) => <span className="num">{p.average.toFixed(2)}</span> },
    { key: "last", header: "Last", align: "right", cell: (p) => <span className="num text-foreground">{p.last.toFixed(2)}</span> },
    { key: "pnl", header: "Unrealized P&L", align: "right", cell: (p) => <Delta value={p.pnl} suffix="" showIcon={false} /> },
    { key: "pnlPct", header: "Return", align: "right", cell: (p) => <Delta value={p.pnlPct} showIcon={false} /> },
    { key: "weight", header: "Weight", align: "right", cell: (p) => <span className="num text-muted-foreground">{p.weight.toFixed(1)}%</span> },
  ];

  const tradeRows = executions.map((execution) => ({
    ...execution,
    symbol: execution.market?.symbol ?? "—",
    time: new Date(execution.execution_time).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" }),
    quantity: num(execution.quantity),
    price: num(execution.price),
    notional: num(execution.gross_value),
  }));

  const tradeColumns: Column<(typeof tradeRows)[number]>[] = [
    { key: "time", header: "Time", cell: (t) => <span className="text-xs text-muted-foreground">{t.time}</span> },
    { key: "symbol", header: "Symbol", cell: (t) => <span className="num font-semibold text-foreground">{t.symbol}</span> },
    {
      key: "side",
      header: "Side",
      cell: (t) => <span className={cn("num text-xs font-bold uppercase", t.side === "buy" ? "text-success" : "text-danger")}>{t.side}</span>,
    },
    { key: "quantity", header: "Qty", align: "right", cell: (t) => <span className="num">{t.quantity.toLocaleString()}</span> },
    { key: "price", header: "Fill price", align: "right", cell: (t) => <span className="num">{t.price.toFixed(2)}</span> },
    { key: "notional", header: "Notional", align: "right", cell: (t) => <span className="num">{"$" + t.notional.toLocaleString("en-US", { maximumFractionDigits: 2 })}</span> },
    { key: "status", header: "Status", align: "right", cell: (t) => <span className="text-xs text-muted-foreground">{"Filled · " + t.execution_source}</span> },
  ];

  if (!user && !authLoading) {
    return (
      <AppShell wide>
        <PageHeader eyebrow="Paper Trading Account" title="Portfolio" description="Your ALPHENTRA paper account will appear here after sign in." />
        <GlassCard className="mt-6 p-8 text-center">
          <p className="text-lg font-semibold text-foreground">Sign in to view your paper portfolio</p>
          <p className="mt-2 text-sm text-muted-foreground">Your paper account and trading history are private to your ALPHENTRA account.</p>
          <Button asChild className="mt-5"><Link to="/login">Sign in</Link></Button>
        </GlassCard>
      </AppShell>
    );
  }

  return (
    <AppShell wide>
      <PageHeader
        eyebrow="Paper Trading Account"
        title="Portfolio"
        description="Live account state from ALPHENTRA's paper-trading database. Nothing here settles with a broker or exchange."
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => void loadPortfolio(true)} disabled={refreshing}>
              <RefreshCw className={cn("size-4", refreshing && "animate-spin")} /> Refresh
            </Button>
            <Button asChild><Link to="/trade"><Wallet className="size-4" /> Place a paper trade</Link></Button>
          </div>
        }
      />

      {loading ? (
        <GlassCard className="mt-6 p-8 text-center text-sm text-muted-foreground">Loading your paper account…</GlassCard>
      ) : !account ? (
        <GlassCard className="mt-6 p-8 text-center">
          <p className="font-semibold text-foreground">Paper account not found</p>
          <p className="mt-2 text-sm text-muted-foreground">Your Main Paper Account has not been provisioned yet.</p>
        </GlassCard>
      ) : (
        <>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Account value" value={formatMoney(account.equity)} hint="current equity" />
            <StatCard label="Total P&L" value={formatMoney(totalPnl)} delta={totalPnlPct} hint="since $100k funding" />
            <StatCard label="Cash" value={formatMoney(account.cash)} hint="settled virtual cash" />
            <StatCard label="Buying power" value={formatMoney(account.cash)} hint="no simulated margin yet" />
          </div>

          <div className="mt-4 grid gap-4 xl:grid-cols-[2fr_1fr]">
            <ChartCard title="Equity curve" subtitle={snapshots.length ? "Paper account value recorded after each trade" : "Your first trade will start the equity history"}>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={equityCurve.length ? equityCurve : [{ day: "Start", value: account.initialCash, index: 0 }]} margin={{ left: 4, right: 8, top: 8, bottom: 0 }}>
                    <defs>
                      <linearGradient id="pf" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--color-success)" stopOpacity={0.32} />
                        <stop offset="100%" stopColor="var(--color-success)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="var(--color-border)" vertical={false} />
                    <XAxis dataKey="day" tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} tickLine={false} axisLine={false} domain={["auto", "auto"]} tickFormatter={(v: number) => "$" + Math.round(v / 1000) + "k"} />
                    <Tooltip contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 12, fontSize: 12 }} formatter={(value: number) => [formatMoney(value), "Equity"]} />
                    <Area type="monotone" dataKey="value" stroke="var(--color-success)" strokeWidth={2} fill="url(#pf)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>

            <ChartCard title="Allocation" subtitle={allocationRows.length ? "Account exposure" : "No allocation yet"}>
              {allocationRows.length ? (
                <>
                  <div className="h-52 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={allocationRows} dataKey="value" nameKey="name" innerRadius={52} outerRadius={80} paddingAngle={3} stroke="none">
                          {allocationRows.map((entry, i) => <Cell key={entry.name} fill={pieColors[i % pieColors.length]} />)}
                        </Pie>
                        <Tooltip formatter={(value: number) => [value.toFixed(1) + "%", "Weight"]} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <ul className="mt-2 space-y-2">
                    {allocationRows.map((item, i) => (
                      <li key={item.name} className="flex items-center gap-2 text-sm">
                        <span className="size-2.5 rounded-full" style={{ background: pieColors[i % pieColors.length] }} />
                        <span className="flex-1 text-muted-foreground">{item.name}</span>
                        <span className="num font-semibold text-foreground">{item.value.toFixed(1)}%</span>
                      </li>
                    ))}
                  </ul>
                </>
              ) : <div className="flex h-52 items-center justify-center text-sm text-muted-foreground">No open positions yet.</div>}
            </ChartCard>
          </div>

          <GlassCard className="mt-4 overflow-hidden">
            <div className="border-b border-border px-5 py-4"><h3 className="text-sm font-semibold text-foreground">Open positions</h3></div>
            {positionRows.length ? <DataTable columns={positionColumns} rows={positionRows} /> : <div className="px-5 py-10 text-center text-sm text-muted-foreground">No open positions. Place your first paper trade to see it here.</div>}
          </GlassCard>

          <GlassCard className="mt-4 overflow-hidden">
            <div className="border-b border-border px-5 py-4"><h3 className="text-sm font-semibold text-foreground">Trade history</h3></div>
            {tradeRows.length ? <DataTable columns={tradeColumns} rows={tradeRows} /> : <div className="px-5 py-10 text-center text-sm text-muted-foreground">No paper executions yet.</div>}
          </GlassCard>
        </>
      )}
    </AppShell>
  );
}
