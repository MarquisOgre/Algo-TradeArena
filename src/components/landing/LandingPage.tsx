import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BarChart3,
  BrainCircuit,
  Check,
  ChevronRight,
  Coins,
  Globe2,
  Menu,
  Play,
  ShieldCheck,
  Sparkles,
  Trophy,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { useState } from "react";
import { Logo } from "@/components/brand/Logo";
import { loadMarketBoard } from "@/lib/marketData";

const pillars = [
  { icon: BrainCircuit, title: "Build", text: "Create strategies with AI", tone: "cyan" },
  { icon: BarChart3, title: "Test", text: "Backtest & optimise", tone: "blue" },
  { icon: Sparkles, title: "Trade", text: "Access global markets", tone: "violet" },
  { icon: Users, title: "Copy", text: "Follow top traders", tone: "pink" },
  { icon: Trophy, title: "Compete", text: "Join trading competitions", tone: "gold" },
  { icon: Coins, title: "Earn", text: "Grow with ALPH rewards", tone: "green" },
];

const ecosystem = [
  {
    icon: BrainCircuit,
    title: "AI Strategy Lab",
    eyebrow: "AI POWERED",
    description: "Turn ideas into powerful strategies with AI.",
    items: ["Strategy Builder", "Backtesting", "Stress Testing", "Optimisation", "Publish to Marketplace"],
    href: "/lab",
    accent: "cyan",
  },
  {
    icon: BarChart3,
    title: "Strategy Marketplace",
    eyebrow: "DISCOVER",
    description: "Discover and subscribe to strategies from global creators.",
    items: ["Performance analytics", "Risk metrics", "Strategy discovery", "Creator profiles"],
    href: "/strategies",
    accent: "blue",
  },
  {
    icon: Users,
    title: "Copy Trading",
    eyebrow: "FOLLOW",
    description: "Follow top traders with flexible risk controls.",
    items: ["Choose a trader", "Set allocation", "Control copy ratio", "Drawdown protection"],
    href: "/copy",
    accent: "violet",
  },
  {
    icon: Globe2,
    title: "Global Markets",
    eyebrow: "TRADE",
    description: "Trade Forex, Crypto, Metals, Equities, ETFs and more.",
    items: ["Live market data", "Market discovery", "Watchlists", "Trading tools"],
    href: "/markets",
    accent: "cyan",
  },
  {
    icon: Trophy,
    title: "Arena",
    eyebrow: "COMPETE",
    description: "Compete, climb leaderboards and win rewards.",
    items: ["Trading competitions", "Leaderboards", "Performance tracking", "ALPH rewards"],
    href: "/battle",
    accent: "gold",
  },
  {
    icon: Coins,
    title: "ALPH Economy",
    eyebrow: "ECOSYSTEM",
    description: "Real utility. Real value. A growing trading economy.",
    items: ["Strategy subscriptions", "Competition entry", "Creator rewards", "Premium features"],
    href: "/wallet",
    accent: "green",
  },
];

const stats = [
  ["10K+", "Active Traders"],
  ["1,200+", "Trading Strategies"],
  ["$50M+", "Simulated Volume"],
  ["100+", "Countries"],
];

