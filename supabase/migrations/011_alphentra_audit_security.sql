-- Alphentra Database Migration 011
-- Audit and security event foundation.
-- Append-oriented records for sensitive platform actions.

create type public.audit_severity as enum (
  'info',
  'warning',
  'critical'
);

create table public.audit_logs (
  id bigint generated always as identity primary key,
  profile_id uuid references public.profiles(id) on delete set null,
  actor_type text not null default 'user',
  action text not null,
  resource_type text,
  resource_id uuid,
  severity public.audit_severity not null default 'info',
  ip_address inet,
  user_agent text,
  request_id text,
  success boolean not null default true,
  failure_reason text,
  old_data jsonb,
  new_data jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint audit_actor_type_check check (
    actor_type in ('user', 'system', 'admin', 'service')
  ),
  constraint audit_action_not_blank check (char_length(trim(action)) > 0)
);

create table public.security_events (
  id bigint generated always as identity primary key,
  profile_id uuid references public.profiles(id) on delete set null,
  event_type text not null,
  severity public.audit_severity not null default 'warning',
  ip_address inet,
  user_agent text,
  request_id text,
  success boolean not null default false,
  details jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now()
);

create table public.admin_actions (
  id bigint generated always as identity primary key,
  admin_profile_id uuid references public.profiles(id) on delete set null,
  action text not null,
  resource_type text,
  resource_id uuid,
  reason text,
  before_data jsonb,
  after_data jsonb,
  created_at timestamptz not null default now(),
  constraint admin_actions_action_not_blank check (char_length(trim(action)) > 0)
);

create index audit_logs_profile_time_idx
  on public.audit_logs(profile_id, created_at desc);

create index audit_logs_action_time_idx
  on public.audit_logs(action, created_at desc);

create index audit_logs_resource_idx
  on public.audit_logs(resource_type, resource_id, created_at desc);

create index audit_logs_request_idx
  on public.audit_logs(request_id);

create index security_events_profile_time_idx
  on public.security_events(profile_id, occurred_at desc);

create index security_events_type_time_idx
  on public.security_events(event_type, occurred_at desc);

create index admin_actions_admin_time_idx
  on public.admin_actions(admin_profile_id, created_at desc);

create index admin_actions_resource_idx
  on public.admin_actions(resource_type, resource_id, created_at desc);

alter table public.audit_logs enable row level security;
alter table public.security_events enable row level security;
alter table public.admin_actions enable row level security;

-- Audit/security records are intentionally not writable by normal client users.
-- Server-side trusted services will insert these records using controlled credentials.
create policy "audit_logs_select_own"
on public.audit_logs for select
to authenticated
using (profile_id = auth.uid());

create policy "security_events_select_own"
on public.security_events for select
to authenticated
using (profile_id = auth.uid());

-- Admin action records are restricted to server-side/admin workflows.
-- No direct client insert/update/delete policies are created.

comment on table public.audit_logs is 'Append-oriented audit trail for important Alphentra platform actions.';
comment on table public.security_events is 'Security-related events such as authentication, wallet, and access anomalies.';
comment on table public.admin_actions is 'Auditable record of privileged administrative operations.';
