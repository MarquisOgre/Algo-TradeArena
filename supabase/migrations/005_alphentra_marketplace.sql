-- Alphentra Database Migration 005
-- Strategy marketplace, subscriptions, creator earnings and platform revenue.

create type public.listing_status as enum (
  'draft',
  'published',
  'paused',
  'archived'
);

create type public.subscription_status as enum (
  'pending',
  'active',
  'paused',
  'cancelled',
  'expired'
);

create type public.billing_interval as enum (
  'monthly',
  'quarterly',
  'yearly',
  'one_time'
);

create type public.earning_status as enum (
  'pending',
  'available',
  'paid',
  'reversed'
);

create table public.strategy_listings (
  id uuid primary key default gen_random_uuid(),
  strategy_id uuid not null unique references public.strategies(id) on delete cascade,
  trader_id uuid not null references public.traders(id) on delete cascade,
  status public.listing_status not null default 'draft',
  title text not null,
  tagline text,
  description text,
  category text,
  tags text[] not null default '{}',
  price numeric(30,12) not null default 0,
  billing_interval public.billing_interval not null default 'monthly',
  platform_fee_bps integer not null default 1000,
  minimum_subscription_amount numeric(30,12),
  performance_fee_bps integer not null default 0,
  risk_disclosure text,
  terms jsonb not null default '{}'::jsonb,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint listings_title_not_blank check (char_length(trim(title)) > 0),
  constraint listings_price_check check (price >= 0),
  constraint listings_platform_fee_check check (platform_fee_bps between 0 and 10000),
  constraint listings_min_subscription_check check (
    minimum_subscription_amount is null or minimum_subscription_amount >= 0
  ),
  constraint listings_performance_fee_check check (performance_fee_bps between 0 and 10000)
);

create table public.strategy_subscriptions (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.strategy_listings(id) on delete restrict,
  strategy_id uuid not null references public.strategies(id) on delete restrict,
  subscriber_profile_id uuid not null references public.profiles(id) on delete cascade,
  status public.subscription_status not null default 'pending',
  billing_interval public.billing_interval not null,
  price numeric(30,12) not null default 0,
  currency text not null default 'USD',
  started_at timestamptz,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancelled_at timestamptz,
  expires_at timestamptz,
  external_subscription_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint subscriptions_price_check check (price >= 0),
  constraint subscriptions_period_check check (
    current_period_end is null or current_period_start is null
    or current_period_end > current_period_start
  ),
  unique (listing_id, subscriber_profile_id)
);

create table public.creator_earnings (
  id uuid primary key default gen_random_uuid(),
  trader_id uuid not null references public.traders(id) on delete cascade,
  strategy_id uuid references public.strategies(id) on delete set null,
  subscription_id uuid references public.strategy_subscriptions(id) on delete set null,
  gross_amount numeric(30,12) not null,
  platform_fee numeric(30,12) not null default 0,
  net_amount numeric(30,12) not null,
  currency text not null default 'USD',
  status public.earning_status not null default 'pending',
  earning_date timestamptz not null default now(),
  available_at timestamptz,
  paid_at timestamptz,
  reversal_reason text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint creator_gross_check check (gross_amount >= 0),
  constraint creator_platform_fee_check check (platform_fee >= 0),
  constraint creator_net_check check (net_amount >= 0),
  constraint creator_fee_not_greater_check check (platform_fee <= gross_amount)
);

create table public.creator_payouts (
  id uuid primary key default gen_random_uuid(),
  trader_id uuid not null references public.traders(id) on delete cascade,
  amount numeric(30,12) not null,
  currency text not null default 'USD',
  status public.earning_status not null default 'pending',
  destination_type text,
  destination_reference text,
  requested_at timestamptz not null default now(),
  processed_at timestamptz,
  failure_reason text,
  metadata jsonb not null default '{}'::jsonb,
  constraint creator_payout_amount_check check (amount > 0)
);

create index strategy_listings_status_idx
  on public.strategy_listings(status, published_at desc);

create index strategy_listings_trader_idx
  on public.strategy_listings(trader_id, status);

create index strategy_listings_category_idx
  on public.strategy_listings(category, status);

create index strategy_subscriptions_subscriber_idx
  on public.strategy_subscriptions(subscriber_profile_id, status);

create index strategy_subscriptions_strategy_idx
  on public.strategy_subscriptions(strategy_id, status);

create index strategy_subscriptions_period_idx
  on public.strategy_subscriptions(current_period_end, status);

create index creator_earnings_trader_idx
  on public.creator_earnings(trader_id, earning_date desc);

create index creator_earnings_status_idx
  on public.creator_earnings(status, available_at);

create index creator_payouts_trader_idx
  on public.creator_payouts(trader_id, requested_at desc);

create trigger strategy_listings_set_updated_at
before update on public.strategy_listings
for each row execute function public.set_updated_at();

create trigger strategy_subscriptions_set_updated_at
before update on public.strategy_subscriptions
for each row execute function public.set_updated_at();

alter table public.strategy_listings enable row level security;
alter table public.strategy_subscriptions enable row level security;
alter table public.creator_earnings enable row level security;
alter table public.creator_payouts enable row level security;

create policy "strategy_listings_select_published"
on public.strategy_listings for select
to anon, authenticated
using (
  status = 'published'
  or trader_id in (
    select id from public.traders where profile_id = auth.uid()
  )
);

create policy "strategy_listings_insert_own"
on public.strategy_listings for insert
to authenticated
with check (
  trader_id in (
    select id from public.traders where profile_id = auth.uid()
  )
);

create policy "strategy_listings_update_own"
on public.strategy_listings for update
to authenticated
using (
  trader_id in (
    select id from public.traders where profile_id = auth.uid()
  )
)
with check (
  trader_id in (
    select id from public.traders where profile_id = auth.uid()
  )
);

create policy "strategy_listings_delete_own"
on public.strategy_listings for delete
to authenticated
using (
  trader_id in (
    select id from public.traders where profile_id = auth.uid()
  )
);

create policy "strategy_subscriptions_select_own"
on public.strategy_subscriptions for select
to authenticated
using (subscriber_profile_id = auth.uid());

create policy "strategy_subscriptions_insert_own"
on public.strategy_subscriptions for insert
to authenticated
with check (subscriber_profile_id = auth.uid());

create policy "strategy_subscriptions_update_own"
on public.strategy_subscriptions for update
to authenticated
using (subscriber_profile_id = auth.uid())
with check (subscriber_profile_id = auth.uid());

create policy "creator_earnings_select_own"
on public.creator_earnings for select
to authenticated
using (
  trader_id in (
    select id from public.traders where profile_id = auth.uid()
  )
);

create policy "creator_payouts_select_own"
on public.creator_payouts for select
to authenticated
using (
  trader_id in (
    select id from public.traders where profile_id = auth.uid()
  )
);

comment on table public.strategy_listings is 'Public marketplace listings for Alphentra strategies.';
comment on table public.strategy_subscriptions is 'User subscriptions to strategy marketplace listings.';
comment on table public.creator_earnings is 'Revenue ledger for strategy creators after platform fees.';
comment on table public.creator_payouts is 'Creator withdrawal and payout requests.';
