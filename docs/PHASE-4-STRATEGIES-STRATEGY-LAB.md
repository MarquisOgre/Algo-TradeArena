# ALPHENTRA — Phase 4: Strategies + Strategy Lab

Branch: `PHASE-4-Strategies-Strategy-Lab`

## Phase 4 foundation started

Phase 4 builds the strategy lifecycle on top of the completed Phase 3 paper-trading foundation.

### Completed in this branch

- Structured no-code Strategy Rule Builder
  - Entry conditions
  - Exit conditions
  - AND / OR logic
  - Indicator + period + comparator + operand
  - Stop loss
  - Take profit
  - Trailing stop
  - Risk-per-trade
  - Position-sizing method
- Strategy version model now carries a structured definition.
- Supabase migration `026_alphentra_strategy_lab.sql`
  - `strategy_conditions` normalized condition tree
  - `strategy_templates` platform-owned starter strategy catalog
  - Six initial strategy templates
  - RLS policies for user-owned strategy conditions
- Existing `strategies`, `strategy_versions`, `strategy_risk_profiles`, and `backtests` remain the lifecycle backbone.

## Phase 4 build sequence

1. Strategy definition + versioning
2. Rule/condition engine
3. Strategy templates
4. Risk controls and validation
5. Historical backtest execution
6. Backtest metrics/equity curve persistence
7. Paper forward testing
8. Strategy activation / publish gates
9. AI Strategy Builder (natural language → structured definition)
10. Phase 4 validation and PR

## Separation of concerns

Strategy creation and backtesting remain separate from broker execution. Phase 4 must not send live broker orders.

Market inputs continue to use the existing MT5 market-data foundation. Instruments are resolved from the live market universe rather than hardcoded into strategy code.

## Validation gate

Before opening the Phase 4 PR:

- Strategy definitions persist correctly.
- Versioning is immutable/auditable.
- Entry/exit conditions evaluate deterministically.
- Risk limits are enforced.
- Backtests use historical market data and persist reproducible results.
- Paper forward testing runs without live execution.
- Existing Phase 1–3 flows remain intact.
