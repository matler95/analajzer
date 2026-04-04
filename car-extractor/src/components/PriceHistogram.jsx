import { useMemo } from "react";

/**
 * PriceHistogram — 120×24px bar chart showing price spread within a filter group.
 * Hovering shows the bucket range in a native SVG tooltip.
 */
export default function PriceHistogram({ prices }) {
  const { buckets, barW, barGap, minP, maxP } = useMemo(() => {
    const valid = prices.filter(p => p > 0);
    if (valid.length < 3) return { buckets: [], barW: 0, barGap: 0, minP: 0, maxP: 0 };

    const BINS  = 8;
    const minP  = Math.min(...valid);
    const maxP  = Math.max(...valid);
    const range = maxP - minP || 1;
    const step  = range / BINS;

    const counts = Array(BINS).fill(0);
    valid.forEach(p => {
      const idx = Math.min(Math.floor((p - minP) / step), BINS - 1);
      counts[idx]++;
    });

    const maxCount = Math.max(...counts);
    const W = 120, H = 24;
    const gap = 1;
    const barW = (W - gap * (BINS - 1)) / BINS;

    const buckets = counts.map((count, i) => {
      const height = maxCount ? Math.max(2, (count / maxCount) * H) : 2;
      const x = i * (barW + gap);
      const y = H - height;
      const lo = Math.round(minP + i * step);
      const hi = Math.round(minP + (i + 1) * step);
      return { x, y, height, count, lo, hi };
    });

    return { buckets, barW, barGap: gap, minP, maxP };
  }, [prices]);

  if (!buckets.length) return null;

  const fmtP = n => n.toLocaleString("pl-PL");

  return (
    <div className="price-hist-wrap" title={`Rozkład cen: ${fmtP(minP)} – ${fmtP(maxP)} PLN`}>
      <svg width={120} height={24} viewBox="0 0 120 24" className="price-hist-svg">
        {buckets.map((b, i) => (
          <g key={i}>
            <title>{`${fmtP(b.lo)}–${fmtP(b.hi)} PLN · ${b.count} szt.`}</title>
            <rect
              x={b.x} y={b.y}
              width={barW} height={b.height}
              rx="1"
              fill={b.count > 0 ? "var(--amber)" : "var(--border2)"}
              opacity={b.count > 0 ? 0.7 : 0.3}
              className="price-hist-bar"
            />
          </g>
        ))}
      </svg>
      <div className="price-hist-range">
        <span>{fmtP(minP)}</span>
        <span>{fmtP(maxP)} PLN</span>
      </div>
    </div>
  );
}
