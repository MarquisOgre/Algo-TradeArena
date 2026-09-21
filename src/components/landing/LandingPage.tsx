import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  ArrowRight, BarChart3, BrainCircuit, Check, ChevronDown, Globe2,
  Menu, Play, Trophy, Users, X, Coins, Search
} from "lucide-react";
import { useState } from "react";
import { loadMarketBoard } from "@/lib/marketData";

const pillars = [
  ["Build", "with AI", BrainCircuit],
  ["Trade", "Global Markets", BarChart3],
  ["Copy", "Top Traders", Users],
  ["Compete", "in Arena", Trophy],
  ["Earn", "with ALPH", Coins],
] as const;

const ecosystem = [
  ["AI Strategy Lab", "Turn ideas into powerful strategies with AI.", BrainCircuit, "/lab", "cyan"],
  ["Strategy Marketplace", "Discover & subscribe to top strategies.", BarChart3, "/strategies", "blue"],
  ["Copy Trading", "Follow top traders with flexible controls.", Users, "/copy", "violet"],
  ["Arena", "Compete, climb leaderboards and win rewards.", Trophy, "/battle", "gold"],
  ["Global Markets", "Trade Forex, Crypto, Metals, Equities, ETFs and more.", Globe2, "/markets", "cyan"],
  ["ALPH Economy", "Real utility. Real value. A growing ecosystem.", Coins, "/wallet", "green"],
] as const;

const stats = [
  ["10K+", "Active Traders"],
  ["1,200+", "Trading Strategies"],
  ["$50M+", "Simulated Volume"],
  ["100+", "Countries"],
];

function LandingBrand() {
  return <span className="flex items-center gap-2.5">
    <span className="relative flex size-10 shrink-0 items-center justify-center">
      <svg viewBox="0 0 48 48" className="size-10" fill="none" aria-hidden>
        <path d="M5 39L18 8h8l-4 10h8l-4-10h8l13 31h-9l-3.8-9H18.8L15 39H5Zm16.5-16h5L24 16l-2.5 7Z" fill="url(#alphMark)" />
        <defs><linearGradient id="alphMark" x1="7" y1="8" x2="43" y2="40" gradientUnits="userSpaceOnUse"><stop stopColor="#43F4FF"/><stop offset=".55" stopColor="#168DFF"/><stop offset="1" stopColor="#B35CFF"/></linearGradient></defs>
      </svg>
    </span>
    <span className="flex flex-col leading-none">
      <span className="text-[16px] font-black tracking-[.12em] text-white">ALPHENTRA</span>
      <span className="mt-1 text-[9px] font-medium tracking-[.16em] text-slate-400">TRADE BEYOND LIMITS</span>
    </span>
  </span>;
}

export function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const marketQuery = useQuery({
    queryKey: ["landing-market-board"],
    queryFn: loadMarketBoard,
    staleTime: 30_000,
    retry: 1,
  });
  const markets = (marketQuery.data ?? []).filter((m) => m.providerStatus === "live" && Number(m.price) > 0).slice(0, 6);

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#020812] text-white">
      <LandingNav menuOpen={menuOpen} onMenu={() => setMenuOpen((v) => !v)} />
      <main>
        <Hero />
        <MarketTicker markets={markets} loading={marketQuery.isLoading} />
        <Ecosystem />
        <AIAndMarkets markets={markets} loading={marketQuery.isLoading} />
        <SocialProof />
        <ConnectedEcosystem />
        <GlobalCTA />
      </main>
      <LandingFooter />
    </div>
  );
}

