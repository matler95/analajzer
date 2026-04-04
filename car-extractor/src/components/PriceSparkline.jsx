/**
 * PriceSparkline — 110×28px inline SVG showing price trend.
 * Uses the __priceHistory array already stored on each vehicle snapshot
 * plus the current price as the final point.
 *
 * Color coding:
 *   red    → price went up from first to last
 *   green  → price went down (good deal!)
 *   amber  → flat / only one point
 */
export default function PriceSparkline({ priceHistory = [], currentPrice }) {
  // Build the full series: history entries + current price as final point
  const raw = [
    ...priceHistory.map(ph => ph.price),
    currentPrice,
  ].filter(p => p != null && p > 0);

  if (raw.length < 2) return null;

  const W = 110, H = 28, PAD = 3;
  const minP = Math.min(...raw);
  const maxP = Math.max(...raw);
  const range = maxP - minP || 1;

  const points = raw.map((p, i) => {
    const x = PAD + (i / (raw.length - 1)) * (W - PAD * 2);
    const y = PAD + ((maxP - p) / range) * (H - PAD * 2);
    return [x, y];
  });

  const polyline = points.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");

  const first = raw[0];
  const last  = raw[raw.length - 1];
  const color = last < first ? "#3db87a"  // fell → green
              : last > first ? "#e04545"  // rose → red
              : "#f0a500";                // flat → amber

  // Last dot position
  const [dotX, dotY] = points[points.length - 1];

  return (
    <svg
      width={W}
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      className="price-sparkline"
      aria-label={`Trend ceny: ${first.toLocaleString("pl-PL")} → ${last.toLocaleString("pl-PL")} PLN`}
      role="img"
    >
      <polyline
        points={polyline}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
        opacity="0.85"
      />
      {/* Final price dot */}
      <circle cx={dotX} cy={dotY} r="2.5" fill={color} />
    </svg>
  );
}
