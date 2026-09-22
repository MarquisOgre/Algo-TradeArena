# Phase 3 — Paper Trading

## Account model

ALPHENTRA Paper Trading is a **Pepperstone MetaTrader 5 Demo account**, not an internal simulated cash account.

- Paper Trading → **Pepperstone MT5 Demo**
- Live Trading → **Pepperstone MT5 Live**
- ALPN Wallet → separate from both trading accounts
- MT5 credentials never enter the browser or Supabase tables.

The screenshot-confirmed development account is the Pepperstone MT5 Demo account. The MT5 terminal/bridge is the source of truth for demo balance, equity, margin, positions and executions.

Pepperstone's MT5 demo environment provides virtual funds and live market access for practice; the demo account can be configured/funded with virtual funds through Pepperstone. citeturn0search1turn0search0

## Paper Trading activation

A user must explicitly connect/register their **Pepperstone MT5 Demo** account before Paper Trading becomes available.

ALPHENTRA must not silently create a synthetic $100,000 ledger.

If we want the development demo to start at exactly **$100,000**, the Pepperstone MT5 Demo account itself should be created/funded with $100,000 virtual funds. ALPHENTRA then displays and uses the actual MT5 balance rather than maintaining a second balance.

## Execution boundary

Paper orders must be routed to the connected Pepperstone MT5 Demo terminal using the MT5 bridge. The existing database paper-execution RPC is a legacy prototype and must not be used as the production Paper Trading execution path.

MT5's Python integration supports server-side order submission through `order_send()`; the next execution milestone will add a secured order queue between ALPHENTRA, the MT5 gateway and the Pepperstone Demo terminal. citeturn3search0

## Live Trading

Live Trading is a completely separate environment:

```
ALPHENTRA Paper Trading
        ↓
Pepperstone MT5 Demo
        ↓
Virtual funds / demo execution

ALPHENTRA Live Trading
        ↓
Pepperstone MT5 Live
        ↓
Real broker account / live execution
```

The Live MT5 environment remains disabled until explicit live authorization and the live execution safeguards are implemented.

## Current Phase 3 status

Completed:
- Separate Paper Trading and Live Trading navigation
- MT5 broker/account registration foundation
- MT5 Demo/Live account metadata model
- MT5 market-data bridge
- Pepperstone Demo role guard in the bridge
- Database execution guard for the legacy paper ledger

Next:
1. Replace the legacy paper execution path with an MT5 Demo order queue.
2. Synchronize demo orders/deals/positions back into ALPHENTRA.
3. Make the Paper Trading dashboard display MT5 Demo balance/equity/margin.
4. Keep Live MT5 order routing disabled until the dedicated Live Trading phase.