function LandingNav({ menuOpen, onMenu }: { menuOpen: boolean; onMenu: () => void }) {
  const links = [
    ["Product", "#ecosystem"], ["Strategies", "/strategies"], ["Copy Trading", "/copy"],
    ["Arena", "/battle"], ["Markets", "/markets"], ["ALPH", "/wallet"], ["Pricing", "#footer"], ["Resources", "#footer"],
  ];
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#020812]/80 backdrop-blur-2xl">
      <div className="mx-auto flex h-[68px] max-w-[1440px] items-center justify-between px-5 lg:px-8">
        <Link to="/" className="shrink-0" aria-label="Alphentra home"><LandingBrand /></Link>
        <nav className="hidden items-center gap-6 text-[12px] font-semibold text-slate-200 xl:flex">
          {links.map(([label, href]) => href.startsWith("#")
            ? <a key={label} href={href} className="hover:text-cyan-300">{label}{label === "Resources" && <ChevronDown className="ml-1 inline size-3" />}</a>
            : <Link key={label} to={href} className="hover:text-cyan-300">{label}</Link>)}
          <button className="ml-1 rounded-full border border-white/20 p-2 hover:border-cyan-300/60" aria-label="Search"><Search className="size-4" /></button>
        </nav>
        <div className="hidden items-center gap-2 lg:flex">
          <Link to="/login" className="rounded-full border border-white/25 px-4 py-2 text-[11px] font-bold hover:border-cyan-300/60">Connect Wallet</Link>
          <Link to="/login" className="rounded-full border border-white/25 px-4 py-2 text-[11px] font-bold hover:border-cyan-300/60">Connect MT5</Link>
          <Link to="/login" className="rounded-full bg-gradient-to-r from-fuchsia-400 via-violet-400 to-cyan-300 px-5 py-2 text-[11px] font-black text-slate-950 shadow-[0_0_30px_rgba(0,229,255,.22)]">Get Started <ArrowRight className="ml-1 inline size-3.5" /></Link>
        </div>
        <button onClick={onMenu} className="rounded-xl border border-white/10 p-2 lg:hidden" aria-label="Toggle navigation">
          {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>
      {menuOpen && <div className="border-t border-white/10 bg-[#020812] p-5 lg:hidden">
        <div className="grid gap-1 text-sm">{links.slice(0, 6).map(([label, href]) =>
          href.startsWith("#") ? <a key={label} href={href} onClick={onMenu} className="rounded-lg px-3 py-3">{label}</a>
          : <Link key={label} to={href} onClick={onMenu} className="rounded-lg px-3 py-3">{label}</Link>)}</div>
      </div>}
    </header>
  );
}

function Hero() {
  return (
    <section className="relative min-h-[720px] overflow-hidden border-b border-white/10">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_38%,rgba(0,194,255,.22),transparent_27%),radial-gradient(circle_at_88%_70%,rgba(117,54,255,.18),transparent_28%),linear-gradient(110deg,#020812_0%,#04182a_54%,#020812_100%)]" />
      <div className="absolute inset-0 opacity-25 [background-image:linear-gradient(rgba(0,229,255,.12)_1px,transparent_1px),linear-gradient(90deg,rgba(0,229,255,.12)_1px,transparent_1px)] [background-size:70px_70px]" />
      <div className="absolute right-[-12%] top-[4%] h-[680px] w-[680px] rounded-full border border-cyan-300/20 shadow-[0_0_140px_rgba(0,190,255,.18),inset_0_0_100px_rgba(39,91,255,.2)]" />
      <div className="absolute right-[2%] top-[13%] h-[520px] w-[520px] rounded-full border border-cyan-300/15" />
      <div className="absolute right-[14%] top-[23%] h-[360px] w-[360px] rounded-full bg-[radial-gradient(circle_at_35%_28%,#5eeaff,#1682ff_32%,#28106f_68%,transparent_70%)] opacity-80 blur-[1px]" />

      <div className="relative mx-auto grid max-w-[1440px] items-center gap-4 px-5 pb-20 pt-28 lg:grid-cols-[.78fr_1.22fr] lg:px-10 lg:pt-32">
        <div className="z-10 max-w-[650px]">
          <p className="text-[11px] font-bold uppercase tracking-[.35em] text-cyan-300">DISCIPLINE TODAY. <span className="text-cyan-200">FREEDOM TOMORROW.</span></p>
          <h1 className="mt-5 text-6xl font-black leading-[.88] tracking-[-.055em] sm:text-7xl lg:text-[82px]">TRADE<br />BEYOND <span className="bg-gradient-to-r from-white via-cyan-200 to-cyan-400 bg-clip-text text-transparent">LIMITS</span></h1>
          <p className="mt-7 max-w-xl text-[15px] leading-6 text-slate-300">A global trading ecosystem for traders, creators and investors.<br />Build strategies. Copy top traders. Compete. Earn.<br />Be part of a brighter financial future.</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link to="/login" className="rounded-full bg-gradient-to-r from-fuchsia-400 via-violet-400 to-cyan-300 px-7 py-3.5 text-xs font-black text-slate-950 shadow-[0_0_40px_rgba(0,229,255,.25)]">Get Started <ArrowRight className="ml-1 inline size-4" /></Link>
            <Link to="/app" className="rounded-full border border-cyan-300/70 px-6 py-3.5 text-xs font-bold"><Play className="mr-2 inline size-4 fill-current" />Watch Demo</Link>
          </div>
          <div className="mt-10 grid grid-cols-2 gap-y-5 sm:grid-cols-4">
            {stats.map(([value, label]) => <div key={label} className="border-l border-white/15 pl-4 first:border-l-0 first:pl-0"><div className="text-2xl font-black">{value}</div><div className="mt-1 text-[10px] text-slate-400">{label}</div></div>)}
          </div>
        </div>
        <HeroVisual />
      </div>
    </section>
  );
}

