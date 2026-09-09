# TRADE ARENA

Build the frontend foundation for a premium AI Trading Battle Platform called TRADEARENA.

IMPORTANT:

Frontend only.

No backend.

No real brokerage APIs.

No real-money trading.

No external API keys.

Use mock data only.

All trading must be simulated/paper trading.

Do not copy RockFlow's exact UI, branding, logo, text, or proprietary design.

Create an original premium fintech + competitive AI visual identity.

PRODUCT POSITIONING:

TRADEARENA
"Where AI Traders Compete."

The product combines:

AI trading agents

simulated trading

AI-vs-AI battles

leaderboards

tournaments

social discovery

market analytics

AI Copilot

paper portfolio

TECH STACK:

React

TypeScript

Tailwind CSS

React Router

shadcn/ui

Lucide icons

Recharts

Framer Motion

Create a clean reusable component architecture.

==================================================
APP SHELL

Create:

Desktop sidebar:

TRADEARENA logo

Navigation:

Home
Markets
Battle Arena
AI Agents
Tournaments
Discover
Leaderboard
Portfolio
AI Copilot

Bottom:

Settings
Help
Profile

Top header:

Global search
Market status
Notifications
Paper Trading badge
User avatar

Mobile:

Top header
Bottom navigation:

Home
Markets
Battle
Agents
Portfolio

Floating AI button.

==================================================
DESIGN

Dark-first premium fintech interface.

Background:
very dark navy/black.

Use:

electric blue

subtle violet

green for positive performance

red for negative performance

Do not overuse gradients.

Use glass effects sparingly.

Typography:
Inter.

Use strong typography for:
prices
ROI
P&L
rankings
statistics.

The interface should feel like:

premium fintech + AI + esports

NOT:
casino
crypto scam
generic SaaS dashboard

==================================================
ROUTES

Create working routes:

/
/markets
/battle
/battle/:id
/agents
/agents/:id
/agents/create
/tournaments
/tournaments/:id
/discover
/leaderboard
/portfolio
/trade
/ai
/profile
/settings
/login

For now, create placeholder pages for routes that will be implemented later.

Each placeholder should have:

proper page title

consistent layout

navigation

"Coming next" message

==================================================
REUSABLE COMPONENTS

Create:

AppShell
Sidebar
TopBar
MobileNavigation
PageHeader
StatCard
GlassCard
Badge
Button
Avatar
DataTable
ChartCard
AgentCard
BattleCard
TournamentCard

Keep components reusable.

==================================================
MOCK DATA

Create a centralized mock data structure.

Files:

src/data/mockAgents.ts
src/data/mockMarkets.ts
src/data/mockBattles.ts
src/data/mockTrades.ts
src/data/mockTournaments.ts
src/data/mockPortfolio.ts
src/data/mockPosts.ts

Populate them with realistic simulated data.

==================================================
PAPER TRADING

Add a persistent "PAPER TRADING" badge in the application.

Do not imply real trading.

==================================================
QUALITY

Make the app polished immediately.

No lorem ipsum.

No broken links.

No empty white screens.

Use responsive layouts.

Do not build backend functionality yet.

Start by implementing the design system, AppShell, routing, navigation and centralized mock data architecture.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/f8669fa1-4555-4a3f-b148-3cd9226228b9).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
