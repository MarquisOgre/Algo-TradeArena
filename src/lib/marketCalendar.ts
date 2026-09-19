export type MarketGroup = "forex" | "crypto" | "metals";

export type MarketSession = {
  group: MarketGroup;
  label: string;
  open: boolean;
  note: string;
};

/** Prototype calendar for the ALPHENTRA product experience.
 * Weekend rule: Forex closed; Crypto + Metals available.
 * Live availability must eventually come from instrument-specific venue calendars.
 */
export function getMarketSessions(date = new Date()): MarketSession[] {
  const day = date.getDay();
  const weekend = day === 0 || day === 6;
  return [
    { group: "forex", label: "Forex", open: !weekend, note: weekend ? "Market Closed" : "Market Active" },
    { group: "crypto", label: "Crypto", open: true, note: "Market Active" },
    { group: "metals", label: "Metals", open: true, note: "Market Active" },
  ];
}

export function getMarketCalendarLabel(date = new Date()) {
  return date.getDay() === 0 || date.getDay() === 6
    ? "Weekend Markets — Crypto · Metals"
    : "Global Markets Active — Forex · Crypto · Metals";
}
