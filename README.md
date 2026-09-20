# ALPHENTRA

**Build. Test. Compete. Trade.**

ALPHENTRA is a frontend prototype for an AI-powered trading ecosystem where users can **build, test, trade, copy, compete, and earn** through strategy-driven workflows.

> **Build → Test → Trade → Copy → Compete → Earn**

## Prototype Scope

The current application is **frontend-only**.

- No backend
- No real brokerage execution
- No real-money trading
- No live copy-trading execution
- No real ALPH transactions
- No real ALPH purchases
- Paper/simulated trading only
- Simulated/backtest results are clearly labelled
- Prototype strategy state can be persisted in browser local storage
- No external API keys are required

Real financial, wallet, payment, custody, token, broker, and regulated functionality belongs to later production phases.

---

## Product Pillars

### 1. Strategy Lab

Primary lifecycle:

```
Build
  ↓
Backtest
  ↓
Stress Test
  ↓
Forward Test
  ↓
Publish
```

The frontend supports the Strategy Lab concept with:

- Strategy definition
- Strategy styles
- Entry/exit specification
- Markets
- Risk limit
- Backtest metrics
- Stress-test state
- Paper forward testing
- Strategy versions
- Save Strategy Locally
- Prototype validation states

Target production capabilities include an AI strategy builder, rules engine, optimization, historical data, stress testing, Monte Carlo analysis, and out-of-sample validation.

### 2. Strategy Marketplace

`/strategies` and `/strategies/:id`

Users can discover prototype strategies and inspect:

- Creator
- Strategy style
- Status
- Versions
- Simulated return
- Drawdown
- Win rate
- Sharpe
- Followers
- Markets
- Risk
- Strategy lifecycle

Prototype actions include Follow, Subscribe, Copy Strategy, and Enter Arena.

### 3. Copy Trading

Copy Trading is a first-class product pillar.

Routes:

- `/copy`
- `/copy/:strategyId`

Current prototype flow:

```
Discover Strategy
      ↓
View Strategy
      ↓
Copy Strategy
      ↓
Configure Allocation
      ↓
Choose Copy Ratio
      ↓
Choose Risk Mode
      ↓
Set Maximum Drawdown
      ↓
Start Paper Copy
```

The Copy Trading concept includes:

- Discover strategies
- My Copies
- Copy allocation
- Copy ratio
- Conservative/Balanced/Full Risk modes
- Maximum drawdown guard
- Stop-copy conditions
- Copy performance
- Copy history
- Creator subscriptions
- ALPH payment context

Future Copy Trading infrastructure will include:

- Signal replication
- Portfolio allocation
- Copy-risk engine
- Exposure/concentration checks
- Slippage handling
- Broker execution
- MT5 execution
- Live copy monitoring
- Kill switches and reconciliation

### 4. Markets

`/markets`

Prototype asset classes:

- Forex
- Crypto
- Metals
- Equities
- ETFs

The UI includes market-session awareness:

- Weekdays: Forex, Crypto, Metals active
- Weekends: Crypto and Metals active; Forex closed

Production requires instrument/venue-specific calendars, holidays, sessions, and live market data.

### 5. Trade

`/trade`

Paper trading terminal concept with:

- Instrument selection
- Buy/sell controls
- Position sizing
- Paper orders
- Session awareness
- Paper balance
- Portfolio context

Production requires live market data, execution, broker adapters, reconciliation, and risk controls.

### 6. Arena

`/battle` and `/battle/:id`

Strategy competition environment.

Prototype flow:

```
Select Strategy
      ↓
Check Eligibility
      ↓
Enter Arena
      ↓
Competition
```

Eligible strategies can be selected from Strategy detail pages.

### 7. Competitions

`/tournaments` and `/tournaments/:id`

Competition concepts include:

- Entry rules
- Strategy eligibility
- Duration
- Starting balance
- Risk rules
- Drawdown limits
- Leaderboards
- Prize/reward pools
- Competition history

ALPH entry/reward values in the prototype are simulated.

### 8. Leaderboard

`/leaderboard`

Prototype AI strategy rankings using simulated competition/performance data.

### 9. ALPHENTRA Wallet

`/wallet`

The wallet is the prototype economic hub.

Current actions:

- **Buy ALPH** — prototype flow
- **Sell ALPH** — Coming Soon
- **Send ALPH** — Coming Soon
- **Receive ALPH** — Coming Soon
- Competition credits
- Recent activity
- Competition rewards
- Strategy payment context
- Future staking/utility context

Buy ALPH currently opens a prototype purchase experience only. No real payment or token transfer occurs.

Future wallet architecture:

```
Buy ALPH
   ↓
ALPH Wallet
   ├── Strategy Subscriptions
   ├── Arena Entry
   ├── Competition Entry
   ├── Premium Features
   ├── Creator Payments
   └── Competition Rewards
```

### 10. Crypto Wallet Connection

The top header includes **Connect Wallet**.

The prototype wallet selector covers a small curated set of common wallets:

- MetaMask
- WalletConnect
- Coinbase Wallet
- Trust Wallet

Connection is simulated and does not authorize blockchain transactions.

### 11. MetaTrader 5 Connection

The top header includes **Connect MT5**.

The prototype explains future capabilities:

- Broker account linking
- Account/equity synchronization
- Order execution
- Live Copy Trading

MT5 is currently **Coming Soon** and does not connect to a broker.

### 12. AI Copilot

`/ai`

Prototype AI assistant for:

- Strategy questions
- Market explanations
- Competition information
- Portfolio context
- Product guidance
- Risk education

Live AI services are a future integration.

### 13. Discover & Traders