export function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const marketQuery = useQuery({
    queryKey: ["landing-market-board"],
    queryFn: loadMarketBoard,
    staleTime: 60_000,
    retry: 1,
  });

  const markets = (marketQuery.data ?? []).filter((market) => market.providerStatus === "live").slice(0, 6);

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#020812] text-white">
      <LandingNav menuOpen={menuOpen} onMenu={() => setMenuOpen((open) => !open)} />

      <main>
        <section className="relative isolate min-h-[720px] overflow-hidden border-b border-white/10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_35%,rgba(0,229,255,.18),transparent_28%),radial-gradient(circle_at_92%_80%,rgba(123,92,255,.18),transparent_30%),linear-gradient(115deg,#020812_0%,#06172a_52%,#020812_100%)]" />
          <div className="absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(255,255,255,.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.04)_1px,transparent_1px)] [background-size:64px_64px]" />

          <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-5 pb-16 pt-28 lg:grid-cols-[.9fr_1.1fr] lg:px-8 lg:pb-24 lg:pt-36">
            <div>
              <p className="mb-5 text-[11px] font-bold uppercase tracking-[.38em] text-cyan-300">Discipline today. Freedom tomorrow.</p>
              <h1 className="max-w-2xl text-5xl font-black leading-[.95] tracking-[-.04em] sm:text-6xl lg:text-7xl">
                TRADE
                <br />
                BEYOND <span className="bg-gradient-to-r from-cyan-300 via-sky-400 to-violet-400 bg-clip-text text-transparent">LIMITS.</span>
              </h1>
              <p className="mt-7 max-w-xl text-base leading-7 text-slate-300 sm:text-lg">
                A global AI-powered trading ecosystem for traders, creators and investors. Build strategies, test ideas, trade markets, copy top traders and compete in the Arena.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  to="/login"
                  className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-300 to-violet-400 px-6 py-3.5 text-sm font-extrabold text-slate-950 shadow-[0_0_40px_rgba(0,229,255,.25)] transition-transform hover:-translate-y-0.5"
                >
                  Get Started <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
                <Link
                  to="/app"
                  className="inline-flex items-center gap-2 rounded-full border border-cyan-300/60 bg-slate-950/30 px-6 py-3.5 text-sm font-bold text-white backdrop-blur transition-colors hover:bg-white/10"
                >
                  <Play className="size-4 fill-current" /> Explore Platform
                </Link>
              </div>

              <div className="mt-10 grid max-w-2xl grid-cols-2 gap-y-5 sm:grid-cols-4">
                {stats.map(([value, label]) => (
                  <div key={label} className="border-l border-white/15 pl-4 first:border-l-0 first:pl-0">
                    <div className="text-2xl font-black tracking-tight">{value}</div>
                    <div className="mt-1 text-xs text-slate-400">{label}</div>
                  </div>
                ))}
              </div>
            </div>

            <HeroUniverse />
          </div>
        </section>

        <MarketTicker markets={markets} loading={marketQuery.isLoading} />

        <section className="border-b border-white/10 bg-[#03101d] px-5 py-16 lg:px-8 lg:py-20">
          <div className="mx-auto max-w-7xl">
            <SectionIntro eyebrow="THE ALPHENTRA ECOSYSTEM" title="Everything You Need. In One Place." text="From strategy creation to real market infrastructure — Alphentra brings the trading journey together." />

            <div className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
              {pillars.map(({ icon: Icon, title, text, tone }) => (
                <div key={title} className="group rounded-2xl border border-white/10 bg-white/[.025] p-5 text-center transition-all hover:-translate-y-1 hover:border-cyan-300/40 hover:bg-white/[.05]">
                  <div className={`mx-auto flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-white/10 to-white/[.02] text-${tone === "gold" ? "amber" : tone === "green" ? "emerald" : tone === "pink" ? "fuchsia" : tone === "violet" ? "violet" : tone === "blue" ? "sky" : "cyan"}-300 ring-1 ring-white/10`}>
                    <Icon className="size-7" />
                  </div>
                  <h3 className="mt-4 text-base font-extrabold">{title}</h3>
                  <p className="mt-1 text-xs leading-5 text-slate-400">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-white/10 bg-[#020812] px-5 py-16 lg:px-8 lg:py-24">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-5 lg:grid-cols-[1.2fr_.8fr]">
              <AIShowcase />
              <LiveMarketPanel markets={markets} loading={marketQuery.isLoading} />
            </div>

            <div className="mt-5 grid gap-5 lg:grid-cols-3">
              <TopTradersCard />
              <CommunityCard />
              <AnywhereCard />
            </div>
          </div>
        </section>

        <section className="border-b border-white/10 bg-[#03101d] px-5 py-16 lg:px-8 lg:py-24">
          <div className="mx-auto max-w-7xl">
            <SectionIntro eyebrow="ONE CONNECTED ECOSYSTEM" title="Build. Test. Trade. Copy. Compete. Earn." text="Each part of Alphentra is designed to connect with the next — from your first strategy idea to the wider trading community." />
            <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {ecosystem.map(({ icon: Icon, title, eyebrow, description, items, href, accent }) => (
                <Link key={title} to={href} className="group rounded-3xl border border-white/10 bg-gradient-to-b from-white/[.045] to-white/[.015] p-6 transition-all hover:-translate-y-1 hover:border-cyan-300/35">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex size-12 items-center justify-center rounded-2xl bg-cyan-300/10 text-cyan-300 ring-1 ring-cyan-300/20">
                      <Icon className="size-6" />
                    </div>
                    <ChevronRight className="size-5 text-slate-500 transition-transform group-hover:translate-x-1 group-hover:text-cyan-300" />
                  </div>
                  <p className="mt-6 text-[10px] font-bold tracking-[.3em] text-cyan-300">{eyebrow}</p>
                  <h3 className="mt-2 text-xl font-extrabold">{title}</h3>
                  <p className="mt-2 min-h-12 text-sm leading-6 text-slate-400">{description}</p>
                  <ul className="mt-5 space-y-2 text-sm text-slate-300">
                    {items.map((item) => (
                      <li key={item} className="flex items-center gap-2"><Check className="size-4 text-emerald-300" />{item}</li>
                    ))}
                  </ul>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden px-5 py-20 lg:px-8 lg:py-28">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(0,229,255,.15),transparent_35%),linear-gradient(180deg,#03101d,#020812)]" />
          <div className="relative mx-auto max-w-5xl text-center">
            <p className="text-[11px] font-bold uppercase tracking-[.38em] text-cyan-300">A GLOBAL COMMUNITY</p>
            <h2 className="mt-4 text-4xl font-black tracking-tight sm:text-6xl">Traders. Creators. Innovators.</h2>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-400 sm:text-lg">Join a connected ecosystem shaping the future of strategy creation, market access, copy trading and competition.</p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link to="/login" className="inline-flex items-center gap-2 rounded-full bg-cyan-300 px-7 py-3.5 text-sm font-extrabold text-slate-950 hover:bg-cyan-200">Be Part of It <ArrowRight className="size-4" /></Link>
              <Link to="/app" className="inline-flex items-center gap-2 rounded-full border border-white/20 px-7 py-3.5 text-sm font-bold hover:bg-white/5">Explore Alphentra</Link>
            </div>
          </div>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
}

function LandingNav({ menuOpen, onMenu }: { menuOpen: boolean; onMenu: () => void }) {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#020812]/75 backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 lg:px-8">
        <Link to="/" aria-label="Alphentra home"><Logo /></Link>
        <nav className="hidden items-center gap-7 text-sm font-medium text-slate-300 lg:flex">
          <a href="#ecosystem" className="hover:text-white">Product</a>
          <Link to="/strategies" className="hover:text-white">Strategies</Link>
          <Link to="/copy" className="hover:text-white">Copy Trading</Link>
          <Link to="/battle" className="hover:text-white">Arena</Link>
          <Link to="/markets" className="hover:text-white">Markets</Link>
          <Link to="/wallet" className="hover:text-white">ALPH</Link>
          <a href="#footer" className="hover:text-white">Resources</a>
        </nav>
        <div className="hidden items-center gap-2 lg:flex">
          <Link to="/login" className="rounded-xl border border-white/15 px-4 py-2.5 text-sm font-semibold hover:bg-white/5">Sign In</Link>
          <Link to="/login" className="rounded-xl bg-gradient-to-r from-cyan-300 to-violet-400 px-5 py-2.5 text-sm font-extrabold text-slate-950">Get Started <ArrowRight className="ml-1 inline size-4" /></Link>
        </div>
        <button onClick={onMenu} className="rounded-xl border border-white/10 p-2 lg:hidden" aria-label="Toggle navigation">
          {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>
      {menuOpen && (
        <div className="border-t border-white/10 bg-[#020812] px-5 py-5 lg:hidden">
          <div className="grid gap-2 text-sm">
            {[
              ["Product", "#ecosystem"],
              ["Strategies", "/strategies"],
              ["Copy Trading", "/copy"],
              ["Arena", "/battle"],
              ["Markets", "/markets"],
            ].map(([label, href]) => href.startsWith("#") ? (
              <a key={label} href={href} onClick={onMenu} className="rounded-xl px-3 py-3 hover:bg-white/5">{label}</a>
            ) : (
              <Link key={label} to={href} onClick={onMenu} className="rounded-xl px-3 py-3 hover:bg-white/5">{label}</Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}

function HeroUniverse() {
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[650px]">
      <div className="absolute inset-[12%] rounded-full bg-[radial-gradient(circle_at_35%_30%,#38e8ff,#1473ff_34%,#28106e_68%,transparent_70%)] opacity-80 blur-[2px]" />
      <div className="absolute inset-[16%] rounded-full border border-cyan-200/30 shadow-[0_0_90px_rgba(0,229,255,.35),inset_0_0_80px_rgba(74,93,255,.35)]">
        <div className="absolute inset-0 rounded-full [background-image:radial-gradient(circle_at_20%_25%,rgba(255,255,255,.8)_0_1px,transparent_1px),radial-gradient(circle_at_70%_60%,rgba(0,229,255,.9)_0_1px,transparent_1px)] [background-size:48px_48px,68px_68px]" />
        <div className="absolute left-1/2 top-1/2 flex size-36 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-slate-950/50 text-7xl font-black text-white shadow-[0_0_60px_rgba(0,229,255,.35)] backdrop-blur">A</div>
      </div>
      {[
        ["Build", "AI", "left-0 top-[22%]"],
        ["Trade", "Markets", "right-0 top-[18%]"],
        ["Copy", "Traders", "left-[2%] bottom-[26%]"],
        ["Compete", "Arena", "right-[1%] bottom-[28%]"],
        ["Earn", "ALPH", "left-1/2 bottom-[3%] -translate-x-1/2"],
      ].map(([title, sub, position]) => (
        <div key={title} className={`absolute ${position} rounded-2xl border border-cyan-300/25 bg-slate-950/70 px-4 py-3 shadow-[0_0_30px_rgba(0,229,255,.12)] backdrop-blur-xl`}>
          <div className="text-xs font-extrabold text-white">{title}</div>
          <div className="text-[10px] text-cyan-200">{sub}</div>
        </div>
      ))}
      <div className="absolute bottom-[8%] right-[15%] hidden h-40 w-56 rotate-[-7deg] rounded-xl border border-white/15 bg-slate-950/80 p-3 shadow-2xl backdrop-blur-xl sm:block">
        <div className="flex items-center justify-between text-[9px] text-slate-400"><span>Portfolio</span><span className="text-emerald-300">Live</span></div>
        <div className="mt-3 flex h-20 items-end gap-1">
          {[25,31,28,42,36,50,46,62,57,71,66,82,78,92].map((h, i) => <span key={i} style={{ height: `${h}%` }} className="flex-1 rounded-t bg-gradient-to-t from-cyan-500/30 to-cyan-300" />)}
        </div>
        <div className="mt-2 text-lg font-black">$24,521.32</div>
      </div>
    </div>
  );
}

function MarketTicker({ markets, loading }: { markets: any[]; loading: boolean }) {
  return (
    <div className="border-b border-white/10 bg-[#02060d] px-4 py-3">
      <div className="mx-auto flex max-w-7xl gap-2 overflow-hidden">
        {(loading ? Array.from({ length: 6 }) : markets).map((market, index) => (
          <div key={market?.id ?? index} className="flex min-w-[175px] flex-1 items-center justify-between rounded-xl border border-white/10 bg-white/[.025] px-3 py-2">
            {market ? (
              <>
                <div className="min-w-0"><div className="truncate text-[11px] font-bold">{market.symbol}</div><div className="text-[10px] text-slate-500">{market.assetClass}</div></div>
                <div className="text-right"><div className="text-xs font-bold">{market.price.toLocaleString()}</div><div className={`text-[10px] font-bold ${market.changePct >= 0 ? "text-emerald-300" : "text-rose-300"}`}>{market.changePct >= 0 ? "+" : ""}{market.changePct.toFixed(2)}%</div></div>
              </>
            ) : <div className="h-8 w-full animate-pulse rounded bg-white/5" />}
          </div>
        ))}
      </div>
    </div>
  );
}

function AIShowcase() {
  return (
    <div className="relative min-h-[420px] overflow-hidden rounded-3xl border border-cyan-300/20 bg-[radial-gradient(circle_at_75%_45%,rgba(0,229,255,.18),transparent_30%),linear-gradient(135deg,#061936,#03101d)] p-7">
      <div className="absolute right-[-8%] top-[18%] size-72 rounded-full border border-cyan-300/20 shadow-[0_0_100px_rgba(0,229,255,.2)]">
        <div className="absolute inset-8 rounded-full border border-cyan-300/20" />
        <div className="absolute inset-16 rounded-full bg-cyan-300/10 blur-xl" />
        <div className="absolute inset-0 flex items-center justify-center text-8xl font-black text-cyan-200/80">A</div>
      </div>
      <p className="relative text-[10px] font-bold uppercase tracking-[.3em] text-cyan-300">AI POWERED TRADING</p>
      <h2 className="relative mt-3 max-w-md text-4xl font-black leading-tight">Smarter Strategies.<br />Real Results.</h2>
      <p className="relative mt-4 max-w-md text-sm leading-6 text-slate-300">From idea to execution — AI helps you build, test and optimise strategies before you put them to work.</p>
      <ul className="relative mt-6 space-y-2 text-sm text-slate-200">
        {["Strategy Builder", "Backtesting", "Risk Analysis", "Optimisation", "Publish to Marketplace"].map((item) => <li key={item} className="flex items-center gap-2"><Check className="size-4 rounded-full bg-cyan-300 text-slate-950" />{item}</li>)}
      </ul>
      <Link to="/lab" className="relative mt-7 inline-flex rounded-full bg-gradient-to-r from-cyan-300 to-violet-400 px-5 py-2.5 text-xs font-extrabold text-slate-950">Try AI Strategy Lab <ArrowRight className="ml-1 inline size-4" /></Link>
    </div>
  );
}

function LiveMarketPanel({ markets, loading }: { markets: any[]; loading: boolean }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[.025] p-6">
      <div className="flex items-center justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[.25em] text-cyan-300">LIVE DATA</p><h3 className="mt-2 text-2xl font-black">Market Overview</h3></div><Link to="/markets" className="text-xs font-bold text-cyan-300">View all <ArrowRight className="inline size-3" /></Link></div>
      <div className="mt-6 space-y-2">
        {(loading ? Array.from({ length: 5 }) : markets.slice(0, 5)).map((market, index) => market ? (
          <div key={market.id} className="flex items-center gap-3 rounded-2xl border border-white/5 bg-black/20 px-3 py-3">
            <div className="flex size-8 items-center justify-center rounded-full bg-cyan-300/10 text-cyan-300"><BarChart3 className="size-4" /></div>
            <div className="min-w-0 flex-1"><div className="truncate text-sm font-bold">{market.symbol}</div><div className="text-[10px] text-slate-500">{market.assetClass}</div></div>
            <div className="text-right"><div className="text-xs font-bold">{market.price.toLocaleString()}</div><div className={`text-[10px] font-bold ${market.changePct >= 0 ? "text-emerald-300" : "text-rose-300"}`}>{market.changePct >= 0 ? "+" : ""}{market.changePct.toFixed(2)}%</div></div>
            <Link to="/trade" className="rounded-lg border border-cyan-300/25 px-3 py-1.5 text-[10px] font-bold text-cyan-200 hover:bg-cyan-300/10">Trade</Link>
          </div>
        ) : <div key={index} className="h-14 animate-pulse rounded-2xl bg-white/5" />)}
      </div>
    </div>
  );
}

function TopTradersCard() {
  const traders = [["Quantum Trend", "+42.8%"], ["Alpha Scalper", "+28.1%"], ["Macro Master", "+35.4%"], ["Gold Runner", "+24.6%"]];
  return <div className="rounded-3xl border border-white/10 bg-white/[.025] p-6"><div className="flex items-center justify-between"><h3 className="text-lg font-extrabold">Top Performing Traders</h3><Link to="/traders" className="text-xs text-cyan-300">View all</Link></div><div className="mt-4 space-y-3">{traders.map(([name, ret], i) => <div key={name} className="flex items-center gap-3 rounded-2xl border border-white/5 bg-black/20 p-3"><div className="flex size-8 items-center justify-center rounded-full bg-gradient-to-br from-cyan-300/30 to-violet-400/20 text-xs font-black">{i + 1}</div><div className="min-w-0 flex-1 text-sm font-semibold">{name}</div><span className="text-xs font-black text-emerald-300">{ret}</span></div>)}</div></div>;
}

function CommunityCard() {
  return <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[radial-gradient(circle_at_70%_30%,rgba(123,92,255,.2),transparent_40%),#071324] p-6"><Globe2 className="size-10 text-violet-300" /><h3 className="mt-5 text-2xl font-black">Global Community</h3><p className="mt-2 text-sm leading-6 text-slate-400">Traders. Creators. Innovators. Connect with the next generation of the trading ecosystem.</p><div className="mt-8 text-3xl font-black">10K+</div><div className="text-xs text-slate-500">community members</div><Link to="/discover" className="mt-6 inline-flex rounded-full border border-violet-300/40 px-4 py-2 text-xs font-bold text-violet-200">Join the Community <ArrowRight className="ml-1 inline size-4" /></Link></div>;
}

function AnywhereCard() {
  return <div className="rounded-3xl border border-white/10 bg-white/[.025] p-6"><ShieldCheck className="size-10 text-emerald-300" /><h3 className="mt-5 text-2xl font-black">Trade Anywhere</h3><p className="mt-2 text-sm leading-6 text-slate-400">Seamless access to your trading ecosystem across web, connected wallets and MT5.</p><div className="mt-7 grid grid-cols-2 gap-2 text-xs">{["Web Platform", "iOS App", "Android App", "Connect MT5"].map((x) => <div key={x} className="rounded-xl border border-white/10 bg-black/20 px-3 py-3 font-semibold">{x}</div>)}</div><Link to="/app" className="mt-6 inline-flex rounded-full border border-cyan-300/30 px-4 py-2 text-xs font-bold text-cyan-200">Start Trading Anywhere <ArrowRight className="ml-1 inline size-4" /></Link></div>;
}

function SectionIntro({ eyebrow, title, text }: { eyebrow: string; title: string; text: string }) {
  return <div className="mx-auto max-w-3xl text-center"><p className="text-[10px] font-bold tracking-[.35em] text-cyan-300">{eyebrow}</p><h2 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">{title}</h2><p className="mt-4 text-sm leading-6 text-slate-400 sm:text-base">{text}</p></div>;
}

function LandingFooter() {
  return (
    <footer id="footer" className="border-t border-white/10 bg-[#01060c] px-5 py-12 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-[1.4fr_repeat(4,1fr)]">
        <div><Logo /><p className="mt-4 max-w-xs text-sm leading-6 text-slate-500">Trade smarter. Build strategies. Connect with the Alphentra ecosystem.</p></div>
        {[
          ["Product", [["Features", "/"], ["AI Strategy Lab", "/lab"], ["Strategies", "/strategies"], ["Copy Trading", "/copy"]]],
          ["Markets", [["Forex", "/markets"], ["Crypto", "/markets"], ["Metals", "/markets"], ["Equities", "/markets"]]],
          ["Company", [["About", "/"], ["Pricing", "/"], ["Careers", "/"], ["Contact", "/help"]]],
          ["Legal", [["Risk Disclosure", "/help"], ["Terms of Service", "/help"], ["Privacy Policy", "/help"]]],
        ].map(([heading, links]) => <div key={heading as string}><h4 className="text-sm font-bold">{heading as string}</h4><div className="mt-4 grid gap-2">{(links as string[][]).map(([label, href]) => <Link key={label} to={href} className="text-xs text-slate-500 hover:text-white">{label}</Link>)}</div></div>)}
      </div>
      <div className="mx-auto mt-10 flex max-w-7xl flex-col justify-between gap-3 border-t border-white/10 pt-6 text-xs text-slate-600 sm:flex-row"><span>© 2026 Alphentra. All rights reserved.</span><span>Trade Smarter. Live Freer.</span></div>
    </footer>
  );
}
