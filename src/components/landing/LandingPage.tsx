import { useQuery } from "@tanstack/react-query";
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

const WORLD_ASSET =
  "https://alphentra-landing.lovable.app/__l5e/assets-v1/c727a4a5-bf70-4ea2-b5c5-f7f774796e4f/alphentra-world.png";
const LOGO_ASSET =
  "https://alphentra-landing.lovable.app/__l5e/assets-v1/eb9d9b7a-6dc2-4889-88ac-f4000c1850ab/alphentra-logo.png";

const ecosystem = [
  { icon: Bot, title: "AI Strategy Lab", copy: "Turn ideas into powerful strategies with AI.", tone: "cyan" },
  { icon: BarChart3, title: "Strategy Marketplace", copy: "Discover & subscribe to top strategies.", tone: "blue" },
  { icon: Users, title: "Copy Trading", copy: "Follow top traders with flexible controls.", tone: "violet" },
  { icon: Trophy, title: "Arena", copy: "Compete, climb leaderboards and win rewards.", tone: "gold" },
  { icon: Globe2, title: "Global Markets", copy: "Trade Forex, Crypto, Metals, Equities and more.", tone: "cyan" },
  { icon: Coins, title: "ALPH Economy", copy: "Real utility. Real value. A growing ecosystem.", tone: "gold" },
];

