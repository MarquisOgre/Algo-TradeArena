import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { GlassCard } from "@/components/common/GlassCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export type StrategyCondition = {
  indicator: string;
  period?: number;
  comparator: string;
  value: string;
};

export type StrategyRuleDefinition = {
  entryOperator: "AND" | "OR";
  entry: StrategyCondition[];
  exitOperator: "AND" | "OR";
  exit: StrategyCondition[];
  stopLossPct: number;
  takeProfitPct: number;
  trailingStopPct: number;
  riskPerTradePct: number;
  positionSizing: "fixed" | "risk_percent" | "volatility_adjusted";
};

const indicators = ["EMA", "SMA", "RSI", "MACD", "ATR", "PRICE"];
const comparators = [
  ["gt", "Greater than"],
  ["gte", "Greater or equal"],
  ["lt", "Less than"],
  ["lte", "Less or equal"],
  ["crosses_above", "Crosses above"],
  ["crosses_below", "Crosses below"],
  ["eq", "Equals"],
];

const defaultCondition: StrategyCondition = {
  indicator: "EMA",
  period: 20,
  comparator: "gt",
  value: "EMA(50)",
};

export function StrategyRuleBuilder({
  value,
  onChange,
}: {
  value: StrategyRuleDefinition;
  onChange: (next: StrategyRuleDefinition) => void;
}) {
  const update = (patch: Partial<StrategyRuleDefinition>) => onChange({ ...value, ...patch });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold">Rule Builder</p>
          <p className="text-xs text-muted-foreground">No-code entry, exit and risk controls. The same structure will be stored in the strategy version.</p>
        </div>
        <Badge variant="outline" className="border-primary/30 text-primary">Structured</Badge>
      </div>

      <RuleGroup
        title="Entry conditions"
        operator={value.entryOperator}
        conditions={value.entry}
        onOperator={(entryOperator) => update({ entryOperator })}
        onChange={(entry) => update({ entry })}
      />

      <RuleGroup
        title="Exit conditions"
        operator={value.exitOperator}
        conditions={value.exit}
        onOperator={(exitOperator) => update({ exitOperator })}
        onChange={(exit) => update({ exit })}
      />

      <GlassCard className="bg-surface/40 p-4">
        <p className="text-sm font-semibold">Risk & position sizing</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <NumberField label="Risk / trade %" value={value.riskPerTradePct} onChange={(riskPerTradePct) => update({ riskPerTradePct })} min={0.1} max={10} step={0.1} />
          <NumberField label="Stop loss %" value={value.stopLossPct} onChange={(stopLossPct) => update({ stopLossPct })} min={0} max={50} step={0.1} />
          <NumberField label="Take profit %" value={value.takeProfitPct} onChange={(takeProfitPct) => update({ takeProfitPct })} min={0} max={100} step={0.1} />
          <NumberField label="Trailing stop %" value={value.trailingStopPct} onChange={(trailingStopPct) => update({ trailingStopPct })} min={0} max={50} step={0.1} />
        </div>
        <div className="mt-3">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Position sizing</label>
          <select
            value={value.positionSizing}
            onChange={(event) => update({ positionSizing: event.target.value as StrategyRuleDefinition["positionSizing"] })}
            className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none"
          >
            <option value="risk_percent">Risk % of equity</option>
            <option value="volatility_adjusted">Volatility adjusted</option>
            <option value="fixed">Fixed size</option>
          </select>
        </div>
      </GlassCard>
    </div>
  );
}

function RuleGroup({
  title,
  operator,
  conditions,
  onOperator,
  onChange,
}: {
  title: string;
  operator: "AND" | "OR";
  conditions: StrategyCondition[];
  onOperator: (operator: "AND" | "OR") => void;
  onChange: (conditions: StrategyCondition[]) => void;
}) {
  const add = () => onChange([...conditions, { ...defaultCondition }]);
  const updateCondition = (index: number, patch: Partial<StrategyCondition>) => {
    onChange(conditions.map((condition, i) => (i === index ? { ...condition, ...patch } : condition)));
  };
  const remove = (index: number) => onChange(conditions.filter((_, i) => i !== index));

  return (
    <GlassCard className="bg-surface/40 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold">{title}</p>
        <div className="flex gap-1 rounded-lg bg-surface-2 p-1">
          {(["AND", "OR"] as const).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => onOperator(item)}
              className={`rounded-md px-2.5 py-1 text-[11px] font-bold ${operator === item ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-3 space-y-2">
        {conditions.map((condition, index) => (
          <div key={index} className="grid gap-2 rounded-xl border border-border bg-background/50 p-3 md:grid-cols-[1fr_80px_1fr_1.2fr_auto]">
            <select value={condition.indicator} onChange={(event) => updateCondition(index, { indicator: event.target.value })} className="rounded-lg border border-border bg-background px-2 py-2 text-sm">
              {indicators.map((item) => <option key={item}>{item}</option>)}
            </select>
            <input type="number" value={condition.period ?? ""} onChange={(event) => updateCondition(index, { period: event.target.value ? Number(event.target.value) : undefined })} placeholder="Period" className="rounded-lg border border-border bg-background px-2 py-2 text-sm" />
            <select value={condition.comparator} onChange={(event) => updateCondition(index, { comparator: event.target.value })} className="rounded-lg border border-border bg-background px-2 py-2 text-sm">
              {comparators.map(([key, label]) => <option key={key} value={key}>{label}</option>)}
            </select>
            <input value={condition.value} onChange={(event) => updateCondition(index, { value: event.target.value })} placeholder="EMA(50), 30, ..." className="rounded-lg border border-border bg-background px-2 py-2 text-sm" />
            <Button type="button" size="icon" variant="ghost" onClick={() => remove(index)} aria-label={`Remove condition ${index + 1}`}>
              <Trash2 className="size-4" />
            </Button>
          </div>
        ))}
      </div>

      <Button type="button" variant="outline" size="sm" className="mt-3" onClick={add}>
        <Plus className="size-4" /> Add condition
      </Button>
    </GlassCard>
  );
}

function NumberField({
  label,
  value,
  onChange,
  min,
  max,
  step,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
}) {
  return (
    <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
      {label}
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(event) => onChange(Number(event.target.value))}
        className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm font-normal text-foreground outline-none"
      />
    </label>
  );
}