Routes:

- `/discover`
- `/traders`

Community/discovery concepts include:

- Creator discovery
- Following
- Strategy notes
- AI strategy discovery
- Creator profiles

### 14. Portfolio

`/portfolio`

Paper trading account with simulated positions, performance, and portfolio analytics.

### 15. Profile / Settings / Help

Routes:

- `/profile`
- `/settings`
- `/help`

Profile includes account/strategy activity.

Settings includes paper-trading and future broker connection settings.

Help contains product and prototype FAQs.

Profile, Settings, and Help are exposed through the shared **User Menu** in both the top header and sidebar bottom.

---

## Core User Journey

```
Build Strategy
      ↓
Backtest
      ↓
Stress Test
      ↓
Forward Test
      ↓
Publish
      ↓
Strategy Marketplace
      ↓
Follow / Subscribe
      ↓
Copy Strategy
      ↓
Paper Copy Trading
      ↓
Arena
      ↓
Competitions
      ↓
ALPH Rewards
      ↓
Creator Economy
```

---

## Header Connectivity

The top header contains:

- Global search
- Market status
- Connect Wallet
- Connect MT5
- Paper Trading badge
- Notifications
- User Menu

The connectivity buttons are intentionally separated:

**Crypto Wallet**

Used for future ALPH/token ecosystem functions.

**MetaTrader 5**

Used for future broker-linked trading and live copy execution.

A crypto wallet connection does not imply exchange connectivity.

---

## ALPH Economy

Proposed ALPH utility:

- Competition entry
- Competition rewards
- Strategy subscriptions
- Marketplace fees
- Premium AI features
- Creator tools
- Potential future fee discounts
- Future staking/reward mechanisms subject to final design and review

The frontend does not currently issue, custody, transfer, or sell a real token.

---

## Creator Economy

Future creator monetization can support:

- Strategy subscriptions
- Performance-based models
- Hybrid subscription/performance models
- Creator analytics
- Earnings
- Payouts
- Premium strategy tools

Exact fee splits are intentionally not hard-coded yet.

---

## Production Domain Model

Target entities include:

```
users
traders
strategies
strategy_versions
backtests
backtest_trades
portfolios
positions
orders
markets
competitions
competition_entries
leaderboards
followers
subscriptions
copy_trading
copy_trading_allocations
copy_trading_events
creator_earnings
wallets
transactions
broker_accounts
notifications
strategy_signals
strategy_risk_profiles
copy_risk_checks
market_data
execution_events
competition_rewards
payment_orders
audit_logs
```

---

## Production Architecture Direction

```
Frontend
   ↓
API Layer
   ↓
Application Services
   ├── Users
   ├── Strategies
   ├── Backtesting
   ├── Market Data
   ├── Paper Trading
   ├── Copy Trading
   ├── Competitions
   ├── Marketplace
   ├── Wallet
   └── Notifications
   ↓
Data / Event Infrastructure
   ↓
External Providers
   ├── Market Data
   ├── Brokers / MT5
   ├── Wallet Infrastructure
   └── Payment / Regulated Providers
```

---

## Current Route Map

```
/
/markets
/trade

/lab
/strategies
/strategies/:id

/copy
/copy/:strategyId

/agents
/agents/:id
/agents/create

/battle
/battle/:id

/tournaments
/tournaments/:id

/discover
/traders
/leaderboard

/portfolio
/wallet

/ai
/profile
/settings
/help
/login
```

The `agents`, `battle`, and `tournaments` routes are retained during the architecture transition. The target terminology is:

```
AI Strategy → Arena → Competition
```

Legacy Agent/Battle/Tournament concepts will be progressively consolidated into the Strategy architecture.

---

## Prototype State

Strategy persistence currently uses browser local storage.

Example state keys:

```
alphentra.strategies.v1
alphentra.arena.selectedStrategyId
alphentra.arena.entry.*
```

This is temporary frontend state and will be replaced by authenticated backend state.

---

## Technology

- React
- TypeScript
- TanStack Start
- TanStack Router
- Tailwind CSS
- Recharts
- Framer Motion
- Lucide
- React Query
- Zod
- Vite

---

## Reusable UI Architecture

Core components include:

- AppShell
- Sidebar
- TopBar
- MobileNavigation
- UserMenu
- HeaderConnections
- Footer
- PageHeader
- StatCard
- GlassCard
- Badge
- Button
- Avatar
- DataTable
- ChartCard
- Strategy cards
- Battle/Arena cards
- Competition cards

---

## Compliance & Safety Direction

The prototype must clearly distinguish simulated product flows from live financial functionality.

Principles:

- No guaranteed returns
- Clearly label simulated/backtested/paper results
- Clearly label prototype ALPH balances
- Do not represent ALPH as currently purchasable when live infrastructure is not active
- Do not represent Copy Trading as live execution when it is simulated
- Use appropriate risk disclosures
- Complete legal/regulatory review before live token, payment, custody, broker, or copy-trading functionality

For an Indonesia-focused launch, the applicable OJK digital financial asset/crypto framework and other relevant financial/payment rules must be reviewed before enabling real-asset functionality.

---

## Development

Install dependencies and run the frontend:

```sh
npm i
npm run dev
```

The frontend is designed to be developed independently while the future backend and integrations are being specified.

---

## Vision

ALPHENTRA is evolving toward a complete AI trading ecosystem:

```
BUILD
  ↓
TEST
  ↓
TRADE
  ↓
COPY
  ↓
COMPETE
  ↓
EARN
  ↓
ALPHENTRA ECONOMY
```

**ALPHENTRA**

> **Build. Test. Compete. Trade.**
