-- Alphentra Database Migration 012
-- Integration and webhook event infrastructure.
-- Provider-agnostic event inbox/outbox for reliable asynchronous workflows.

create type public.integration_event_status as enum (
  'received',
  'queued',
  'processing',
  'processed',
  'failed',
  'ignored'
);

create type public.integration_event_direction as enum (
  'inbound',
  'outbound'
);

create table public.integration_events (
  id bigint generated always as identity primary key,
  direction public.integration_event_direction not null,
  provider text not null,
  event_type text not null,
  external_event_id text,
  status public.integration_event_status not null default 'received',
  profile_id uuid references public.profiles(id) on delete set null,
  resource_type text,
  resource_id uuid,
  idempotency_key text,
  payload jsonb not null default '{}'::jsonb,
  response_payload jsonb,
  attempt_count integer not null default 0,
  last_attempt_at timestamptz,
  processed_at timestamptz,
  next_attempt_at timestamptz,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint integration_event_attempts_check check (attempt_count >= 0),
  unique (provider, external_event_id),
  unique (provider, idempotency_key)
);

create table public.webhook_endpoints (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete cascade,
  name text not null,
  endpoint_url text not null,
  secret_reference text,
  active boolean not null default true,
  subscribed_events text[] not null default '{}',
  last_delivery_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint webhook_name_not_blank check (char_length(trim(name)) > 0)
);

create table public.webhook_deliveries (
  id bigint generated always as identity primary key,
  endpoint_id uuid not null references public.webhook_endpoints(id) on delete cascade,
  integration_event_id bigint references public.integration_events(id) on delete set null,
  event_type text not null,
  status public.integration_event_status not null default 'queued',
  attempt_count integer not null default 0,
  http_status integer,
  response_body text,
  last_attempt_at timestamptz,
  delivered_at timestamptz,
  error_message text,
  created_at timestamptz not null default now(),
  constraint webhook_delivery_attempts_check check (attempt_count >= 0),
  constraint webhook_http_status_check check (http_status is null or http_status between 100 and 599)
);

create index integration_events_status_idx
  on public.integration_events(status, next_attempt_at, created_at);

create index integration_events_provider_type_idx
  on public.integration_events(provider, event_type, created_at desc);

create index integration_events_profile_idx
  on public.integration_events(profile_id, created_at desc);

create index integration_events_resource_idx
  on public.integration_events(resource_type, resource_id, created_at desc);

create index webhook_endpoints_profile_idx
  on public.webhook_endpoints(profile_id, active);

create index webhook_deliveries_endpoint_idx
  on public.webhook_deliveries(endpoint_id, created_at desc);

create index webhook_deliveries_status_idx
  on public.webhook_deliveries(status, created_at);

create trigger integration_events_set_updated_at
before update on public.integration_events
for each row execute function public.set_updated_at();

create trigger webhook_endpoints_set_updated_at
before update on public.webhook_endpoints
for each row execute function public.set_updated_at();

alter table public.integration_events enable row level security;
alter table public.webhook_endpoints enable row level security;
alter table public.webhook_deliveries enable row level security;

create policy "integration_events_select_own"
on public.integration_events for select
to authenticated
using (profile_id = auth.uid());

create policy "webhook_endpoints_select_own"
on public.webhook_endpoints for select
to authenticated
using (profile_id = auth.uid());

create policy "webhook_endpoints_insert_own"
on public.webhook_endpoints for insert
to authenticated
with check (profile_id = auth.uid());

create policy "webhook_endpoints_update_own"
on public.webhook_endpoints for update
to authenticated
using (profile_id = auth.uid())
with check (profile_id = auth.uid());

create policy "webhook_endpoints_delete_own"
on public.webhook_endpoints for delete
to authenticated
using (profile_id = auth.uid());

create policy "webhook_deliveries_select_own"
on public.webhook_deliveries for select
to authenticated
using (
  endpoint_id in (
    select id from public.webhook_endpoints where profile_id = auth.uid()
  )
);

comment on table public.integration_events is 'Provider-agnostic inbound and outbound integration event inbox/outbox.';
comment on table public.webhook_endpoints is 'User or platform webhook destinations and event subscriptions.';
comment on table public.webhook_deliveries is 'Delivery attempts and provider responses for outbound webhooks.';
