-- Alphentra Database Migration 026
-- Phase 4: Strategies + Strategy Lab foundation.
--
-- Adds a normalized condition tree for the no-code Strategy Lab and a
-- platform-owned template catalog. Existing strategies, versions, risk
-- profiles and backtest tables remain the source of truth for lifecycle data.

create table public.strategy_conditions (
  id uuid primary key default gen_random_uuid(),
  strategy_version_id uuid not null references public.strategy_versions(id) on delete cascade,
  parent_id uuid references public.strategy_conditions(id) on delete cascade,
  node_type text not null default 'condition',
  condition_role text not null default 'entry',
  group_operator text,
  indicator text,
  timeframe text,
  comparator text,
  operand jsonb not null default '{}'::jsonb,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  constraint strategy_conditions_node_type_check
    check (node_type in ('group', 'condition')),
  constraint strategy_conditions_role_check
    check (condition_role in ('entry', 'exit', 'filter')),
  constraint strategy_conditions_group_operator_check
    check (group_operator is null or group_operator in ('AND', 'OR')),
  constraint strategy_conditions_comparator_check
    check (
      comparator is null or comparator in (
        'gt', 'gte', 'lt', 'lte', 'eq', 'neq',
        'crosses_above', 'crosses_below', 'between'
      )
    ),
  constraint strategy_conditions_sort_order_check
    check (sort_order >= 0),
  constraint strategy_conditions_shape_check
    check (
      (node_type = 'group' and group_operator is not null)
      or
      (node_type = 'condition' and indicator is not null and comparator is not null)
    )
);

create index strategy_conditions_version_idx
  on public.strategy_conditions(strategy_version_id, sort_order);

create index strategy_conditions_parent_idx
  on public.strategy_conditions(parent_id, sort_order);

alter table public.strategy_conditions enable row level security;

create policy "strategy_conditions_select"
on public.strategy_conditions for select
to anon, authenticated
using (
  strategy_version_id in (
    select sv.id
    from public.strategy_versions sv
    join public.strategies s on s.id = sv.strategy_id
    join public.traders t on t.id = s.trader_id
    where sv.is_live = true
       or t.profile_id = auth.uid()
  )
);

create policy "strategy_conditions_insert_own"
on public.strategy_conditions for insert
to authenticated
with check (
  strategy_version_id in (
    select sv.id
    from public.strategy_versions sv
    join public.strategies s on s.id = sv.strategy_id
    join public.traders t on t.id = s.trader_id
    where t.profile_id = auth.uid()
  )
);

create policy "strategy_conditions_update_own"
on public.strategy_conditions for update
to authenticated
using (
  strategy_version_id in (
    select sv.id
    from public.strategy_versions sv
    join public.strategies s on s.id = sv.strategy_id
    join public.traders t on t.id = s.trader_id
    where t.profile_id = auth.uid()
  )
)
with check (
  strategy_version_id in (
    select sv.id
    from public.strategy_versions sv
    join public.strategies s on s.id = sv.strategy_id
    join public.traders t on t.id = s.trader_id
    where t.profile_id = auth.uid()
  )
);

create policy "strategy_conditions_delete_own"
on public.strategy_conditions for delete
to authenticated
using (
  strategy_version_id in (
    select sv.id
    from public.strategy_versions sv
    join public.strategies s on s.id = sv.strategy_id
    join public.traders t on t.id = s.trader_id
    where t.profile_id = auth.uid()
  )
);

comment on table public.strategy_conditions
is 'Normalized no-code Strategy Lab condition tree. The executable strategy definition is versioned in strategy_versions.definition.';

create table public.strategy_templates (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  style text not null,
  description text,
  definition jsonb not null default '{}'::jsonb,
  risk_profile jsonb not null default '{}'::jsonb,
  is_enabled boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint strategy_templates_name_check check (char_length(trim(name)) > 0)
);

create index strategy_templates_enabled_idx
  on public.strategy_templates(is_enabled, sort_order);

create trigger strategy_templates_set_updated_at
before update on public.strategy_templates
for each row execute function public.set_updated_at();

alter table public.strategy_templates enable row level security;

create policy "strategy_templates_select_enabled"
on public.strategy_templates for select
to anon, authenticated
using (is_enabled = true);