function HeroVisual() { return (<div className="relative mx-auto aspect-[1.08/1] w-full max-w-[800px]">
  <div className="absolute inset-[2%] rounded-full bg-[radial-gradient(circle_at_52%_45%,rgba(57,225,255,.3),transparent_30%),radial-gradient(circle_at_72%_30%,rgba(44,102,255,.28),transparent_35%)] blur-2xl" />
  <svg viewBox="0 0 760 680" className="absolute inset-0 h-full w-full" aria-hidden>
    <defs>
      <radialGradient id="globeFill" cx="38%" cy="30%" r="72%"><stop offset="0" stopColor="#8BEFFF"/><stop offset=".28" stopColor="#1BA4E8" stopOpacity=".8"/><stop offset=".6" stopColor="#1548B7" stopOpacity=".72"/><stop offset="1" stopColor="#080E3A" stopOpacity=".4"/></radialGradient>
      <radialGradient id="cityGlow"><stop stopColor="#FFD38A" stopOpacity=".95"/><stop offset="1" stopColor="#FF9A4A" stopOpacity="0"/></radialGradient>
    </defs>
    <circle cx="470" cy="305" r="235" fill="url(#globeFill)" stroke="#6EEBFF" strokeOpacity=".45" strokeWidth="1.5"/>
    <circle cx="470" cy="305" r="220" fill="none" stroke="#B3F6FF" strokeOpacity=".2"/>
    <ellipse cx="470" cy="305" rx="220" ry="92" fill="none" stroke="#6DEBFF" strokeOpacity=".2"/>
    <ellipse cx="470" cy="305" rx="220" ry="155" fill="none" stroke="#6DEBFF" strokeOpacity=".18"/>
    <ellipse cx="470" cy="305" rx="105" ry="225" fill="none" stroke="#6DEBFF" strokeOpacity=".18"/>
    <g fill="#278FEA" fillOpacity=".7" stroke="#A7F7FF" strokeOpacity=".25">
      <path d="M338 182l36-25 34 9 13 31-25 21-17 31-28-6-23-30z"/>
      <path d="M420 155l48-22 55 18 20 35-34 15-17 38-39 5-22-35z"/>
      <path d="M515 217l43-10 39 22-5 32-31 17-29-17-28-5z"/>
      <path d="M365 275l31-19 33 16 15 40-18 33-26 35-28-19-11-37z"/>
      <path d="M457 330l35-18 30 18 12 41-29 32-31-11-21-30z"/>
      <path d="M551 320l34-12 28 22-11 35-37 11-24-24z"/>
    </g>
    <g fill="#A9F8FF">
      <circle cx="344" cy="225" r="3"/><circle cx="382" cy="195" r="3"/><circle cx="436" cy="177" r="3"/><circle cx="505" cy="195" r="3"/><circle cx="550" cy="236" r="3"/><circle cx="592" cy="285" r="3"/><circle cx="550" cy="347" r="3"/><circle cx="494" cy="378" r="3"/><circle cx="414" cy="357" r="3"/><circle cx="365" cy="318" r="3"/>
    </g>
    <g fill="none" stroke="#8AF3FF" strokeOpacity=".35" strokeWidth="1">
      <path d="M344 225L382 195L436 177L505 195L550 236L592 285L550 347L494 378L414 357L365 318L344 225"/>
      <path d="M382 195L414 357M436 177L494 378M505 195L550 347"/>
    </g>
    <ellipse cx="470" cy="505" rx="235" ry="55" fill="url(#cityGlow)" opacity=".45"/>
    <g fill="#08172D" stroke="#3FE9FF" strokeOpacity=".2">
      <path d="M238 526h16v-44h11v44h8v-69h12v69h8v-31h13v31h10v-89h14v89h9v-52h11v52h8v-73h15v73h12v-39h9v39h13v-105h15v105h10v-60h11v60h12v-84h13v84h11v-49h10v49h12v-71h13v71h12v-96h14v96h11v-55h12v55h11v-76h15v76h10v-46h13v46h10v-63h12v63h10v-37h15v37h8v-56h12v56h16v-30h10v30z"/>
    </g>
    <g fill="#FFD58C"><circle cx="327" cy="489" r="2"/><circle cx="405" cy="444" r="2"/><circle cx="468" cy="466" r="2"/><circle cx="527" cy="430" r="2"/><circle cx="610" cy="480" r="2"/></g>
    <path d="M250 575 Q470 515 690 575 L760 680H0Z" fill="#020816" opacity=".96"/>
    <path d="M260 570 Q470 525 680 570" fill="none" stroke="#38E8FF" strokeOpacity=".25" strokeWidth="2"/>
    <circle cx="470" cy="445" r="22" fill="#02050A"/>
    <path d="M437 470 Q470 449 503 470 L519 565 Q470 592 421 565Z" fill="#03070D" stroke="#15263B"/>
    <path d="M450 500h40v42h-40z" fill="#071D30"/><path d="M458 509l12-13 12 13-12 19z" fill="#43EFFF" opacity=".85"/>
    <path d="M421 480l-27 76 18 7 35-64zM519 480l27 76-18 7-35-64z" fill="#03070D"/>
    <path d="M444 565l-18 74h25l19-74zM496 565l18 74h-25l-19-74z" fill="#02050A"/>
  </svg>
  <div className="absolute left-[0%] top-[10%] z-20 flex w-[132px] items-center gap-3 rounded-2xl border border-cyan-300/30 bg-[#03111f]/90 px-3 py-3 shadow-[0_0_30px_rgba(0,229,255,.16)] backdrop-blur-xl"><BrainCircuit className="size-6 text-cyan-300"/><div><div className="text-xs font-black">Build</div><div className="text-[9px] text-slate-400">with AI</div></div></div>
  <div className="absolute left-[0%] top-[29%] z-20 flex w-[132px] items-center gap-3 rounded-2xl border border-cyan-300/30 bg-[#03111f]/90 px-3 py-3 shadow-[0_0_30px_rgba(0,229,255,.16)] backdrop-blur-xl"><BarChart3 className="size-6 text-cyan-300"/><div><div className="text-xs font-black">Trade</div><div className="text-[9px] text-slate-400">Global Markets</div></div></div>
  <div className="absolute left-[0%] top-[48%] z-20 flex w-[132px] items-center gap-3 rounded-2xl border border-cyan-300/30 bg-[#03111f]/90 px-3 py-3 shadow-[0_0_30px_rgba(0,229,255,.16)] backdrop-blur-xl"><Users className="size-6 text-cyan-300"/><div><div className="text-xs font-black">Copy</div><div className="text-[9px] text-slate-400">Top Traders</div></div></div>
  <div className="absolute left-[0%] top-[67%] z-20 flex w-[132px] items-center gap-3 rounded-2xl border border-cyan-300/30 bg-[#03111f]/90 px-3 py-3 shadow-[0_0_30px_rgba(0,229,255,.16)] backdrop-blur-xl"><Trophy className="size-6 text-amber-300"/><div><div className="text-xs font-black">Compete</div><div className="text-[9px] text-slate-400">in Arena</div></div></div>
  <div className="absolute left-[25%] bottom-[0%] z-20 flex w-[132px] items-center gap-3 rounded-2xl border border-cyan-300/30 bg-[#03111f]/90 px-3 py-3 shadow-[0_0_30px_rgba(0,229,255,.16)] backdrop-blur-xl"><Coins className="size-6 text-emerald-300"/><div><div className="text-xs font-black">Earn</div><div className="text-[9px] text-slate-400">with ALPH</div></div></div>
  <div className="absolute right-[0%] top-[35%] z-20 rounded-2xl border border-cyan-300/30 bg-[#03111f]/90 px-5 py-3 shadow-[0_0_30px_rgba(0,229,255,.16)] backdrop-blur-xl"><div className="flex items-center gap-2"><Globe2 className="size-5 text-cyan-300"/><div><div className="text-xs font-black">GLOBAL MARKETS</div><div className="text-[9px] text-slate-400">24/7 Opportunities</div></div></div></div>
  <div className="absolute right-[-1%] top-[5%] z-20 hidden max-w-[145px] -rotate-6 font-serif text-lg italic leading-6 text-cyan-300 sm:block">Traders<br/>Creators<br/>Innovators<br/><span className="text-white">A Stronger<br/>Tomorrow</span></div>
  <div className="absolute right-[0%] bottom-[9%] z-20 hidden max-w-[120px] rotate-6 font-serif text-lg italic leading-6 text-white sm:block">One<br/><span className="text-cyan-300">Global<br/>Community</span></div>
</div>); }
function MarketTicker({ markets, loading }: { markets: any[]; loading: boolean }) {
  return <div className="border-b border-white/10 bg-[#01060d] px-4 py-2.5">
    <div className="mx-auto flex max-w-[1440px] overflow-hidden">
      {loading ? Array.from({ length: 5 }).map((_, i) => <div key={i} className="min-w-[190px] flex-1 border-r border-white/10 px-4 py-3"><div className="h-3 animate-pulse rounded bg-white/5" /></div>)
      : markets.length ? markets.slice(0,5).map((m:any,i:number) =>
        <div key={m.id ?? m.symbol+i} className="flex min-w-[190px] flex-1 items-center justify-between border-r border-white/10 px-4 text-[10px]">
          <div className="font-bold">{m.symbol}</div><div className="text-slate-300">{Number(m.price).toLocaleString()}</div>
          <div className={m.changePct >= 0 ? "font-bold text-emerald-300" : "font-bold text-rose-300"}>{m.changePct >= 0 ? "+" : ""}{Number(m.changePct).toFixed(2)}%</div><span className="text-cyan-300">⌁</span>
        </div>)
      : <div className="w-full py-2 text-center text-[10px] font-semibold tracking-[.2em] text-slate-500">WAITING FOR LIVE MARKET QUOTES</div>}
    </div>
  </div>;
}
function Ecosystem() {
  return <section id="ecosystem" className="border-b border-white/10 bg-[#03101d] px-5 py-14 lg:px-8 lg:py-16">
    <SectionIntro eyebrow="THE ALPHENTRA ECOSYSTEM" title="Everything You Need. In One Place." text="From strategy creation to real trading and global opportunities — Alphentra brings it all together." />
    <div className="mx-auto mt-9 grid max-w-[1440px] grid-cols-2 gap-2.5 md:grid-cols-3 lg:grid-cols-6">
      {ecosystem.map(([title, description, Icon, href, tone]) => <Link key={title} to={href} className={`group rounded-2xl border p-5 text-center transition hover:-translate-y-1 ${tone === "gold" ? "border-amber-300/25 bg-amber-300/[.04] hover:border-amber-300/60" : tone === "violet" ? "border-violet-300/25 bg-violet-300/[.05] hover:border-violet-300/60" : "border-cyan-300/20 bg-cyan-300/[.025] hover:border-cyan-300/50"}`}>
        <Icon className={`mx-auto size-9 ${tone === "gold" ? "text-amber-300" : tone === "violet" ? "text-violet-300" : tone === "green" ? "text-emerald-300" : "text-cyan-300"}`} />
        <h3 className="mt-4 text-sm font-black">{title}</h3><p className="mt-2 min-h-10 text-[11px] leading-4 text-slate-400">{description}</p>
        <span className="mx-auto mt-4 flex size-7 items-center justify-center rounded-full border border-current text-cyan-300"><ArrowRight className="size-3.5" /></span>
      </Link>)}
    </div>
  </section>;
}

