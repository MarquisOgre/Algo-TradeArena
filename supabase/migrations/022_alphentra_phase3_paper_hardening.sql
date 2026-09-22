-- Alphentra Phase 3 hardening
-- Paper Trading Account: remove legacy simulated instruments from the
-- tradable universe. Paper execution must use the live MT5 market universe.

update public.markets
set
  status = 'inactive',
  is_tradable = false,
  updated_at = now()
where exchange = 'ALPHENTRA-SIM';

comment on table public.portfolios is
  'User trading portfolios. Phase 3 uses Main Paper Account for database-backed paper execution; live broker execution is separate.';

-- Keep the paper account invariant explicit: one named paper account per user
-- is already enforced by portfolios(profile_id, name). This index additionally
-- guarantees that only one active Main Paper Account can exist if legacy data
-- is ever renamed.
create unique index if not exists portfolios_one_active_main_paper_idx
  on public.portfolios(profile_id)
  where name = 'Main Paper Account'
    and portfolio_type = 'paper'
    and is_active = true;
