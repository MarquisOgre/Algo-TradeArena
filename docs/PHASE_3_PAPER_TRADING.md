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


### Explicit account activation

Paper Trading is intentionally separate from Live Trading.

- New profiles do **not** receive a Paper Trading account or virtual funds automatically.
- The user opens **Paper Trading** and explicitly selects **Activate Paper Trading Account**.
- Activation creates/activates the user's **Main Paper Account** with exactly **$100,000 virtual USD**.
- Before activation, there is no Paper Trading buying power and paper orders cannot execute.
- Paper Trading has its own cash, equity, positions, orders, executions and P&L.
- Live Trading is a separate account domain and will use the user's connected MT5/broker account; it never shares Paper Trading funds or positions.
- Accounts provisioned by the earlier automatic-default migration are retained as legacy records and are excluded from the active Paper Trading flow.