insert into public.strategy_templates (slug, name, style, description, definition, risk_profile, sort_order)
values
(
  'momentum-breakout',
  'Momentum Breakout',
  'Momentum',
  'Trend confirmation followed by a breakout entry with volatility-aware sizing.',
  '{"entry":{"operator":"AND","conditions":[{"indicator":"EMA","period":20,"comparator":"gt","value":{"indicator":"EMA","period":50}},{"indicator":"PRICE","comparator":"crosses_above","value":{"indicator":"HIGH","lookback":20}}]},"exit":{"operator":"OR","conditions":[{"indicator":"PRICE","comparator":"lt","value":{"indicator":"EMA","period":20}},{"indicator":"ATR","period":14,"comparator":"gt","value":{"type":"multiple","value":2.5}}]},"positionSizing":{"method":"risk_percent","value":1}}',
  '{"risk_level":"moderate","max_position_size_pct":10,"max_daily_loss_pct":3,"stop_loss_pct":1,"take_profit_pct":2}',
  10
),
(
  'mean-reversion',
  'Mean Reversion',
  'Mean Reversion',
  'Statistical dislocation entries with a controlled exit back toward the reference mean.',
  '{"entry":{"operator":"AND","conditions":[{"indicator":"RSI","period":14,"comparator":"lt","value":30},{"indicator":"PRICE","comparator":"lt","value":{"indicator":"BB_LOWER","period":20,"stddev":2}}]},"exit":{"operator":"OR","conditions":[{"indicator":"RSI","period":14,"comparator":"gt","value":55},{"indicator":"PRICE","comparator":"gte","value":{"indicator":"SMA","period":20}}]},"positionSizing":{"method":"risk_percent","value":0.75}}',
  '{"risk_level":"conservative","max_position_size_pct":8,"max_daily_loss_pct":2,"stop_loss_pct":1,"take_profit_pct":1.5}',
  20
),
(
  'trend-following',
  'Trend Following',
  'Trend Following',
  'Multi-timeframe trend confirmation with a trailing exit.',
  '{"entry":{"operator":"AND","conditions":[{"indicator":"EMA","period":20,"comparator":"gt","value":{"indicator":"EMA","period":50}},{"indicator":"ADX","period":14,"comparator":"gte","value":{"type":"number","value":20}}]},"exit":{"operator":"OR","conditions":[{"indicator":"EMA","period":20,"comparator":"lt","value":{"indicator":"EMA","period":50}},{"indicator":"PRICE","comparator":"lt","value":{"indicator":"EMA","period":20}}]},"positionSizing":{"method":"risk_percent","value":1}}',
  '{"risk_level":"moderate","max_position_size_pct":10,"max_daily_loss_pct":3,"stop_loss_pct":1.25,"take_profit_pct":3}',
  30
),
(
  'volatility-breakout',
  'Volatility Breakout',
  'Volatility',
  'ATR expansion trigger with a volatility-normalized position size.',
  '{"entry":{"operator":"AND","conditions":[{"indicator":"ATR","period":14,"comparator":"gt","value":{"indicator":"ATR","period":50}},{"indicator":"PRICE","comparator":"crosses_above","value":{"indicator":"HIGH","lookback":10}}]},"exit":{"operator":"OR","conditions":[{"indicator":"ATR","period":14,"comparator":"lt","value":{"indicator":"ATR","period":50}},{"indicator":"PRICE","comparator":"lt","value":{"indicator":"EMA","period":20}}]},"positionSizing":{"method":"volatility_adjusted","value":1}}',
  '{"risk_level":"moderate","max_position_size_pct":7.5,"max_daily_loss_pct":3,"stop_loss_pct":1.5,"take_profit_pct":3}',
  40
),
(
  'rsi-reversal',
  'RSI Reversal',
  'Momentum',
  'Oscillator reversal setup with confirmation and capped risk.',
  '{"entry":{"operator":"AND","conditions":[{"indicator":"RSI","period":14,"comparator":"crosses_above","value":{"type":"number","value":30}},{"indicator":"PRICE","comparator":"gt","value":{"indicator":"EMA","period":20}}]},"exit":{"operator":"OR","conditions":[{"indicator":"RSI","period":14,"comparator":"gte","value":{"type":"number","value":65}},{"indicator":"PRICE","comparator":"lt","value":{"indicator":"EMA","period":20}}]},"positionSizing":{"method":"risk_percent","value":0.75}}',
  '{"risk_level":"conservative","max_position_size_pct":6,"max_daily_loss_pct":2,"stop_loss_pct":1,"take_profit_pct":2}',
  50
),
(
  'dual-confirmation',
  'Dual Confirmation',
  'Multi-Factor',
  'Combines trend and momentum confirmation before allowing an entry.',
  '{"entry":{"operator":"AND","conditions":[{"indicator":"EMA","period":20,"comparator":"gt","value":{"indicator":"EMA","period":50}},{"indicator":"RSI","period":14,"comparator":"gte","value":{"type":"number","value":55}},{"indicator":"MACD","comparator":"gt","value":{"type":"number","value":0}}]},"exit":{"operator":"OR","conditions":[{"indicator":"RSI","period":14,"comparator":"lt","value":{"type":"number","value":45}},{"indicator":"EMA","period":20,"comparator":"lt","value":{"indicator":"EMA","period":50}}]},"positionSizing":{"method":"risk_percent","value":1}}',
  '{"risk_level":"moderate","max_position_size_pct":10,"max_daily_loss_pct":3,"stop_loss_pct":1.25,"take_profit_pct":2.5}',
  60
)
on conflict (slug) do nothing;

comment on table public.strategy_templates
is 'Platform-owned starter strategies available to the Strategy Lab. Templates are definitions, not performance guarantees.';
