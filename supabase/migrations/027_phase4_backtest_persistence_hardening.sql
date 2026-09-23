-- Alphentra Phase 4 backtest persistence hardening
-- Child-row write policies and metrics persistence for authenticated owners.

create policy "backtest_trades_insert_own"
on public.backtest_trades for insert
to authenticated
with check (
  backtest_id in (
    select id from public.backtests where profile_id = auth.uid()
  )
);

create policy "backtest_trades_delete_own"
on public.backtest_trades for delete
to authenticated
using (
  backtest_id in (
    select id from public.backtests where profile_id = auth.uid()
  )
);

create policy "backtest_equity_insert_own"
on public.backtest_equity_snapshots for insert
to authenticated
with check (
  backtest_id in (
    select id from public.backtests where profile_id = auth.uid()
  )
);

create policy "backtest_equity_delete_own"
on public.backtest_equity_snapshots for delete
to authenticated
using (
  backtest_id in (
    select id from public.backtests where profile_id = auth.uid()
  )
);

create policy "backtest_metrics_insert_own"
on public.backtest_metrics for insert
to authenticated
with check (
  backtest_id in (
    select id from public.backtests where profile_id = auth.uid()
  )
);

create policy "backtest_metrics_update_own"
on public.backtest_metrics for update
to authenticated
using (
  backtest_id in (
    select id from public.backtests where profile_id = auth.uid()
  )
)
with check (
  backtest_id in (
    select id from public.backtests where profile_id = auth.uid()
  )
);

create policy "backtest_metrics_delete_own"
on public.backtest_metrics for delete
to authenticated
using (
  backtest_id in (
    select id from public.backtests where profile_id = auth.uid()
  )
);

grant select, insert, update, delete on public.backtest_trades to authenticated;
grant select, insert, update, delete on public.backtest_equity_snapshots to authenticated;
grant select, insert, update, delete on public.backtest_metrics to authenticated;
