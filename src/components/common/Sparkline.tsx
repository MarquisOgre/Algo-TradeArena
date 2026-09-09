import { Area, AreaChart, ResponsiveContainer } from "recharts";

export function Sparkline({
  data,
  tone = "auto",
  height = 40,
}: {
  data: number[];
  tone?: "auto" | "up" | "down" | "neutral";
  height?: number;
}) {
  const resolved =
    tone === "auto" ? (data[data.length - 1]! >= data[0]! ? "up" : "down") : tone;
  const stroke =
    resolved === "up"
      ? "var(--color-success)"
      : resolved === "down"
        ? "var(--color-danger)"
        : "var(--color-primary)";
  const id = `spark-${resolved}-${data.length}-${Math.round((data[0] ?? 0) * 100)}`;

  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data.map((v, i) => ({ i, v }))} margin={{ top: 2, bottom: 2, left: 0, right: 0 }}>
          <defs>
            <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={stroke} stopOpacity={0.35} />
              <stop offset="100%" stopColor={stroke} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="v"
            stroke={stroke}
            strokeWidth={1.8}
            fill={`url(#${id})`}
            isAnimationActive={false}
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
