# Phase 3 — Paper Trading Account

## Objective

Provide every authenticated ALPHENTRA user with a persistent paper-trading account backed by Supabase.

## Current architecture

- Default account: **Main Paper Account**
- Initial virtual capital: **$100,000 USD**
- Orders are persisted in `orders`
- Fills are persisted in `executions`
- Positions are persisted in `positions`
- Account state is persisted in `portfolios`
- Equity history is persisted in `portfolio_snapshots`
- Paper execution is atomic through `execute_paper_market_order`
- Paper execution never routes orders to a broker or exchange
- Market execution requires a fresh **MT5** quote in the Trade UI

## Phase 3 rules

1. No hard-coded simulated instrument should be presented as a live tradable market.
2. MT5 is the market-data source for paper execution.
3. A buy requires sufficient paper cash.
4. A sell requires an existing long position with sufficient quantity.
5. Client order IDs provide idempotency protection.
6. Portfolio cash, equity and P&L are updated atomically with the fill.
7. Users can only read their own paper account, positions, executions and snapshots.

## Phase 3 UI

- Trade page: live MT5 quote + paper order ticket
- Portfolio page: account value, P&L, cash, buying power, equity curve, allocation, open positions and trade history
- Navigation: Trade + Portfolio remain the primary paper-trading entry points

## Next Phase 3 increments

- Stop-loss / take-profit order fields and server-side trigger handling
- Pending order support
- More complete realized-P&L history
- Account reset/restart controls with explicit confirmation
- Paper trading performance analytics
- Stronger execution/risk validation based on MT5 symbol metadata
