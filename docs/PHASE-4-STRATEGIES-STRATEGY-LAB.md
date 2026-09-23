# ALPHENTRA — Phase 4: Strategies + Strategy Lab

Branch: `PHASE-4-Strategies-Strategy-Lab`  
Working implementation: `PHASE-4-WIP-20`

## Phase 4 implementation status

Phase 4 now covers the complete build → backtest → stress → paper forward-test → publish-gate workflow. Publication remains locked until evidence requirements are satisfied.

### Completed

- Structured no-code Strategy Rule Builder
  - Entry/exit conditions
  - AND / OR logic
  - EMA, SMA, RSI, MACD, ATR and price expressions
  - Stop loss, take profit and trailing stop
  - Risk-per-trade and position sizing
- Versioned strategy definition storage.
- Supabase strategy-lab schema and six starter templates.
- Deterministic condition engine with validation.
- Real MT5 historical candle loading from the dynamic live universe.
- Hardened backtest engine:
  - Fees and slippage
  - Risk-based/fixed/volatility-adjusted sizing
  - Stop loss / take profit / trailing stop
  - End-of-data position reconciliation
  - Equity curve with cash, realized/unrealized P&L and drawdown
  - Annualized return, volatility, Sharpe, Sortino, profit factor, expectancy, risk/reward, recovery factor and Calmar ratio
- Canonical Supabase persistence:
  - `backtests`
  - `backtest_trades`
  - `backtest_equity_snapshots`
  - `backtest_metrics`
- Strategy persistence for authenticated users through `traders`, `strategies`, and `strategy_versions`.
- Deterministic MT5 stress testing:
  - Fee shock
  - Slippage shock
  - Volatility shock
  - Adverse drift
- Paper forward-test persistence and cycle execution.
- Paper-only forward execution through the existing authenticated paper-order RPC.
- Evidence-based publish gates; no automatic production publication.
- AI Strategy Builder edge function and Strategy Lab integration.
  - Uses OpenRouter through the `OPENROUTER_API_KEY` Supabase function secret.
  - Defaults to the OpenRouter `openrouter/free` router for development; the model can be overridden with `OPENROUTER_STRATEGY_MODEL`.
  - Generated definitions are validated before entering backtest.
  - AI output is treated as a strategy hypothesis, not a profitability guarantee.

## Data and execution boundaries

- MT5 remains the market-data source.
- Instruments are resolved dynamically; no strategy code hardcodes the trading universe.
- Strategy Lab never sends live broker/MT5 orders.
- Forward testing uses the authenticated ALPHENTRA paper execution path only.
- A backtest must complete before stress testing.
- Stress testing must complete before forward-test progression.
- A forward-test cycle must be recorded before the publish-gate screen can be entered.
- Production publication remains locked until the required observation period is actually met.

## Database hardening

Migration `027_phase4_backtest_persistence_hardening.sql` adds authenticated owner-only write/delete policies for backtest child rows and metrics.

Migration `028_strategy_forward_tests.sql` adds owner-scoped forward-test sessions and event history.

## Remaining Phase 4 work

1. Verify the deployed OpenRouter AI Strategy Builder end-to-end from Strategy Lab.
2. Complete an actual forward observation window using paper execution and record evidence.
3. Run final application build/QA and reconcile any TypeScript/runtime issues.
4. Raise the final Phase 4 PR to the requested `main` branch only.

## AI provider

- OpenRouter is used for the Phase 4 development AI provider.
- The provider key is stored only as a Supabase Edge Function secret; it is never exposed to the browser.
- The frontend continues to call the existing `ai-strategy-builder` Edge Function, so Strategy Lab and backtesting contracts remain unchanged.

## Important

Backtest and stress-test results are measurements of historical/synthetic scenarios. They are not guarantees of future profitability.
