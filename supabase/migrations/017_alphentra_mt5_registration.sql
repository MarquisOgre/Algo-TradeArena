-- Alphentra Database Migration 017
-- Secure authenticated registration for MetaTrader 5 broker accounts.
-- MT5 credentials are intentionally NOT stored in the database.

create or replace function public.register_mt5_account(
  p_broker_name text,
  p_account_name text,
  p_account_identifier text,
  p_server_name text,
  p_environment text default 'demo'
)
returns table (
  broker_account_id uuid,
  mt5_account_id uuid
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_profile_id uuid;
  v_broker_id uuid;
  v_mt5_id uuid;
begin
  v_profile_id := auth.uid();

  if v_profile_id is null then
    raise exception 'Authentication required';
  end if;

  if nullif(trim(p_broker_name), '') is null then
    raise exception 'Broker name is required';
  end if;

  if nullif(trim(p_account_name), '') is null then
    raise exception 'Account name is required';
  end if;

  if nullif(trim(p_account_identifier), '') is null then
    raise exception 'Account identifier is required';
  end if;

  if nullif(trim(p_server_name), '') is null then
    raise exception 'Server name is required';
  end if;

  if p_environment not in ('demo', 'live') then
    raise exception 'Environment must be demo or live';
  end if;

  if not exists (
    select 1
    from public.profiles
    where id = v_profile_id
      and is_active = true
  ) then
    raise exception 'Active Alphentra profile not found';
  end if;

  insert into public.broker_accounts (
    profile_id,
    broker_name,
    account_name,
    account_identifier,
    environment,
    status,
    base_currency
  )
  values (
    v_profile_id,
    trim(p_broker_name),
    trim(p_account_name),
    trim(p_account_identifier),
    p_environment,
    'pending',
    'USD'
  )
  on conflict (profile_id, broker_name, account_identifier)
  do update set
    account_name = excluded.account_name,
    environment = excluded.environment,
    status = 'pending',
    updated_at = now()
  returning id into v_broker_id;

  insert into public.mt5_accounts (
    broker_account_id,
    login_identifier,
    server_name,
    currency
  )
  values (
    v_broker_id,
    trim(p_account_identifier),
    trim(p_server_name),
    'USD'
  )
  on conflict (broker_account_id)
  do update set
    login_identifier = excluded.login_identifier,
    server_name = excluded.server_name,
    updated_at = now()
  returning id into v_mt5_id;

  broker_account_id := v_broker_id;
  mt5_account_id := v_mt5_id;
  return next;
end;
$$;

revoke all on function public.register_mt5_account(text, text, text, text, text) from public;
revoke all on function public.register_mt5_account(text, text, text, text, text) from anon;
grant execute on function public.register_mt5_account(text, text, text, text, text) to authenticated;

comment on function public.register_mt5_account(text, text, text, text, text)
is 'Registers an authenticated users MT5 broker/account metadata without storing MT5 credentials.';
