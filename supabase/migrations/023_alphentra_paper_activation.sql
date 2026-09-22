-- Alphentra Database Migration 023
-- Explicit Paper Trading Account activation.
--
-- Paper Trading is an ALPHENTRA-managed virtual account:
-- a profile does not receive virtual capital automatically. The user must
-- explicitly activate the Paper Trading Account before $100,000 is credited.
-- No broker/demo account is required for Paper Trading.

alter table public.portfolios
  add column if not exists account_status text not null default 'active',
  add column if not exists activated_at timestamptz;

alter table public.portfolios
  drop constraint if exists portfolios_account_status_check;

alter table public.portfolios
  add constraint portfolios_account_status_check
  check (account_status in ('not_activated', 'active', 'paused', 'closed'));

-- Accounts created by migration 013 were provisioned automatically. Keep their
-- historical rows intact but move them out of the active Paper Trading flow.
-- A fresh Main Paper Account will be created when the user explicitly activates.
update public.portfolios
set
  name = 'Legacy Paper Account',
  account_status = 'closed',
  is_active = false
where portfolio_type = 'paper'
  and name = 'Main Paper Account';

-- Future profile creation must only create notification preferences.
create or replace function public.handle_new_profile_defaults()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.notification_preferences (profile_id)
  values (new.id)
  on conflict (profile_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_profile_created_defaults on public.profiles;

create trigger on_profile_created_defaults
after insert on public.profiles
for each row execute function public.handle_new_profile_defaults();

comment on function public.handle_new_profile_defaults()
is 'Creates notification preferences for a new Alphentra profile. Paper Trading accounts are created only after explicit user activation.';

create or replace function public.activate_paper_account()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_portfolio public.portfolios%rowtype;
begin
  v_user_id := auth.uid();

  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  select *
  into v_portfolio
  from public.portfolios
  where profile_id = v_user_id
    and name = 'Main Paper Account'
    and portfolio_type = 'paper'
  limit 1
  for update;

  if v_portfolio.id is not null then
    if v_portfolio.account_status = 'active' and v_portfolio.is_active = true then
      return jsonb_build_object(
        'status', 'already_active',
        'portfolio_id', v_portfolio.id,
        'initial_cash', v_portfolio.initial_cash,
        'cash_balance', v_portfolio.cash_balance,
        'equity', v_portfolio.equity,
        'activated_at', v_portfolio.activated_at
      );
    end if;

    if v_portfolio.account_status not in ('not_activated', 'paused') then
      raise exception 'Paper Trading Account cannot be activated from status %', v_portfolio.account_status;
    end if;

    update public.portfolios
    set
      account_status = 'active',
      is_active = true,
      initial_cash = 100000,
      cash_balance = 100000,
      equity = 100000,
      realized_pnl = 0,
      unrealized_pnl = 0,
      total_fees = 0,
      activated_at = coalesce(activated_at, now()),
      updated_at = now()
    where id = v_portfolio.id
    returning * into v_portfolio;
  else
    insert into public.portfolios (
      profile_id,
      name,
      portfolio_type,
      base_currency,
      initial_cash,
      cash_balance,
      equity,
      realized_pnl,
      unrealized_pnl,
      total_fees,
      is_active,
      account_status,
      activated_at
    )
    values (
      v_user_id,
      'Main Paper Account',
      'paper',
      'USD',
      100000,
      100000,
      100000,
      0,
      0,
      0,
      true,
      'active',
      now()
    )
    returning * into v_portfolio;
  end if;

  return jsonb_build_object(
    'status', 'activated',
    'portfolio_id', v_portfolio.id,
    'initial_cash', v_portfolio.initial_cash,
    'cash_balance', v_portfolio.cash_balance,
    'equity', v_portfolio.equity,
    'activated_at', v_portfolio.activated_at
  );
end;
$$;

revoke all on function public.activate_paper_account() from public;
revoke all on function public.activate_paper_account() from anon;
grant execute on function public.activate_paper_account() to authenticated;

comment on function public.activate_paper_account()
is 'Explicitly creates or activates a users Main Paper Account and credits exactly $100,000 of virtual USD. Idempotent after activation.';

-- Paper Trading must only use an activated account.
create index if not exists portfolios_paper_activation_lookup_idx
  on public.portfolios(profile_id, portfolio_type, account_status)
  where portfolio_type = 'paper';
