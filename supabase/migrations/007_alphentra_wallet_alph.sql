-- Alphentra Database Migration 007
-- Wallet and ALPH ledger foundation.
-- This migration stores platform accounting state separately from external
-- blockchain execution. Blockchain hashes/addresses are references only.

create type public.wallet_status as enum (
  'active',
  'frozen',
  'closed'
);

create type public.wallet_transaction_type as enum (
  'deposit',
  'withdrawal',
  'transfer',
  'trade',
  'fee',
  'reward',
  'refund',
  'adjustment'
);

create type public.wallet_transaction_status as enum (
  'pending',
  'completed',
  'failed',
  'reversed'
);

create type public.alph_transaction_type as enum (
  'deposit',
  'withdrawal',
  'transfer',
  'reward',
  'competition_reward',
  'creator_reward',
  'fee',
  'adjustment'
);

create table public.wallets (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  wallet_name text not null default 'Alphentra Wallet',
  status public.wallet_status not null default 'active',
  default_currency text not null default 'USD',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint wallets_name_not_blank check (char_length(trim(wallet_name)) > 0),
  unique (profile_id, wallet_name)
);

create table public.wallet_balances (
  id uuid primary key default gen_random_uuid(),
  wallet_id uuid not null references public.wallets(id) on delete cascade,
  asset_symbol text not null,
  asset_type text not null default 'fiat',
  available_balance numeric(36,18) not null default 0,
  locked_balance numeric(36,18) not null default 0,
  total_balance numeric(36,18) generated always as (available_balance + locked_balance) stored,
  updated_at timestamptz not null default now(),
  constraint wallet_balances_asset_type_check check (
    asset_type in ('fiat', 'crypto', 'alph')
  ),
  constraint wallet_balances_available_check check (available_balance >= 0),
  constraint wallet_balances_locked_check check (locked_balance >= 0),
  unique (wallet_id, asset_symbol)
);

create table public.wallet_addresses (
  id uuid primary key default gen_random_uuid(),
  wallet_id uuid not null references public.wallets(id) on delete cascade,
  blockchain text not null,
  address text not null,
  label text,
  is_primary boolean not null default false,
  is_verified boolean not null default false,
  created_at timestamptz not null default now(),
  unique (blockchain, address)
);

create table public.wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  wallet_id uuid not null references public.wallets(id) on delete restrict,
  asset_symbol text not null,
  transaction_type public.wallet_transaction_type not null,
  status public.wallet_transaction_status not null default 'pending',
  amount numeric(36,18) not null,
  fee numeric(36,18) not null default 0,
  net_amount numeric(36,18) not null,
  reference_type text,
  reference_id uuid,
  external_reference text,
  description text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  constraint wallet_transactions_amount_check check (amount > 0),
  constraint wallet_transactions_fee_check check (fee >= 0),
  constraint wallet_transactions_net_check check (net_amount >= 0)
);

create table public.alph_transactions (
  id uuid primary key default gen_random_uuid(),
  wallet_id uuid not null references public.wallets(id) on delete restrict,
  profile_id uuid not null references public.profiles(id) on delete restrict,
  transaction_type public.alph_transaction_type not null,
  status public.wallet_transaction_status not null default 'pending',
  amount numeric(36,18) not null,
  fee numeric(36,18) not null default 0,
  net_amount numeric(36,18) not null,
  blockchain text,
  from_address text,
  to_address text,
  transaction_hash text,
  external_reference text,
  reference_type text,
  reference_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  constraint alph_transactions_amount_check check (amount > 0),
  constraint alph_transactions_fee_check check (fee >= 0),
  constraint alph_transactions_net_check check (net_amount >= 0),
  unique (transaction_hash)
);