function AIAndMarkets({ markets, loading }: { markets: any[]; loading: boolean }) {
  return <section className="border-b border-white/10 bg-[#020812] px-5 py-4 lg:px-8 lg:py-5">
    <div className="mx-auto grid max-w-[1440px] gap-3 lg:grid-cols-[1.05fr_.95fr]">
      <AIShowcase />
      <LiveMarkets markets={markets} loading={loading} />
    </div>
  </section>;
}

function AIShowcase() {
  return <div className="relative min-h-[430px] overflow-hidden rounded-2xl border border-cyan-300/20 bg-[radial-gradient(circle_at_70%_50%,rgba(0,229,255,.2),transparent_30%),linear-gradient(135deg,#061936,#03101d)] p-7">
    <p className="text-[10px] font-bold tracking-[.3em] text-cyan-300">AI POWERED TRADING</p><h2 className="mt-3 text-3xl font-black leading-tight sm:text-4xl">Smarter Strategies.<br />Real Results.</h2>
    <ul className="mt-6 space-y-2 text-xs text-slate-200">{["Strategy Builder","Backtesting","Risk Analysis","Optimisation","Publish to Marketplace"].map(x => <li key={x}><Check className="mr-2 inline size-4 rounded-full bg-cyan-300 text-slate-950" />{x}</li>)}</ul>
    <Link to="/lab" className="mt-7 inline-flex rounded-full bg-gradient-to-r from-cyan-300 to-violet-400 px-5 py-2.5 text-xs font-black text-slate-950">Try AI Strategy Lab <ArrowRight className="ml-1 inline size-4" /></Link>
    <div className="absolute right-[5%] top-[11%] size-72 rounded-full border border-cyan-200/25 shadow-[0_0_80px_rgba(0,229,255,.18)]"><div className="absolute inset-12 rounded-full bg-cyan-300/10 blur-xl" /><div className="absolute inset-0 flex items-center justify-center text-8xl font-black text-cyan-200/70">A</div></div>
    <div className="absolute bottom-8 right-[8%] font-serif text-xl italic text-white/70">Ideas<br />Data<br />Discipline<br /><span className="text-cyan-300">Results</span></div>
  </div>;
}

