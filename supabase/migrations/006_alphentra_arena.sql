-- Alphentra Database Migration 006
-- Arena competitions, entries, leaderboards, rankings and rewards.

create type public.competition_status as enum (
  'draft',
  'scheduled',
  'live',
  'completed',
  'cancelled'
);

create type public.competition_entry_status as enum (
  'registered',
  'active',
  'disqualified',
  'withdrawn',
  'completed'
);

create type public.reward_type as enum (
  'alph',
  'cash',
  'fee_credit',
  'custom'
);

create table public.competitions (
  id uuid primary key default gen_random_uuid(),
  created_by_profile_id uuid not null references public.profiles(id) on delete restrict,
  name text not null,
  slug text not null unique,
  description text,
  status public.competition_status not null default 'draft',
  asset_class public.market_asset_class,
  entry_fee numeric(30,12) not null default 0,
  entry_currency text not null default 'USD',
  prize_pool numeric(30,12) not null default 0,
  prize_currency text not null default 'USD',
  max_participants integer,
  starting_capital numeric(30,12) not null default 10000,
  start_time timestamptz not null,
  end_time timestamptz not null,
  rules jsonb not null default '{}'::jsonb,
  scoring_config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint competitions_name_not_blank check (char_length(trim(name)) > 0),
  constraint competitions_slug_length check (char_length(slug) between 3 and 80),
  constraint competitions_entry_fee_check check (entry_fee >= 0),
  constraint competitions_prize_pool_check check (prize_pool >= 0),
  constraint competitions_starting_capital_check check (starting_capital > 0),
  constraint competitions_dates_check check (end_time > start_time),
  constraint competitions_max_participants_check check (
    max_participants is null or max_participants > 0
  )
);

create table public.competition_entries (
  id uuid primary key default gen_random_uuid(),
  competition_id uuid not null references public.competitions(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  portfolio_id uuid references public.portfolios(id) on delete set null,
  strategy_id uuid references public.strategies(id) on delete set null,
  status public.competition_entry_status not null default 'registered',
  starting_capital numeric(30,12) not null,
  current_equity numeric(30,12) not null,
  return_pct numeric(18,8) not null default 0,
  realized_pnl numeric(30,12) not null default 0,
  unrealized_pnl numeric(30,12) not null default 0,
  max_drawdown_pct numeric(18,8) not null default 0,
  total_trades integer not null default 0,
  winning_trades integer not null default 0,
  rank integer,
  score numeric(30,12) not null default 0,
  joined_at timestamptz not null default now(),
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (competition_id, profile_id),
  constraint competition_entries_starting_capital_check check (starting_capital > 0),
  constraint competition_entries_equity_check check (current_equity >= 0),
  constraint competition_entries_drawdown_check check (max_drawdown_pct between 0 and 100),
  constraint competition_entries_counts_check check (
    total_trades >= 0 and winning_trades >= 0 and winning_trades <= total_trades
  ),
  constraint competition_entries_rank_check check (rank is null or rank > 0)
);

create table public.leaderboards (
  id uuid primary key default gen_random_uuid(),
  competition_id uuid not null references public.competitions(id) on delete cascade,
  entry_id uuid not null references public.competition_entries(id) on delete cascade,
  rank integer not null,
  score numeric(30,12) not null default 0,
  return_pct numeric(18,8) not null default 0,
  equity numeric(30,12) not null default 0,
  drawdown_pct numeric(18,8) not null default 0,
  trades integer not null default 0,
  snapshot_time timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint leaderboard_rank_check check (rank > 0),
  constraint leaderboard_equity_check check (equity >= 0),
  constraint leaderboard_drawdown_check check (drawdown_pct between 0 and 100),
  constraint leaderboard_trades_check check (trades >= 0),
  unique (competition_id, entry_id, snapshot_time)
);

create table public.competition_rewards (
  id uuid primary key default gen_random_uuid(),
  competition_id uuid not null references public.competitions(id) on delete cascade,
  entry_id uuid references public.competition_entries(id) on delete set null,
  rank_from integer,
  rank_to integer,
  reward_type public.reward_type not null,
  reward_amount numeric(30,12) not null,
  currency text,
  description text,
  awarded_at timestamptz,
  created_at timestamptz not null default now(),
  constraint rewards_rank_from_check check (rank_from is null or rank_from > 0),
  constraint rewards_rank_to_check check (rank_to is null or rank_to >= rank_from),
  constraint rewards_amount_check check (reward_amount >= 0)
);

create index competitions_status_time_idx
  on public.competitions(status, start_time);

create index competitions_creator_idx
  on public.competitions(created_by_profile_id, created_at desc);

create index competition_entries_competition_idx
  on public.competition_entries(competition_id, status);

create index competition_entries_profile_idx
  on public.competition_entries(profile_id, status);

create index competition_entries_rank_idx
  on public.competition_entries(competition_id, rank);

create index leaderboards_competition_snapshot_idx
  on public.leaderboards(competition_id, snapshot_time desc, rank);

create index leaderboards_entry_idx
  on public.leaderboards(entry_id, snapshot_time desc);

create index competition_rewards_competition_idx
  on public.competition_rewards(competition_id, rank_from);

create trigger competitions_set_updated_at
before update on public.competitions
for each row execute function public.set_updated_at();

create trigger competition_entries_set_updated_at
before update on public.competition_entries
for each row execute function public.set_updated_at();

alter table public.competitions enable row level security;
alter table public.competition_entries enable row level security;
alter table public.leaderboards enable row level security;
alter table public.competition_rewards enable row level security;

create policy "competitions_select_visible"
on public.competitions for select
to anon, authenticated
using (status in ('scheduled', 'live', 'completed') or created_by_profile_id = auth.uid());

create policy "competitions_insert_own"
on public.competitions for insert
to authenticated
with check (created_by_profile_id = auth.uid());

create policy "competitions_update_own"
on public.competitions for update
to authenticated
using (created_by_profile_id = auth.uid())
with check (created_by_profile_id = auth.uid());

create policy "competition_entries_select_own"
on public.competition_entries for select
to authenticated
using (
  profile_id = auth.uid()
  or competition_id in (
    select id from public.competitions where created_by_profile_id = auth.uid()
  )
);

create policy "competition_entries_insert_own"
on public.competition_entries for insert
to authenticated
with check (profile_id = auth.uid());

create policy "competition_entries_update_own"
on public.competition_entries for update
to authenticated
using (profile_id = auth.uid())
with check (profile_id = auth.uid());

create policy "leaderboards_select_public"
on public.leaderboards for select
to anon, authenticated
using (
  competition_id in (
    select id from public.competitions where status in ('scheduled', 'live', 'completed')
  )
);

create policy "competition_rewards_select_public"
on public.competition_rewards for select
to anon, authenticated
using (
  competition_id in (
    select id from public.competitions where status in ('scheduled', 'live', 'completed')
  )
);

comment on table public.competitions is 'Alphentra Arena trading competitions and their rules.';
comment on table public.competition_entries is 'Trader/user entries and live performance state within a competition.';
comment on table public.leaderboards is 'Historical and current competition rankings.';
comment on table public.competition_rewards is 'Competition prize definitions and awarded rewards.';
