import { useState } from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, BarChart3, Bot, CheckCircle2, Clock3, Copy, ExternalLink, FlaskConical, LockKeyhole, ShieldCheck, Trophy, Users } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/common/PageHeader";
import { GlassCard } from "@/components/common/GlassCard";
import { StatCard } from "@/components/common/StatCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getStrategy } from "@/data/strategies";
import type { Strategy } from "@/data/types";

export const Route = createFileRoute("/strategies/$id")({
  loader: ({ params }) => {
    const strategy = getStrategy(params.id);
    if (!strategy) throw notFound();
    return { strategy };
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.strategy.name} — ALPHENTRA` },
          { name: "description", content: loaderData.strategy.description },
          { property: "og:title", content: `${loaderData.strategy.name} — ALPHENTRA` },
          { property: "og:description", content: loaderData.strategy.description },
        ]
      : [{ title: "Strategy not found — ALPHENTRA" }, { name: "robots", content: "noindex" }],
  }),
  component: StrategyDetail,
});

function StrategyDetail() {
  const { strategy } = Route.useLoaderData();
  const [following, setFollowing] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [copied, setCopied] = useState(false);

  const activeVersion = strategy.versions.find((version) => version.id === strategy.activeVersionId) ?? strategy.versions[0];
  const backtest = strategy.backtest;
  const canEnterArena = strategy.status === "Published" || strategy.status === "Forward Testing";

  function selectForArena() {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("alphentra.arena.selectedStrategyId", strategy.id);
    }
  }

  async function copyStrategyId() {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(strategy.id);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    }
  }

  return (
    <AppShell wide>
      <Button asChild variant="ghost" size="sm" className="-ml-2 mb-3">
        <Link to="/strategies"><ArrowLeft className="size-4" /> Strategy Marketplace</Link>
      </Button>

      <PageHeader
        eyebrow={`${strategy.style} · ${strategy.status}`}
        title={strategy.name}
        description={strategy.description}
        actions={
          <>
            <Button variant="outline" onClick={() => setFollowing((value) => !value)}>
              <Users /> {following ? "Following" : "Follow"}
            </Button>
            <Button onClick={() => setSubscribed((value) => !value)}>
              <Copy /> {subscribed ? "Subscribed" : "Subscribe"}
            </Button>
            {canEnterArena && (
              <Button asChild onClick={selectForArena}>
                <Link to="/battle"><Trophy /> Enter Arena</Link>
              </Button>
            )}
          </>
        }
      />

      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Backtest return" value={backtest ? `+${backtest.returnPct.toFixed(1)}%` : "—"} hint="simulated" />
        <StatCard label="Max drawdown" value={backtest ? `${backtest.maxDrawdownPct.toFixed(1)}%` : "—"} hint="simulated" />
        <StatCard label="Win rate" value={backtest ? `${backtest.winRatePct.toFixed(1)}%` : "—"} hint={backtest ? `${backtest.trades} trades` : undefined} />
        <StatCard label="Sharpe" value={backtest ? backtest.sharpe.toFixed(2) : "—"} hint="simulated" />
        <StatCard label="Followers" value={strategy.followers.toLocaleString()} hint={following ? "Following" : "Community"} />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.5fr_1fr]">
        <GlassCard className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Overview</p>
              <h2 className="mt-1 text-lg font-semibold">Strategy specification</h2>
            </div>
            <Badge variant="outline">{strategy.style}</Badge>
          </div>
          <p className="mt-4 rounded-xl border border-border bg-surface-2/60 p-4 text-sm leading-6 text-foreground">
            {activeVersion?.specification ?? strategy.description}
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <Info label="Active version" value={`v${activeVersion?.version ?? 1}`} />
            <Info label="Risk limit" value={`${activeVersion?.riskLimit ?? 1}% per trade`} />
            <Info label="Created" value={formatDate(strategy.createdAt)} />
          </div>
        </GlassCard>

        <GlassCard className="p-5">
          <div className="flex items-center gap-2">
            <Bot className="size-4 text-primary" />
            <h2 className="text-sm font-semibold">Strategy lifecycle</h2>
          </div>
          <div className="mt-4 space-y-3">
            {[
              ["Build", "Strategy definition created", true],
              ["Backtest", backtest ? "Backtest metrics available" : "Not run yet", Boolean(backtest)],
              ["Stress Test", "Risk scenarios can be evaluated in Strategy Lab", strategy.status === "Stress Testing" || strategy.status === "Forward Testing" || strategy.status === "Published"],
              ["Forward Test", "Paper observation phase", strategy.status === "Forward Testing" || strategy.status === "Published"],
              ["Publish", "Available for discovery and Arena", strategy.status === "Published"],
            ].map(([label, note, complete]) => (
              <div key={String(label)} className="flex items-start gap-3">
                {complete ? <CheckCircle2 className="mt-0.5 size-4 text-success" /> : <Clock3 className="mt-0.5 size-4 text-muted-foreground" />}
                <div>
                  <p className="text-sm font-medium">{label}</p>
                  <p className="text-xs text-muted-foreground">{note}</p>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <GlassCard className="p-5">
          <SectionTitle icon={<BarChart3 className="size-4" />} title="Performance" />
          {backtest ? (
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Metric label="Return" value={`+${backtest.returnPct.toFixed(1)}%`} />
              <Metric label="Drawdown" value={`${backtest.maxDrawdownPct.toFixed(1)}%`} />
              <Metric label="Win rate" value={`${backtest.winRatePct.toFixed(1)}%`} />
              <Metric label="Trades" value={backtest.trades.toLocaleString()} />
            </div>
          ) : (
            <EmptyState text="Run a backtest in Strategy Lab to populate performance." />
          )}
          <p className="mt-4 text-xs text-muted-foreground">All displayed performance metrics are simulated prototype data and are not investment results.</p>
        </GlassCard>

        <GlassCard className="p-5">
          <SectionTitle icon={<FlaskConical className="size-4" />} title="Backtests & risk" />
          <div className="mt-4 space-y-3">
            <RiskRow label="Volatility shock" value="Reviewed in Lab" />
            <RiskRow label="Spread expansion" value="Reviewed in Lab" />
            <RiskRow label="Trend reversal" value="Reviewed in Lab" />
            <RiskRow label="Max risk / trade" value={`${activeVersion?.riskLimit ?? 1}%`} />
          </div>
          <Button asChild variant="outline" size="sm" className="mt-4">
            <Link to="/lab"><FlaskConical /> Open Strategy Lab</Link>
          </Button>
        </GlassCard>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <GlassCard className="p-5">
          <SectionTitle icon={<ShieldCheck className="size-4" />} title="Markets & versions" />
          <div className="mt-4 flex flex-wrap gap-2">
            {(activeVersion?.markets ?? []).map((market) => <Badge key={market} variant="outline">{market}</Badge>)}
          </div>
          <div className="mt-5 space-y-2">
            {strategy.versions.map((version) => (
              <div key={version.id} className="flex items-center justify-between rounded-xl border border-border bg-surface/60 px-3 py-3">
                <div>
                  <p className="text-sm font-medium">Version {version.version} {version.id === strategy.activeVersionId && <Badge className="ml-2" variant="outline">Active</Badge>}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{formatDate(version.createdAt)} · {version.markets.join(" · ")}</p>
                </div>
                <span className="num text-xs text-muted-foreground">{version.riskLimit}% risk</span>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="p-5">
          <SectionTitle icon={<Users className="size-4" />} title="Community" />
          <div className="mt-4 rounded-xl border border-border bg-surface-2/60 p-4">
            <p className="text-2xl font-bold num">{strategy.followers.toLocaleString()}</p>
            <p className="mt-1 text-xs text-muted-foreground">followers</p>
          </div>
          <div className="mt-4 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Creator</span>
            <span className="font-medium">{strategy.creator}</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Strategy ID</span>
            <button onClick={copyStrategyId} className="flex items-center gap-1.5 font-mono text-xs text-primary hover:underline" title="Copy strategy ID">
              {copied ? "Copied" : strategy.id} <Copy className="size-3" />
            </button>
          </div>
        </GlassCard>
      </div>

      <GlassCard className="mt-4 border-amber-500/20 p-5">
        <div className="flex gap-3">
          <LockKeyhole className="mt-0.5 size-5 shrink-0 text-amber-400" />
          <div>
            <h2 className="text-sm font-semibold">Subscriptions & Arena entry</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Subscribe to follow a strategy in the prototype. Arena entry is reserved for eligible strategies and uses the same Strategy ID when selected. ALPHENTRA Token payments and rewards are prototype-only until wallet, custody, payment, and regulatory infrastructure are finalized.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge variant="outline">Paper trading</Badge>
              <Badge variant="outline">Prototype</Badge>
              <Badge variant="outline">No real funds</Badge>
            </div>
          </div>
        </div>
      </GlassCard>

      {subscribed && (
        <GlassCard className="mt-4 p-4">
          <div className="flex items-center gap-2 text-sm text-success"><CheckCircle2 className="size-4" /> Subscription intent saved for this prototype session.</div>
        </GlassCard>
      )}
    </AppShell>
  );
}

function SectionTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return <div className="flex items-center gap-2"><span className="text-primary">{icon}</span><h2 className="text-sm font-semibold">{title}</h2></div>;
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl border border-border bg-surface/60 p-3"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 text-sm font-medium">{value}</p></div>;
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl bg-surface-2/60 p-3"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 num text-lg font-semibold">{value}</p></div>;
}

function RiskRow({ label, value }: { label: string; value: string }) {
  return <div className="flex items-center justify-between border-b border-border py-2.5 text-sm last:border-0"><span className="text-muted-foreground">{label}</span><span className="font-medium">{value}</span></div>;
}

function EmptyState({ text }: { text: string }) {
  return <div className="mt-4 rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground">{text}</div>;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}
