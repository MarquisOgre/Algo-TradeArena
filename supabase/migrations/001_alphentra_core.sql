-- Alphentra Database Migration 001
-- Core identity, trader, strategy, and risk-profile foundation.
-- Designed for Supabase PostgreSQL.

create extension if not exists pgcrypto;

create type public.app_role as enum ('user', 'trader', 'admin');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  display_name text,
  avatar_url text,
  bio text,
  country_code text,
  timezone text default 'UTC',
  role public.app_role not null default 'user',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_username_length check (username is null or char_length(username) between 3 and 30),
  constraint profiles_country_code_length check (country_code is null or char_length(country_code) = 2)
);

create table public.traders (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references public.profiles(id) on delete cascade,
  display_name text not null,
  public_slug text not null unique,
  headline text,
  description text,
  avatar_url text,
  is_public boolean not null default true,
  is_verified boolean not null default false,
  is_copy_trading_enabled boolean not null default false,
  followers_count integer not null default 0,
  total_aum numeric(24,8) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint traders_slug_length check (char_length(public_slug) between 3 and 60),
  constraint traders_followers_nonnegative check (followers_count >= 0),
  constraint traders_aum_nonnegative check (total_aum >= 0)
);

create table public.strategies (
  id uuid primary key default gen_random_uuid(),
  trader_id uuid not null references public.traders(id) on delete cascade,
  name text not null,
  slug text not null unique,
  short_description text,
  description text,
  strategy_type text not null default 'algorithmic',
  market_type text not null default 'multi_asset',
  status text not null default 'draft',
  visibility text not null default 'private',
  is_marketplace_listed boolean not null default false,
  is_copy_tradable boolean not null default false,
  base_currency text not null default 'USD',
  min_capital numeric(24,8),
  management_fee_bps integer not null default 0,
  performance_fee_bps integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint strategies_status_check check (status in ('draft', 'active', 'paused', 'archived')),
  constraint strategies_visibility_check check (visibility in ('private', 'unlisted', 'public')),
  constraint strategies_min_capital_check check (min_capital is null or min_capital >= 0),
  constraint strategies_management_fee_check check (management_fee_bps between 0 and 10000),
  constraint strategies_performance_fee_check check (performance_fee_bps between 0 and 10000)
);

create table public.strategy_versions (
  id uuid primary key default gen_random_uuid(),
  strategy_id uuid not null references public.strategies(id) on delete cascade,
  version_number integer not null,
  version_label text,
  definition jsonb not null default '{}'::jsonb,
  parameters jsonb not null default '{}'::jsonb,
  changelog text,
  is_live boolean not null default false,
  created_at timestamptz not null default now(),
  unique (strategy_id, version_number)
);

create table public.strategy_risk_profiles (
  id uuid primary key default gen_random_uuid(),
  strategy_id uuid not null unique references public.strategies(id) on delete cascade,
  max_drawdown_pct numeric(8,4),
  max_position_size_pct numeric(8,4),
  max_daily_loss_pct numeric(8,4),
  max_leverage numeric(12,4),
  stop_loss_pct numeric(8,4),
  take_profit_pct numeric(8,4),
  max_open_positions integer,
  risk_level text not null default 'moderate',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint risk_level_check check (risk_level in ('conservative', 'moderate', 'aggressive', 'custom')),
  constraint max_drawdown_check check (max_drawdown_pct is null or max_drawdown_pct between 0 and 100),
  constraint max_position_size_check check (max_position_size_pct is null or max_position_size_pct between 0 and 100),
  constraint max_daily_loss_check check (max_daily_loss_pct is null or max_daily_loss_pct between 0 and 100),
  constraint max_leverage_check check (max_leverage is null or max_leverage >= 0),
  constraint stop_loss_check check (stop_loss_pct is null or stop_loss_pct between 0 and 100),
  constraint take_profit_check check (take_profit_pct is null or take_profit_pct between 0 and 100),
  constraint max_open_positions_check check (max_open_positions is null or max_open_positions > 0)
);

create index traders_profile_id_idx on public.traders(profile_id);
create index traders_public_idx on public.traders(is_public, is_verified);
create index strategies_trader_id_idx on public.strategies(trader_id);
create index strategies_marketplace_idx on public.strategies(is_marketplace_listed, status);
create index strategies_copy_tradable_idx on public.strategies(is_copy_tradable, status);
create index strategy_versions_strategy_id_idx on public.strategy_versions(strategy_id);
create index strategy_versions_live_idx on public.strategy_versions(strategy_id, is_live);

-- Keep updated_at consistent without relying on application code.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger traders_set_updated_at
before update on public.traders
for each row execute function public.set_updated_at();

create trigger strategies_set_updated_at
before update on public.strategies
for each row execute function public.set_updated_at();

