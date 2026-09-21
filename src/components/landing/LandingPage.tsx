import { useQuery } from "@tanstack/react-query";
import { import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BarChart3,
  Bot,
  Check,
  Coins,
  Globe2,
  Play,
  Search,
  Trophy,
  Users,
  Wallet,
  Zap,
} from "lucide-react";
import { loadMarketBoard } from "@/lib/marketData";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Alphentra — Trade Beyond Limits" },
      {
        name: "description",
        content: "A global trading ecosystem for traders, creators, and investors.",
      },
      { property: "og:title", content: "Alphentra — Trade Beyond Limits" },
      {
        property: "og:description",
        content: "Build strategies, copy top traders, compete, and trade global markets.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const ecosystem = [
  { icon: Bot, title: "AI Strategy Lab", copy: "Turn ideas into powerful strategies with AI.", tone: "cyan" },
  { icon: BarChart3, title: "Strategy Marketplace", copy: "Discover & subscribe to top strategies.", tone: "blue" },
  { icon: Users, title: "Copy Trading", copy: "Follow top traders with flexible controls.", tone: "violet" },
  { icon: Trophy, title: "Arena", copy: "Compete, climb leaderboards and win rewards.", tone: "gold" },
  { icon: Globe2, title: "Global Markets", copy: "Trade Forex, Crypto, Metals, Equities and more.", tone: "cyan" },
  { icon: Coins, title: "ALPH Economy", copy: "Real utility. Real value. A growing ecosystem.", tone: "gold" },
];


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

function Brand() {
  return (
    <a href="#top" className="brand" aria-label="Alphentra home">
      <span className="brand-mark">A</span>
      <span><strong>ALPHENTRA</strong><small>Trade Beyond Limits</small></span>
    </a>
  );
}

function Sparkline({ n = 0 }: { n?: number }) {
  const points = [
    "0,18 8,13 15,15 22,7 29,11 37,4 44,8 52,2 60,5",
    "0,17 8,15 15,8 23,12 30,6 38,9 45,3 53,5 60,1",
    "0,15 8,8 15,11 22,5 29,13 37,7 45,9 52,3 60,6",
  ];
  return <svg className="spark" viewBox="0 0 60 20" aria-hidden="true"><polyline points={points[n % points.length]} /></svg>;
}

