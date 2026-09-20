-- Alphentra Database Migration 013
-- Default paper account provisioning for every new profile.

create or replace function public.handle_new_profile_defaults()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.portfolios (
    profile_id,
    name,
    portfolio_type,
    base_currency,
    initial_cash,
    cash_balance,
    equity
  )
  values (
    new.id,
    'Main Paper Account',
    'paper',
    'USD',
    100000,
    100000,
    100000
  )
  on conflict (profile_id, name) do nothing;

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
is 'Creates the default paper account and notification preferences for a new Alphentra profile.';