create trigger strategy_risk_profiles_set_updated_at
before update on public.strategy_risk_profiles
for each row execute function public.set_updated_at();

-- Create a profile automatically when a Supabase Auth user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- Row Level Security.
alter table public.profiles enable row level security;
alter table public.traders enable row level security;
alter table public.strategies enable row level security;
alter table public.strategy_versions enable row level security;
alter table public.strategy_risk_profiles enable row level security;

-- Profiles: users can read public profile fields and manage their own profile.
create policy "profiles_select_authenticated"
on public.profiles for select
to authenticated
using (true);

create policy "profiles_insert_own"
on public.profiles for insert
to authenticated
with check (auth.uid() = id);

create policy "profiles_update_own"
on public.profiles for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

-- Traders: public trader discovery, owner management.
create policy "traders_select_public"
on public.traders for select
to anon, authenticated
using (is_public = true or profile_id = auth.uid());

create policy "traders_insert_own"
on public.traders for insert
to authenticated
with check (profile_id = auth.uid());

create policy "traders_update_own"
on public.traders for update
to authenticated
using (profile_id = auth.uid())
with check (profile_id = auth.uid());

create policy "traders_delete_own"
on public.traders for delete
to authenticated
using (profile_id = auth.uid());

-- Strategies: public discovery for listed strategies; owners manage their own.
create policy "strategies_select_visible"
on public.strategies for select
to anon, authenticated
using (
  visibility = 'public'
  or trader_id in (
    select t.id from public.traders t where t.profile_id = auth.uid()
  )
);

create policy "strategies_insert_own"
on public.strategies for insert
to authenticated
with check (
  trader_id in (
    select t.id from public.traders t where t.profile_id = auth.uid()
  )
);

create policy "strategies_update_own"
on public.strategies for update
to authenticated
using (
  trader_id in (
    select t.id from public.traders t where t.profile_id = auth.uid()
  )
)
with check (
  trader_id in (
    select t.id from public.traders t where t.profile_id = auth.uid()
  )
);

create policy "strategies_delete_own"
on public.strategies for delete
to authenticated
using (
  trader_id in (
    select t.id from public.traders t where t.profile_id = auth.uid()
  )
);

create policy "strategy_versions_select"
on public.strategy_versions for select
to anon, authenticated
using (
  is_live = true
  or strategy_id in (
    select s.id
    from public.strategies s
    join public.traders t on t.id = s.trader_id
    where t.profile_id = auth.uid()
  )
);

create policy "strategy_versions_insert_own"
on public.strategy_versions for insert
to authenticated
with check (
  strategy_id in (
    select s.id
    from public.strategies s
    join public.traders t on t.id = s.trader_id
    where t.profile_id = auth.uid()
  )
);

create policy "strategy_versions_update_own"
on public.strategy_versions for update
to authenticated
using (
  strategy_id in (
    select s.id
    from public.strategies s
    join public.traders t on t.id = s.trader_id
    where t.profile_id = auth.uid()
  )
)
with check (
  strategy_id in (
    select s.id
    from public.strategies s
    join public.traders t on t.id = s.trader_id
    where t.profile_id = auth.uid()
  )
);

create policy "strategy_versions_delete_own"
on public.strategy_versions for delete
to authenticated
using (
  strategy_id in (
    select s.id
    from public.strategies s
    join public.traders t on t.id = s.trader_id
    where t.profile_id = auth.uid()
  )
);

create policy "strategy_risk_profiles_select"
on public.strategy_risk_profiles for select
to anon, authenticated
using (
  strategy_id in (
    select s.id
    from public.strategies s
    where s.visibility = 'public'
    or s.trader_id in (
      select t.id from public.traders t where t.profile_id = auth.uid()
    )
  )
);

create policy "strategy_risk_profiles_insert_own"
on public.strategy_risk_profiles for insert
to authenticated
with check (
  strategy_id in (
    select s.id
    from public.strategies s
    join public.traders t on t.id = s.trader_id
    where t.profile_id = auth.uid()
  )
);

create policy "strategy_risk_profiles_update_own"
on public.strategy_risk_profiles for update
to authenticated
using (
  strategy_id in (
    select s.id
    from public.strategies s
    join public.traders t on t.id = s.trader_id
    where t.profile_id = auth.uid()
  )
)
with check (
  strategy_id in (
    select s.id
    from public.strategies s
    join public.traders t on t.id = s.trader_id
    where t.profile_id = auth.uid()
  )
);

comment on table public.profiles is 'Alphentra user profile linked to Supabase Auth.';
comment on table public.traders is 'Public trader/creator identity and discovery profile.';
comment on table public.strategies is 'Trading strategy definition and marketplace metadata.';
comment on table public.strategy_versions is 'Versioned strategy definitions and parameters.';
comment on table public.strategy_risk_profiles is 'Risk constraints used by backtesting and future live/copy execution.';