function Index() {
  const marketQuery = useQuery({
    queryKey: ["landing-market-board"],
    queryFn: loadMarketBoard,
    staleTime: 30_000,
    retry: 1,
  });
  const markets = (marketQuery.data ?? [])
    .filter((m) => m.providerStatus === "live" && Number(m.price) > 0)
    .slice(0, 6);

  return (
    <main id="top" className="site-shell">
      <header className="topbar">
        <Brand />
        <nav aria-label="Main navigation">
          <a href="#products">Product</a><a href="#strategies">Strategies</a><a href="#copy">Copy Trading</a>
          <a href="#arena">Arena</a><a href="#markets">Markets</a><a href="#community">Community</a>
        </nav>
        <div className="nav-actions">
          <a className="icon-link" href="#markets" aria-label="Search"><Search size={18} /></a>
          <a className="outline-action" href="#wallet"><Wallet size={16} /> Connect Wallet</a>
          <a className="primary-action compact" href="/login">Get Started <ArrowRight size={17} /></a>
        </div>
      </header>

      <section className="relative min-h-[720px] overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_38%,rgba(0,194,255,.22),transparent_27%),radial-gradient(circle_at_88%_70%,rgba(117,54,255,.18),transparent_28%),linear-gradient(110deg,#020812_0%,#04182a_54%,#020812_100%)]" />
        <div className="absolute inset-0 opacity-25 [background-image:linear-gradient(rgba(0,229,255,.12)_1px,transparent_1px),linear-gradient(90deg,rgba(0,229,255,.12)_1px,transparent_1px)] [background-size:70px_70px]" />
        <div className="relative mx-auto grid max-w-[1440px] items-center gap-4 px-5 pb-20 pt-28 lg:grid-cols-[.78fr_1.22fr] lg:px-10 lg:pt-32">
          <div className="z-10 max-w-[650px]">
            <p className="text-[11px] font-bold uppercase tracking-[.35em] text-cyan-300">DISCIPLINE TODAY. <span className="text-cyan-200">FREEDOM TOMORROW.</span></p>
            <h1 className="mt-5 text-6xl font-black leading-[.88] tracking-[-.055em] sm:text-7xl lg:text-[82px]">TRADE<br />BEYOND <span className="bg-gradient-to-r from-white via-cyan-200 to-cyan-400 bg-clip-text text-transparent">LIMITS</span></h1>
            <p className="mt-7 max-w-xl text-[15px] leading-6 text-slate-300">A global trading ecosystem for traders, creators and investors.<br />Build strategies. Copy top traders. Compete. Earn.<br />Be part of a brighter financial future.</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link to="/login" className="rounded-full bg-gradient-to-r from-fuchsia-400 via-violet-400 to-cyan-300 px-7 py-3.5 text-xs font-black text-slate-950">Get Started <ArrowRight className="ml-1 inline size-4" /></Link>
              <Link to="/app" className="rounded-full border border-cyan-300/70 px-6 py-3.5 text-xs font-bold"><Play className="mr-2 inline size-4 fill-current" />Watch Demo</Link>
            </div>
            <div className="mt-10 grid grid-cols-2 gap-y-5 sm:grid-cols-4">
              {stats.map(([value, label]) => <div key={label} className="border-l border-white/15 pl-4 first:border-l-0 first:pl-0"><div className="text-2xl font-black">{value}</div><div className="mt-1 text-[10px] text-slate-400">{label}</div></div>)}
            </div>
          </div>
          <HeroVisual />
        </div>
      </section>

      <div className="ticker" aria-label="Live market ticker">
        {marketQuery.isLoading ? (
          <div className="w-full px-5 text-center text-[10px] font-semibold tracking-[.2em] text-slate-500">LOADING LIVE MARKET QUOTES</div>
        ) : markets.length ? (
          markets.slice(0, 5).map((m: any) => (
            <div key={m.id ?? m.symbol} className="min-w-[240px]">
              <b>{m.symbol}</b><span>{Number(m.price).toLocaleString()}</span>
              <em className={Number(m.changePct) >= 0 ? "text-emerald-300" : "text-rose-300"}>{Number(m.changePct) >= 0 ? "+" : ""}{Number(m.changePct).toFixed(2)}%</em>
            </div>
          ))
        ) : (
          <div className="w-full px-5 text-center text-[10px] font-semibold tracking-[.2em] text-slate-500">WAITING FOR LIVE MARKET QUOTES</div>
        )}
      </div>

      <section id="products" className="ecosystem section-wrap">
        <p className="section-kicker">The Alphentra ecosystem</p>
        <h2>Everything You Need. In One Place.</h2>
        <p className="section-intro">From strategy creation to real trading and global opportunities — Alphentra brings it all together.</p>
        <div className="ecosystem-grid">
          {ecosystem.map(({ icon: Icon, title, copy, tone }) => (
            <article className={`feature-card ${tone}`} key={title}>
              <Icon /><h3>{title}</h3><p>{copy}</p><a href={`#${title.toLowerCase().replaceAll(" ", "-")}`} aria-label={`Explore ${title}`}><ArrowRight size={17} /></a>
            </article>
          ))}
        </div>
      </section>

      <section id="strategies" className="dashboard section-wrap">
        <article className="ai-panel">
          <div className="ai-copy">
            <p><Zap size={16} /> AI Powered Trading</p>
            <h2>Smarter Strategies.<br />Real Results.</h2>
            <ul>{["Strategy Builder", "Backtesting", "Risk Analysis", "Optimisation", "Publish to Marketplace"].map(x => <li key={x}><Check size={15} />{x}</li>)}</ul>
            <a className="primary-action" href="#start">Try AI Strategy Lab <ArrowRight size={17} /></a>
          </div>
          <div className="ai-orbit" aria-hidden="true"><div className="ai-core">A</div><span /><i /></div>
        </article>

        <article id="markets" className="market-panel">
          <div className="panel-heading"><h2>Live Market Overview</h2><div><span>Crypto</span><span>Forex</span><span>Metals</span><span>Equities</span></div></div>
          <div className="market-list">
            {marketQuery.isLoading ? (
              [1,2,3,4,5].map((i) => <div key={i} className="market-row animate-pulse"><span /><b className="h-3 rounded bg-white/5" /><span className="h-3 rounded bg-white/5" /><em className="h-3 rounded bg-white/5" /></div>)
            ) : markets.length ? (
              markets.slice(0, 5).map((m: any, i: number) => (
                <div className="market-row" key={m.id ?? m.symbol}>
                  <span className="coin">{m.symbol?.slice(0, 1) ?? "•"}</span>
                  <b>{m.symbol} <small>{m.assetClass}</small></b>
                  <span>{Number(m.price).toLocaleString()}</span>
                  <em className={Number(m.changePct) >= 0 ? "text-emerald-300" : "text-rose-300"}>{Number(m.changePct) >= 0 ? "+" : ""}{Number(m.changePct).toFixed(2)}%</em>
                  <Sparkline n={i} />
                  <Link to="/trade">Trade</Link>
                </div>
              ))
            ) : (
              <div className="px-3 py-8 text-center text-[10px] font-semibold tracking-[.2em] text-slate-500">WAITING FOR LIVE MARKET QUOTES</div>
            )}
          </div>
            ))}
          </div>
          <a className="outline-action panel-action" href="#markets">View All Markets <ArrowRight size={16} /></a>
        </article>
      </section>

      <section className="lower-grid section-wrap">
        <article id="copy"><div className="panel-heading"><h3>Top Performing Traders</h3><a href="#copy">View All →</a></div>
          {["Quantum Trend", "Alpha Scalper", "Macro Master", "Gold Runner"].map((name, i) => <div className="trader" key={name}><span>{i + 1}</span><div className="avatar">{name[0]}</div><b>{name}</b><em>+{[42.8, 28.1, 35.4, 24.6][i]}%</em><Sparkline n={i} /><a href="#start">Follow</a></div>)}
        </article>
        <article id="community" className="community"><h3>Global Community</h3><p>Join 10K+ traders worldwide.</p><div className="people"><span>A</span><span>M</span><span>R</span><b>10K+</b></div><h4>Traders. Creators. Innovators.<br />A stronger tomorrow.</h4><a className="primary-action" href="#start">Join the Community <ArrowRight size={17} /></a></article>
        <article id="wallet" className="devices"><h3>Trade Anywhere</h3><p>Seamless access on all your devices.</p><div className="device-art"><span /><span /><span /></div><ul>{["Web Platform", "iOS App", "Android App", "Connect Wallet"].map(x => <li key={x}><Check size={14} />{x}</li>)}</ul><a className="outline-action" href="#start">Start Trading Anywhere <ArrowRight size={16} /></a></article>
      </section>

      <section id="start" className="closing">
        <img src={worldAsset.url} alt="Alphentra's connected global trading network" />
        <div><p className="eyebrow">Be part of something bigger</p><h2>Traders. Creators. Innovators.</h2><p>A global movement for a brighter financial future.</p><a className="primary-action" href="#top">Get Started <ArrowRight size={18} /></a></div>
      </section>

      <footer>
        <Brand />
        <div><b>Product</b><a href="#products">Features</a><a href="#markets">Markets</a><a href="#strategies">Pricing</a></div>
        <div><b>Resources</b><a href="#products">Documentation</a><a href="#community">Help Center</a><a href="#community">Community</a></div>
        <div><b>Company</b><a href="#top">About</a><a href="#top">Careers</a><a href="#top">Contact</a></div>
        <div><b>Legal</b><a href="#top">Risk Disclosure</a><a href="#top">Terms of Service</a><a href="#top">Privacy Policy</a></div>
        <p>© 2026 Alphentra. All rights reserved.</p>
      </footer>
    </main>
  );
}