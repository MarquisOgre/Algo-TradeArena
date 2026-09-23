create table public.strategy_forward_tests (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  strategy_id uuid not null references public.strategies(id) on delete cascade,
  strategy_version_id uuid references public.strategy_versions(id) on delete set null,
  market_id uuid not null references public.markets(id) on delete restrict,
  timeframe text not null check (timeframe = any (array['5m','15m','1h','4h','1d'])),
  status text not null default 'active' check (status = any (array['active','paused','completed','failed'])),
  initial_capital numeric(30,12) not null check (initial_capital > 0),
  started_at timestamptz not null default now(),
  last_cycle_at timestamptz,
  completed_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.strategy_forward_events (
  id bigint generated always as identity primary key,
  forward_test_id uuid not null references public.strategy_forward_tests(id) on delete cascade,
  event_time timestamptz not null default now(),
  signal text not null check (signal = any (array['BUY','SELL','HOLD'])),
  price numeric(30,12),
  quantity numeric(30,12),
  action text not null default 'none' check (action = any (array['none','paper_buy','paper_sell','blocked'])),
  order_id uuid references public.orders(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb
);

create index strategy_forward_tests_profile_idx on public.strategy_forward_tests(profile_id, created_at desc);
create index strategy_forward_events_test_idx on public.strategy_forward_events(forward_test_id, event_time desc);

alter table public.strategy_forward_tests enable row level security;
alter table public.strategy_forward_events enable row level security;

create policy "forward_tests_select_own" on public.strategy_forward_tests for select to authenticated using (profile_id = auth.uid());
create policy "forward_tests_insert_own" on public.strategy_forward_tests for insert to authenticated with check (profile_id = auth.uid());
create policy "forward_tests_update_own" on public.strategy_forward_tests for update to authenticated using (profile_id = auth.uid()) with check (profile_id = auth.uid());
create policy "forward_tests_delete_own" on public.strategy_forward_tests for delete to authenticated using (profile_id = auth.uid());

create policy "forward_events_select_own" on public.strategy_forward_events for select to authenticated using (
  forward_test_id in (select id from public.strategy_forward_tests where profile_id = auth.uid())
);
create policy "forward_events_insert_own" on public.strategy_forward_events for insert to authenticated with check (
  forward_test_id in (select id from public.strategy_forward_tests where profile_id = auth.uid())
);

grant select, insert, update, delete on public.strategy_forward_tests to authenticated;
grant select, insert on public.strategy_forward_events to authenticated;

create trigger strategy_forward_tests_set_updated_at
before update on public.strategy_forward_tests
for each row execute function public.set_updated_at();