function Brand() {
  return (
    <a href="#top" className="brand" aria-label="Alphentra home">
      <img src={LOGO_ASSET} alt="Alphentra — Trade Beyond Limits" />
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

export function LandingPage() {
  const marketQuery = useQuery({
    queryKey: ["landing-market-board"],
    queryFn: loadMarketBoard,
    staleTime: 30_000,
    retry: 1,
  });

  const liveMarkets = (marketQuery.data ?? [])
    .filter((m) => m.providerStatus === "live" && Number(m.price) > 0)
    .slice(0, 6);

  return (
    <div className="lovable-landing">
      <main id="top" className="site-shell">
        <header className="topbar">
          <Brand />
          <nav aria-label="Main navigation">
            <a href="#products">Product</a>
            <a href="#strategies">Strategies</a>
            <a href="#copy">Copy Trading</a>
            <a href="#arena">Arena</a>
            <a href="#markets">Markets</a>
            <a href="#community">Community</a>
          </nav>
          <div className="nav-actions">
            <a className="icon-link" href="#markets" aria-label="Search"><Search size={18} /></a>
            <a className="outline-action" href="#wallet"><Wallet size={16} /> Connect Wallet</a>
            <a className="primary-action compact" href="/login">Get Started <ArrowRight size={17} /></a>
          </div>
        </header>

        <section className="hero" aria-labelledby="hero-title">
          <img className="hero-art" src={WORLD_ASSET} alt="A connected globe above a futuristic global city" />
          <div className="hero-shade" />
          <div className="hero-manifesto" aria-label="Alphentra community vision">
            <p>Traders<br />Creators<br />Innovators<br /><span>A Stronger<br />Tomorrow</span></p>
            <p>One<br />Global<br />Community</p>
          </div>
          <div className="global-market-badge">
            <span><Globe2 aria-hidden="true" /></span>
            <p><strong>GLOBAL MARKETS</strong><small>24/7 Opportunities</small></p>
          </div>
          <div className="hero-copy">
            <p className="eyebrow">Discipline today. <span>Freedom tomorrow.</span></p>
            <h1 id="hero-title">TRADE<br />BEYOND <em>LIMITS</em></h1>
            <p className="hero-lede">A global trading ecosystem for traders, creators and investors. Build strategies. Copy top traders. Compete. Earn.</p>
            <div className="hero-actions">
              <a className="primary-action" href="/login">Get Started <ArrowRight size={18} /></a>
              <a className="watch-action" href="#products"><Play size={16} fill="currentColor" /> Watch Demo</a>
            </div>
            <div className="hero-stats">
              <div><strong>10K+</strong><span>Active Traders</span></div>
              <div><strong>1,200+</strong><span>Trading Strategies</span></div>
              <div><strong>$50M+</strong><span>Simulated Volume</span></div>
              <div><strong>100+</strong><span>Countries</span></div>
            </div>
          </div>
          <div className="hero-pills" aria-label="Platform benefits">
            <div><Bot /><span><b>Build</b>with AI</span></div>
            <div><BarChart3 /><span><b>Trade</b>Global Markets</span></div>
            <div><Users /><span><b>Copy</b>Top Traders</span></div>
            <div><Trophy /><span><b>Compete</b>in Arena</span></div>
            <div><Coins /><span><b>Earn</b>with ALPH</span></div>
          </div>
        </section>

        <div className="ticker" aria-label="Live market ticker">
          {marketQuery.isLoading ? (
            <div className="ticker-status">LOADING LIVE MARKET QUOTES</div>
          ) : liveMarkets.length ? (
            liveMarkets.slice(0, 4).map((m: any, i: number) => (
              <div key={m.id ?? m.symbol}>
                <b>{m.symbol}</b>
                <span>{Number(m.price).toLocaleString()}</span>
                <em className={Number(m.changePct) >= 0 ? "" : "negative"}>
                  {Number(m.changePct) >= 0 ? "+" : ""}{Number(m.changePct).toFixed(2)}%
                </em>
                <Sparkline n={i} />
              </div>
            ))
          ) : (
            <div className="ticker-status">WAITING FOR LIVE MARKET QUOTES</div>
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
              <a className="primary-action" href="/app">Try AI Strategy Lab <ArrowRight size={17} /></a>
            </div>
            <div className="ai-orbit" aria-hidden="true"><div className="ai-core">A</div><span /><i /></div>
          </article>

          <article id="markets" className="market-panel">
            <div className="panel-heading"><h2>Live Market Overview</h2><div><span>Crypto</span><span>Forex</span><span>Metals</span><span>Equities</span></div></div>
            <div className="market-list">
              {marketQuery.isLoading ? (
                [1, 2, 3, 4, 5].map((i) => <div key={i} className="market-row"><span className="coin">•</span><b>Loading</b><span>—</span><em>—</em><Sparkline n={i} /><span /></div>)
              ) : liveMarkets.length ? (
                liveMarkets.slice(0, 5).map((m: any, i: number) => (
                  <div className="market-row" key={m.id ?? m.symbol}>
                    <span className="coin">{m.symbol?.slice(0, 1) ?? "•"}</span>
                    <b>{m.symbol} <small>{m.assetClass}</small></b>
                    <span>{Number(m.price).toLocaleString()}</span>
                    <em className={Number(m.changePct) >= 0 ? "" : "negative"}>{Number(m.changePct) >= 0 ? "+" : ""}{Number(m.changePct).toFixed(2)}%</em>
                    <Sparkline n={i} />
                    <a href="/trade">Trade</a>
                  </div>
                ))
              ) : (
                <div className="market-empty">WAITING FOR LIVE MARKET QUOTES</div>
              )}
            </div>
            <a className="outline-action panel-action" href="#markets">View All Markets <ArrowRight size={16} /></a>
          </article>
        </section>

        <section className="lower-grid section-wrap">
          <article id="copy"><div className="panel-heading"><h3>Top Performing Traders</h3><a href="#copy">View All →</a></div>
            {["Quantum Trend", "Alpha Scalper", "Macro Master", "Gold Runner"].map((name, i) => <div className="trader" key={name}><span>{i + 1}</span><div className="avatar">{name[0]}</div><b>{name}</b><em>+{[42.8, 28.1, 35.4, 24.6][i]}%</em><Sparkline n={i} /><a href="/app">Follow</a></div>)}
          </article>
          <article id="community" className="community"><h3>Global Community</h3><p>Join 10K+ traders worldwide.</p><div className="people"><span>A</span><span>M</span><span>R</span><b>10K+</b></div><h4>Traders. Creators. Innovators.<br />A stronger tomorrow.</h4><a className="primary-action" href="/app">Join the Community <ArrowRight size={17} /></a></article>
          <article id="wallet" className="devices"><h3>Trade Anywhere</h3><p>Seamless access on all your devices.</p><div className="device-art"><span /><span /><span /></div><ul>{["Web Platform", "iOS App", "Android App", "Connect Wallet"].map(x => <li key={x}><Check size={14} />{x}</li>)}</ul><a className="outline-action" href="/app">Start Trading Anywhere <ArrowRight size={16} /></a></article>
        </section>

        <section id="start" className="closing">
          <img src={WORLD_ASSET} alt="Alphentra's connected global trading network" />
          <div><p className="eyebrow">Be part of something bigger</p><h2>Traders. Creators. Innovators.</h2><p>A global movement for a brighter financial future.</p><a className="primary-action" href="/login">Get Started <ArrowRight size={18} /></a></div>
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
    </div>
  );
}
