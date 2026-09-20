-- Alphentra Database Migration 009
-- Payments and platform revenue foundation.
-- Provider-agnostic: supports future Stripe/Razorpay/other regulated
-- payment providers without coupling the database to one vendor.

create type public.payment_order_status as enum (
  'created',
  'pending',
  'processing',
  'succeeded',
  'failed',
  'cancelled',
  'refunded',
  'partially_refunded',
  'expired'
);

create type public.payment_order_type as enum (
  'strategy_subscription',
  'competition_entry',
  'wallet_deposit',
  'creator_payout',
  'platform_fee',
  'other'
);

create type public.refund_status as enum (
  'pending',
  'completed',
  'failed'
);

create table public.payment_orders (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete restrict,
  order_type public.payment_order_type not null,
  status public.payment_order_status not null default 'created',
  provider text not null,
  provider_order_id text,
  provider_payment_id text,
  amount numeric(36,18) not null,
  currency text not null default 'USD',
  platform_fee numeric(36,18) not null default 0,
  provider_fee numeric(36,18) not null default 0,
  net_amount numeric(36,18) not null default 0,
  reference_type text,
  reference_id uuid,
  idempotency_key text not null,
  checkout_url text,
  expires_at timestamptz,
  paid_at timestamptz,
  failed_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint payment_orders_amount_check check (amount > 0),
  constraint payment_orders_platform_fee_check check (platform_fee >= 0),
  constraint payment_orders_provider_fee_check check (provider_fee >= 0),
  constraint payment_orders_net_amount_check check (net_amount >= 0),
  unique (provider, idempotency_key),
  unique (provider, provider_order_id)
);

create table public.payment_transactions (
  id uuid primary key default gen_random_uuid(),
  payment_order_id uuid not null references public.payment_orders(id) on delete restrict,
  provider text not null,
  provider_transaction_id text,
  transaction_type text not null,
  amount numeric(36,18) not null,
  currency text not null default 'USD',
  status public.payment_order_status not null default 'pending',
  processed_at timestamptz,
  failure_code text,
  failure_message text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint payment_transactions_amount_check check (amount > 0),
  unique (provider, provider_transaction_id)
);

create table public.payment_refunds (
  id uuid primary key default gen_random_uuid(),
  payment_order_id uuid not null references public.payment_orders(id) on delete restrict,
  payment_transaction_id uuid references public.payment_transactions(id) on delete set null,
  provider text not null,
  provider_refund_id text,
  amount numeric(36,18) not null,
  currency text not null default 'USD',
  status public.refund_status not null default 'pending',
  reason text,
  requested_at timestamptz not null default now(),
  completed_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  constraint payment_refunds_amount_check check (amount > 0),
  unique (provider, provider_refund_id)
);

create table public.payment_webhook_events (
  id bigint generated always as identity primary key,
  provider text not null,
  provider_event_id text not null,
  event_type text not null,
  signature_verified boolean not null default false,
  processed boolean not null default false,
  processed_at timestamptz,
  payload jsonb not null default '{}'::jsonb,
  error_message text,
  created_at timestamptz not null default now(),
  unique (provider, provider_event_id)
);

create table public.platform_revenue (
  id uuid primary key default gen_random_uuid(),
  payment_order_id uuid references public.payment_orders(id) on delete set null,
  strategy_subscription_id uuid references public.strategy_subscriptions(id) on delete set null,
  competition_id uuid references public.competitions(id) on delete set null,
  revenue_type text not null,
  gross_amount numeric(36,18) not null,
  provider_fee numeric(36,18) not null default 0,
  creator_share numeric(36,18) not null default 0,
  net_platform_revenue numeric(36,18) not null,
  currency text not null default 'USD',
  recognized_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  constraint platform_revenue_gross_check check (gross_amount >= 0),
  constraint platform_revenue_provider_fee_check check (provider_fee >= 0),
  constraint platform_revenue_creator_share_check check (creator_share >= 0),
  constraint platform_revenue_net_check check (net_platform_revenue >= 0)
);

create index payment_orders_profile_time_idx
  on public.payment_orders(profile_id, created_at desc);

create index payment_orders_status_idx
  on public.payment_orders(status, created_at desc);

create index payment_orders_reference_idx
  on public.payment_orders(reference_type, reference_id);

create index payment_orders_provider_idx
  on public.payment_orders(provider, provider_order_id);

create index payment_transactions_order_idx
  on public.payment_transactions(payment_order_id, created_at desc);

create index payment_transactions_provider_idx
  on public.payment_transactions(provider, provider_transaction_id);

create index payment_refunds_order_idx
  on public.payment_refunds(payment_order_id, requested_at desc);

create index payment_webhooks_processing_idx
  on public.payment_webhook_events(processed, created_at);

create index platform_revenue_time_idx
  on public.platform_revenue(recognized_at desc);

create index platform_revenue_subscription_idx
  on public.platform_revenue(strategy_subscription_id);

create trigger payment_orders_set_updated_at
before update on public.payment_orders
for each row execute function public.set_updated_at();

alter table public.payment_orders enable row level security;
alter table public.payment_transactions enable row level security;
alter table public.payment_refunds enable row level security;
alter table public.payment_webhook_events enable row level security;
alter table public.platform_revenue enable row level security;

create policy "payment_orders_select_own"
on public.payment_orders for select
to authenticated
using (profile_id = auth.uid());

create policy "payment_orders_insert_own"
on public.payment_orders for insert
to authenticated
with check (profile_id = auth.uid());

create policy "payment_orders_update_own"
on public.payment_orders for update
to authenticated
using (profile_id = auth.uid())
with check (profile_id = auth.uid());

create policy "payment_transactions_select_own"
on public.payment_transactions for select
to authenticated
using (
  payment_order_id in (
    select id from public.payment_orders where profile_id = auth.uid()
  )
);

create policy "payment_refunds_select_own"
on public.payment_refunds for select
to authenticated
using (
  payment_order_id in (
    select id from public.payment_orders where profile_id = auth.uid()
  )
);

create policy "platform_revenue_select_creator"
on public.platform_revenue for select
to authenticated
using (
  strategy_subscription_id in (
    select ss.id
    from public.strategy_subscriptions ss
    join public.strategies s on s.id = ss.strategy_id
    join public.traders t on t.id = s.trader_id
    where t.profile_id = auth.uid()
  )
);

comment on table public.payment_orders is 'Provider-agnostic payment intents/orders for Alphentra purchases and funding.';
comment on table public.payment_transactions is 'Provider payment transaction records linked to Alphentra payment orders.';
comment on table public.payment_refunds is 'Refund requests and provider refund state.';
comment on table public.payment_webhook_events is 'Idempotent audit trail of incoming provider webhook events.';
comment on table public.platform_revenue is 'Recognized Alphentra platform revenue after provider fees and creator shares.';
