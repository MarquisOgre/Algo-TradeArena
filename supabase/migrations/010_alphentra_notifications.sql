-- Alphentra Database Migration 010
-- User notification center and delivery queue.

create type public.notification_type as enum (
  'system',
  'trade',
  'copy_trading',
  'strategy',
  'competition',
  'payment',
  'wallet',
  'security',
  'marketing'
);

create type public.notification_priority as enum (
  'low',
  'normal',
  'high',
  'critical'
);

create type public.notification_delivery_status as enum (
  'queued',
  'sent',
  'failed',
  'cancelled'
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  notification_type public.notification_type not null,
  priority public.notification_priority not null default 'normal',
  title text not null,
  message text not null,
  action_url text,
  reference_type text,
  reference_id uuid,
  is_read boolean not null default false,
  read_at timestamptz,
  expires_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint notifications_title_not_blank check (char_length(trim(title)) > 0),
  constraint notifications_message_not_blank check (char_length(trim(message)) > 0)
);

create table public.notification_preferences (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references public.profiles(id) on delete cascade,
  in_app_enabled boolean not null default true,
  email_enabled boolean not null default true,
  push_enabled boolean not null default true,
  trade_notifications boolean not null default true,
  copy_trading_notifications boolean not null default true,
  strategy_notifications boolean not null default true,
  competition_notifications boolean not null default true,
  payment_notifications boolean not null default true,
  wallet_notifications boolean not null default true,
  security_notifications boolean not null default true,
  marketing_notifications boolean not null default false,
  updated_at timestamptz not null default now()
);

create table public.notification_deliveries (
  id bigint generated always as identity primary key,
  notification_id uuid not null references public.notifications(id) on delete cascade,
  channel text not null,
  status public.notification_delivery_status not null default 'queued',
  provider text,
  provider_message_id text,
  attempts integer not null default 0,
  last_attempt_at timestamptz,
  delivered_at timestamptz,
  error_message text,
  created_at timestamptz not null default now(),
  constraint notification_delivery_channel_check check (
    channel in ('in_app', 'email', 'push', 'sms', 'webhook')
  ),
  constraint notification_delivery_attempts_check check (attempts >= 0),
  unique (notification_id, channel)
);

create index notifications_profile_time_idx
  on public.notifications(profile_id, created_at desc);

create index notifications_unread_idx
  on public.notifications(profile_id, is_read, created_at desc);

create index notifications_type_idx
  on public.notifications(notification_type, created_at desc);

create index notification_deliveries_status_idx
  on public.notification_deliveries(status, created_at);

create index notification_deliveries_notification_idx
  on public.notification_deliveries(notification_id);

create trigger notification_preferences_set_updated_at
before update on public.notification_preferences
for each row execute function public.set_updated_at();

-- Create default notification preferences for new users.
create or replace function public.handle_new_user_preferences()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.notification_preferences (profile_id)
  values (new.id)
  on conflict (profile_id) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created_notification_preferences
after insert on auth.users
for each row execute function public.handle_new_user_preferences();

alter table public.notifications enable row level security;
alter table public.notification_preferences enable row level security;
alter table public.notification_deliveries enable row level security;

create policy "notifications_select_own"
on public.notifications for select
to authenticated
using (profile_id = auth.uid());

create policy "notifications_update_own"
on public.notifications for update
to authenticated
using (profile_id = auth.uid())
with check (profile_id = auth.uid());

create policy "notification_preferences_select_own"
on public.notification_preferences for select
to authenticated
using (profile_id = auth.uid());

create policy "notification_preferences_insert_own"
on public.notification_preferences for insert
to authenticated
with check (profile_id = auth.uid());

create policy "notification_preferences_update_own"
on public.notification_preferences for update
to authenticated
using (profile_id = auth.uid())
with check (profile_id = auth.uid());

create policy "notification_deliveries_select_own"
on public.notification_deliveries for select
to authenticated
using (
  notification_id in (
    select id from public.notifications where profile_id = auth.uid()
  )
);

comment on table public.notifications is 'In-app and cross-channel notifications for Alphentra users.';
comment on table public.notification_preferences is 'Per-user notification and communication preferences.';
comment on table public.notification_deliveries is 'Delivery queue and provider state for notification channels.';