create table public.wallet_ledger_entries (
  id bigint generated always as identity primary key,
  wallet_id uuid not null references public.wallets(id) on delete restrict,
  asset_symbol text not null,
  transaction_id uuid references public.wallet_transactions(id) on delete set null,
  alph_transaction_id uuid references public.alph_transactions(id) on delete set null,
  direction text not null,
  amount numeric(36,18) not null,
  balance_after numeric(36,18),
  description text,
  created_at timestamptz not null default now(),
  constraint wallet_ledger_direction_check check (direction in ('credit', 'debit')),
  constraint wallet_ledger_amount_check check (amount > 0),
  constraint wallet_ledger_balance_check check (balance_after is null or balance_after >= 0),
  constraint wallet_ledger_reference_check check (
    transaction_id is not null or alph_transaction_id is not null
  )
);

create index wallets_profile_idx
  on public.wallets(profile_id, status);

create index wallet_balances_wallet_idx
  on public.wallet_balances(wallet_id);

create index wallet_addresses_wallet_idx
  on public.wallet_addresses(wallet_id, is_primary);

create index wallet_transactions_wallet_time_idx
  on public.wallet_transactions(wallet_id, created_at desc);

create index wallet_transactions_reference_idx
  on public.wallet_transactions(reference_type, reference_id);

create index alph_transactions_profile_time_idx
  on public.alph_transactions(profile_id, created_at desc);

create index alph_transactions_wallet_time_idx
  on public.alph_transactions(wallet_id, created_at desc);

create index alph_transactions_hash_idx
  on public.alph_transactions(transaction_hash);

create index wallet_ledger_wallet_time_idx
  on public.wallet_ledger_entries(wallet_id, created_at desc);

create trigger wallets_set_updated_at
before update on public.wallets
for each row execute function public.set_updated_at();

-- Create one platform wallet for each authenticated user on signup.
create or replace function public.handle_new_user_wallet()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.wallets (profile_id)
  values (new.id)
  on conflict (profile_id, wallet_name) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created_wallet
after insert on auth.users
for each row execute function public.handle_new_user_wallet();

alter table public.wallets enable row level security;
alter table public.wallet_balances enable row level security;
alter table public.wallet_addresses enable row level security;
alter table public.wallet_transactions enable row level security;
alter table public.alph_transactions enable row level security;
alter table public.wallet_ledger_entries enable row level security;

create policy "wallets_select_own"
on public.wallets for select
to authenticated
using (profile_id = auth.uid());

create policy "wallets_insert_own"
on public.wallets for insert
to authenticated
with check (profile_id = auth.uid());

create policy "wallets_update_own"
on public.wallets for update
to authenticated
using (profile_id = auth.uid())
with check (profile_id = auth.uid());

create policy "wallet_balances_select_own"
on public.wallet_balances for select
to authenticated
using (
  wallet_id in (
    select id from public.wallets where profile_id = auth.uid()
  )
);

create policy "wallet_addresses_select_own"
on public.wallet_addresses for select
to authenticated
using (
  wallet_id in (
    select id from public.wallets where profile_id = auth.uid()
  )
);

create policy "wallet_transactions_select_own"
on public.wallet_transactions for select
to authenticated
using (
  wallet_id in (
    select id from public.wallets where profile_id = auth.uid()
  )
);

create policy "alph_transactions_select_own"
on public.alph_transactions for select
to authenticated
using (profile_id = auth.uid());

create policy "wallet_ledger_select_own"
on public.wallet_ledger_entries for select
to authenticated
using (
  wallet_id in (
    select id from public.wallets where profile_id = auth.uid()
  )
);

comment on table public.wallets is 'User-owned Alphentra wallet container.';
comment on table public.wallet_balances is 'Current available and locked balances by asset.';
comment on table public.wallet_addresses is 'External blockchain wallet addresses linked to a user wallet.';
comment on table public.wallet_transactions is 'Platform wallet transaction records and accounting references.';
comment on table public.alph_transactions is 'ALPH-specific ledger records with optional external blockchain references.';
comment on table public.wallet_ledger_entries is 'Append-oriented wallet accounting entries for auditability.';