function LiveMarkets({ markets, loading }: { markets: any[]; loading: boolean }) {
  const rows = (loading ? [] : markets).slice(0,5);
  return <div className="rounded-2xl border border-white/10 bg-[#06111d] p-5"><div className="flex items-center justify-between"><h3 className="text-lg font-black">Live Market Overview</h3><div className="flex gap-3 text-[10px] text-slate-400"><span className="text-cyan-300">Crypto</span><span>Forex</span><span>Metals</span><span>Equities</span><span>ETFs</span></div></div>
    <div className="mt-4 space-y-2">{rows.length ? rows.map((m:any) => <div key={m.id} className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-3 rounded-xl border border-white/5 bg-black/20 px-3 py-2.5"><div><div className="text-xs font-bold">{m.symbol}</div><div className="text-[9px] text-slate-500">{m.assetClass}</div></div><div className="text-xs">{Number(m.price).toLocaleString()}</div><div className={m.changePct >= 0 ? "text-[10px] font-bold text-emerald-300" : "text-[10px] font-bold text-rose-300"}>{m.changePct >= 0 ? "+" : ""}{Number(m.changePct).toFixed(2)}%</div><Link to="/trade" className="rounded-lg border border-cyan-300/30 px-3 py-1 text-[10px] font-bold text-cyan-200">Trade</Link></div>) : [1,2,3,4,5].map(i => <div key={i} className="h-12 animate-pulse rounded-xl bg-white/5" />)}</div>
    <Link to="/markets" className="mt-4 inline-flex rounded-full border border-cyan-300/40 px-4 py-2 text-[10px] font-bold text-cyan-200">View All Markets <ArrowRight className="ml-1 size-3.5" /></Link>
    <div className="float-right mt-5 text-[9px] font-bold tracking-[.35em] text-cyan-300">TRADE THE WORLD. YOUR WAY.</div>
  </div>;
}

function SocialProof() {
  return <section className="border-b border-white/10 bg-[#020812] px-5 py-4 lg:px-8"><div className="mx-auto grid max-w-[1440px] gap-3 lg:grid-cols-3">
    <Card title="Top Performing Traders"><div className="space-y-2">{[["Quantum Trend","+42.8%"],["Alpha Scalper","+28.1%"],["Macro Master","+35.4%"],["Gold Runner","+24.6%"]].map(([n,r],i)=><div key={n} className="flex items-center gap-2 rounded-lg border border-white/5 bg-black/20 p-2 text-[10px]"><b className="flex size-5 items-center justify-center rounded bg-white/10">{i+1}</b><span className="flex-1 font-bold">{n}</span><span className="text-emerald-300">{r}</span><button className="rounded-full border border-cyan-300/30 px-2 py-1 text-[9px] text-cyan-200">Follow</button></div>)}</div></Card>
    <Card title="Global Community"><div className="relative h-full min-h-[180px] overflow-hidden"><Globe2 className="absolute right-3 top-3 size-28 text-cyan-300/20" /><p className="relative mt-8 text-sm font-semibold">Traders. Creators. Innovators.<br />A stronger tomorrow.</p><div className="mt-6 text-2xl font-black">10K+</div><Link to="/discover" className="mt-4 inline-flex rounded-full bg-gradient-to-r from-violet-400 to-cyan-300 px-4 py-2 text-[10px] font-black text-slate-950">Join the Community <ArrowRight className="ml-1 size-3.5" /></Link></div></Card>
    <Card title="Trade Anywhere"><div className="relative min-h-[180px]"><div className="absolute right-0 top-2 flex items-end gap-1"><div className="h-24 w-36 rounded-lg border border-cyan-300/30 bg-[#07192a] p-2 shadow-[0_0_30px_rgba(0,229,255,.15)]"><div className="h-full rounded bg-[linear-gradient(160deg,transparent_45%,rgba(0,229,255,.55)_46%,transparent_48%)]" /></div><div className="h-16 w-9 rounded-md border border-cyan-300/30 bg-[#07192a]" /></div><div className="absolute left-0 bottom-3 space-y-1 text-[10px] text-slate-300">{["Web Platform","iOS App","Android App","Connect Wallet","Connect MT5"].map(x=><div key={x}><span className="mr-2 text-cyan-300">✓</span>{x}</div>)}</div></div></Card>
  </div></section>;
}

function Card({ title, children }: { title: string; children: React.ReactNode }) { return <div className="rounded-2xl border border-white/10 bg-white/[.025] p-4"><h3 className="text-sm font-black">{title}<span className="float-right text-[10px] font-normal text-cyan-300">View All →</span></h3>{children}</div>; }

function ConnectedEcosystem() {
  return <section className="border-b border-white/10 bg-[#03101d] px-5 py-14 lg:px-8"><SectionIntro eyebrow="ONE CONNECTED ECOSYSTEM" title="Build. Test. Trade. Copy. Compete. Earn." text="Six connected experiences — one global trading ecosystem." /><div className="mx-auto mt-9 grid max-w-[1440px] gap-3 md:grid-cols-2 xl:grid-cols-3">{ecosystem.map(([title,description,Icon,href])=><Link key={title} to={href} className="rounded-2xl border border-white/10 bg-white/[.025] p-5 transition hover:border-cyan-300/40"><Icon className="size-7 text-cyan-300" /><h3 className="mt-4 font-black">{title}</h3><p className="mt-2 text-xs leading-5 text-slate-400">{description}</p><span className="mt-4 inline-flex size-7 items-center justify-center rounded-full border border-cyan-300/40 text-cyan-300"><ArrowRight className="size-3" /></span></Link>)}</div></section>;
}

function GlobalCTA() {
  return <section className="relative overflow-hidden border-b border-white/10 px-5 py-14 lg:px-8"><div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_110%,rgba(255,174,93,.35),transparent_35%),linear-gradient(180deg,#020812,#07172b)]" /><div className="absolute inset-x-0 bottom-0 h-44 bg-[linear-gradient(165deg,transparent_35%,#10294a_36%_45%,transparent_46%),linear-gradient(195deg,transparent_30%,#0b223e_31%_44%,transparent_45%)] opacity-80" /><div className="relative mx-auto max-w-[1440px]"><p className="text-[10px] font-bold tracking-[.35em] text-cyan-300">BE PART OF SOMETHING BIGGER</p><h2 className="mt-3 text-3xl font-black sm:text-5xl">Traders. Creators. Innovators.</h2><p className="mt-2 text-sm text-slate-300">A global movement for a brighter financial future.</p><Link to="/login" className="mt-6 inline-flex rounded-full bg-gradient-to-r from-fuchsia-400 to-cyan-300 px-6 py-3 text-xs font-black text-slate-950">Get Started <ArrowRight className="ml-1 size-4" /></Link><div className="absolute right-[7%] top-[-8%] hidden text-right font-serif text-lg italic text-white/80 md:block">Discipline today<br /><span className="text-cyan-300">creates freedom tomorrow.</span></div></div></section>;
}

function SectionIntro({ eyebrow, title, text }: { eyebrow: string; title: string; text: string }) { return <div className="mx-auto max-w-3xl text-center"><p className="text-[10px] font-bold tracking-[.35em] text-cyan-300">{eyebrow}</p><h2 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">{title}</h2><p className="mt-3 text-sm leading-6 text-slate-400">{text}</p></div>; }

function LandingFooter() {
  const cols = [
    ["Product", [["Features","/"],["Strategies","/strategies"],["Pricing","#footer"],["Roadmap","#footer"]]],
    ["Markets", [["Forex","/markets"],["Crypto","/markets"],["Metals","/markets"],["Equities","/markets"],["ETFs","/markets"]]],
    ["Resources", [["Documentation","/help"],["Help Center","/help"],["Blog","#footer"],["API","#footer"]]],
    ["Company", [["About","#footer"],["Careers","#footer"],["Contact","/help"]]],
    ["Legal", [["Risk Disclosure","/help"],["Terms of Service","/help"],["Privacy Policy","/help"]]],
  ];
  return <footer id="footer" className="bg-[#01060c] px-5 py-10 lg:px-8"><div className="mx-auto grid max-w-[1440px] gap-8 md:grid-cols-[1.5fr_repeat(5,1fr)]"><div><LandingBrand /><p className="mt-4 text-xs text-slate-500">Trade Beyond Limits.</p><div className="mt-6 flex gap-2"><span className="flex size-8 items-center justify-center rounded border border-white/15 text-xs">X</span><span className="flex size-8 items-center justify-center rounded border border-white/15 text-xs">◉</span><span className="flex size-8 items-center justify-center rounded border border-white/15 text-xs">▶</span><span className="flex size-8 items-center justify-center rounded border border-white/15 text-xs">in</span></div></div>{cols.map(([h,links])=><div key={h}><h4 className="text-xs font-black">{h}</h4><div className="mt-4 grid gap-2">{(links as string[][]).map(([label,href])=>href.startsWith("#")?<a key={label} href={href} className="text-[10px] text-slate-500 hover:text-white">{label}</a>:<Link key={label} to={href} className="text-[10px] text-slate-500 hover:text-white">{label}</Link>)}</div></div>)}</div><div className="mx-auto mt-8 flex max-w-[1440px] justify-between border-t border-white/10 pt-5 text-[10px] text-slate-600"><span>© 2026 Alphentra. All rights reserved.</span><span>Trade Smarter. Live Freer.</span></div></footer>;
}
