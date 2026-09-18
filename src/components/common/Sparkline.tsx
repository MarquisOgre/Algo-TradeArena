import { useId } from "react";

/** Lightweight inline SVG sparkline — SSR-safe and independent of container measurement. */
export function Sparkline({
  data,
  tone = "auto",
  height = 40,
}: {
  data: number[];
  tone?: "auto" | "up" | "down" | "neutral";
  height?: number;
}) {
  const gradientId = useId();
  if (data.length < 2) return <div style={{ height }} />;

  const resolved = tone === "auto" ? (data[data.length - 1]! >= data[0]! ? "up" : "down") : tone;
  const stroke =
    resolved === "up"
      ? "var(--color-success)"
      : resolved === "down"
        ? "var(--color-danger)"
        : "var(--color-primary)";

  const w = 100;
  const h = 32;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / span) * (h - 3) - 1.5;
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  });

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      width="100%"
      height={height}
      style={{ display: "block", height }}
      aria-hidden
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity={0.32} />
          <stop offset="100%" stopColor={stroke} stopOpacity={0} />
        </linearGradient>
      </defs>
      <polygon points={`0,${h} ${points.join(" ")} ${w},${h}`} fill={`url(#${gradientId})`} />
      <polyline
        points={points.join(" ")}
        fill="none"
        stroke={stroke}
        strokeWidth={1.6}
        vectorEffect="non-scaling-stroke"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}
